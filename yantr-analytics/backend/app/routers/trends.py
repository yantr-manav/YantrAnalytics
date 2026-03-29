# -*- coding: utf-8 -*-
"""
Trends Router — Niche trend detection via pytrends + YouTube signals.
"""

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import structlog
import re

from app.services.trend_radar import get_niche_trends, get_interest_over_time

logger = structlog.get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.get("/trends")
@limiter.limit("20/minute")
async def get_trends(request: Request, keyword: str):
    """
    Returns rising YouTube search trends for a given keyword/niche.
    Gracefully returns empty list if pytrends rate-limits.
    """
    # Sanitize keyword
    keyword = keyword.strip()[:100]
    keyword = re.sub(r'[<>"\']', '', keyword)
    if not keyword:
        raise HTTPException(status_code=400, detail="keyword parameter is required")

    logger.info("trends_requested", keyword=keyword)

    trends = get_niche_trends(keyword)
    sparkline = get_interest_over_time(keyword)

    return {
        "keyword": keyword,
        "trends": trends,
        "sparkline": sparkline,
        "total": len(trends)
    }
