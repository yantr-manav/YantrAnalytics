# -*- coding: utf-8 -*-
"""
Request/Response Models + Main Analysis Router
Input validation with Pydantic prevents prompt injection and bad data.
"""

# ── models/request_models.py ──────────────────────────────────────────────────
import re
from pydantic import BaseModel, field_validator
from typing import Optional


class AnalyzeRequest(BaseModel):
    handle: str
    include_shorts: bool = True
    include_community: bool = True
    video_limit: int = 20
    run_competitors: bool = True

    @field_validator("handle")
    @classmethod
    def sanitize_handle(cls, v: str) -> str:
        v = v.strip().lstrip("@").lstrip("/")
        # Block prompt injection patterns
        if any(bad in v.lower() for bad in ["ignore", "system", "prompt", "jailbreak", "<", ">"]):
            raise ValueError("Invalid handle: contains disallowed characters")
        # Must match YouTube handle pattern
        if not re.match(r'^[a-zA-Z0-9_\-\.]{3,50}$', v):
            raise ValueError("Handle must be 3-50 alphanumeric characters")
        return f"@{v}"

    @field_validator("video_limit")
    @classmethod
    def clamp_limit(cls, v: int) -> int:
        return max(5, min(v, 50))  # Hard cap at 50 to prevent abuse


class CompetitorRequest(BaseModel):
    niche: str
    user_handle: str

    @field_validator("niche")
    @classmethod
    def clean_niche(cls, v: str) -> str:
        v = v.strip()[:100]  # Hard cap niche string
        return re.sub(r'[^\w\s\-]', '', v)  # Remove special chars


# ── routers/analyze.py ────────────────────────────────────────────────────────
from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
import structlog

logger = structlog.get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# Import services (would be at top of actual file)
# from app.services.youtube_harvester import fetch_channel_profile, search_competitors, get_competitor_summary
# from app.services.gemini_brain import run_master_analysis, run_competitive_analysis, extract_mermaid_diagram
# from app.services.trend_radar import get_niche_trends
# from app.utils.cache import cache_get, cache_set


@router.post("/analyze")
@limiter.limit("10/minute")  # Guardrail: max 10 analyses per IP per minute
async def analyze_channel(request: Request, body: AnalyzeRequest):
    """
    Main intelligence pipeline endpoint.
    Flow: Validate → Cache check → Harvest → AI Analysis → Competitors → Trends → Response
    """
    handle = body.handle
    logger.info("analysis_requested", handle=handle, ip=request.client.host)

    # ── Cache Check ────────────────────────────────────────────────────────────
    # cache_key = f"analysis:{handle}"
    # cached = cache_get(cache_key)
    # if cached:
    #     logger.info("cache_hit", handle=handle)
    #     return cached

    try:
        # ── Step 1: Harvest Profile ────────────────────────────────────────────
        # profile = fetch_channel_profile(handle)
        # if not profile["videos"] and not profile["shorts"]:
        #     raise HTTPException(status_code=404, detail=f"No content found for {handle}. Check the handle is correct.")

        # ── Step 2: AI Master Analysis (1 Gemini call) ─────────────────────────
        # analysis = run_master_analysis(handle, profile)

        # ── Step 3: Competitor Discovery ───────────────────────────────────────
        # competitor_result = []
        # if body.run_competitors:
        #     competitors = search_competitors(analysis["niche"], limit=5)
        #     for comp in competitors:
        #         comp["recent_videos"] = get_competitor_summary(comp["url"])
        #     comp_report = run_competitive_analysis(handle, analysis, competitors)
        #     competitor_result = {"competitors": competitors, "report": comp_report}

        # ── Step 4: Trends ─────────────────────────────────────────────────────
        # trends = get_niche_trends(analysis["niche"])

        # ── Step 5: Mermaid Diagram ────────────────────────────────────────────
        # mermaid_code = extract_mermaid_diagram(analysis["content_pillars"], analysis["niche"])

        # ── Assemble Response ──────────────────────────────────────────────────
        result = {
            "handle": handle,
            "profile": "profile",       # Replace with: profile
            "analysis": "analysis",     # Replace with: analysis
            "competitors": "competitor_result",  # Replace with actual
            "trends": "trends",         # Replace with actual
            "mermaid_diagram": "mermaid_code",  # Replace with actual
        }

        # cache_set(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("analysis_pipeline_failed", handle=handle, error=str(e))
        raise HTTPException(status_code=500, detail="Analysis failed. The channel may be private or yt-dlp needs updating.")


# ── utils/cache.py ────────────────────────────────────────────────────────────
import time
from typing import Any

_cache: dict = {}
CACHE_TTL = int(3600)  # 1 hour default

def cache_get(key: str) -> Any:
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None

def cache_set(key: str, data: Any):
    _cache[key] = {"data": data, "ts": time.time()}

def cache_clear():
    _cache.clear()
