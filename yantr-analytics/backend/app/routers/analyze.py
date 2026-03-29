# -*- coding: utf-8 -*-
"""
Main Analysis Router — Fully Activated Pipeline (Async-Safe Edition)
All blocking operations run in a thread pool via asyncio.run_in_executor
to prevent event loop starvation and client-side timeouts.

Pipeline: Validate → Cache → Parallel Harvest → AI → Parallel Competitors → Trends → Diagram
"""

import asyncio
from functools import partial
from fastapi import APIRouter, Request, HTTPException
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter
from slowapi.util import get_remote_address
import structlog

from app.models.schemas import AnalyzeRequest
from app.services.youtube_harvester import (
    fetch_channel_profile,
    search_competitors,
    fetch_competitor_summaries_parallel,
)
from app.services.gemini_brain import (
    run_master_analysis,
    run_competitive_analysis,
    extract_mermaid_diagram,
    build_fallback_analysis,
    is_quota_error,
)
from app.services.trend_radar import get_niche_trends
from app.utils.cache import cache_get, cache_set

logger = structlog.get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_channel(request: Request, body: AnalyzeRequest):
    """
    Main intelligence pipeline — all blocking calls run in threadpool.
    Steps 3 (competitors) and 4 (trends) run concurrently via asyncio.gather.
    """
    handle = body.handle
    logger.info("analysis_requested", handle=handle, ip=request.client.host if request.client else "unknown")

    # ── Cache Check ──────────────────────────────────────────────────────────
    cache_key = f"analysis:{handle}"
    cached = cache_get(cache_key)
    if cached:
        logger.info("cache_hit", handle=handle)
        cached["cached"] = True
        return cached

    try:
        # ── Step 1: Harvest Profile (parallel tabs inside) ───────────────────
        # fetch_channel_profile already parallelizes videos+shorts+community+subs
        logger.info("step_1_harvest_parallel", handle=handle)
        profile = await run_in_threadpool(fetch_channel_profile, handle)

        if not profile["videos"] and not profile["shorts"]:
            raise HTTPException(
                status_code=404,
                detail=f"No content found for {handle}. "
                       f"Check the handle is correct and the channel is public."
            )

        # ── Step 2: AI Master Analysis ───────────────────────────────────────
        logger.info("step_2_ai_analysis", handle=handle)
        quota_fallback = False
        try:
            analysis = await run_in_threadpool(run_master_analysis, handle, profile)
        except Exception as e:
            if is_quota_error(e):
                quota_fallback = True
                logger.warning("gemini_quota_fallback_mode", handle=handle)
                analysis = build_fallback_analysis(handle, profile, reason=str(e))
            else:
                raise

        # ── Steps 3 + 4: Competitors AND Trends in PARALLEL ─────────────────
        async def _get_competitors():
            if not body.run_competitors:
                return {"competitors": [], "report": ""}
            comps = await run_in_threadpool(search_competitors, analysis["niche"], 4)
            if comps:
                # Fetch all competitor videos in parallel
                comps = await run_in_threadpool(fetch_competitor_summaries_parallel, comps, 3)
                if quota_fallback:
                    report = (
                        "# Competitive Intelligence\n\n"
                        "Gemini quota is currently exhausted. Competitor channels were fetched, "
                        "but AI narrative benchmarking is temporarily unavailable."
                    )
                else:
                    report = await run_in_threadpool(run_competitive_analysis, handle, analysis, comps)
                return {"competitors": comps, "report": report}
            return {"competitors": [], "report": ""}

        async def _get_trends():
            return await run_in_threadpool(get_niche_trends, analysis["niche"])

        logger.info("step_3_4_parallel", handle=handle)
        competitor_result, trends = await asyncio.gather(
            _get_competitors(),
            _get_trends(),
            return_exceptions=True  # Don't let one failure kill the other
        )

        # Handle exceptions from gather gracefully
        if isinstance(competitor_result, Exception):
            logger.warning("competitors_failed_graceful", error=str(competitor_result))
            competitor_result = {"competitors": [], "report": ""}
        if isinstance(trends, Exception):
            logger.warning("trends_failed_graceful", error=str(trends))
            trends = []

        # ── Step 5: Mermaid Diagram (non-critical, fast) ─────────────────────
        mermaid_code = ""
        if analysis.get("content_pillars") and not quota_fallback:
            try:
                mermaid_code = await run_in_threadpool(
                    extract_mermaid_diagram,
                    analysis["content_pillars"],
                    analysis["niche"]
                )
            except Exception:
                pass  # Non-critical

        # ── Assemble & Cache Response ────────────────────────────────────────
        result = {
            "handle": handle,
            "profile": profile,
            "analysis": analysis,
            "competitors": competitor_result,
            "trends": trends,
            "mermaid_diagram": mermaid_code,
            "cached": False,
        }

        cache_set(cache_key, result)
        logger.info("analysis_complete", handle=handle)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("analysis_pipeline_failed", handle=handle, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)[:200]}. "
                   f"The channel may be private or yt-dlp needs updating."
        )


@router.delete("/cache/{handle}")
async def clear_cache(handle: str):
    """Force-refresh cache for a specific handle."""
    from app.utils.cache import cache_delete
    cache_key = f"analysis:@{handle.lstrip('@')}"
    cache_delete(cache_key)
    return {"message": f"Cache cleared for {handle}"}
