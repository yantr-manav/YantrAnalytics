# -*- coding: utf-8 -*-
"""
Trend Radar Service
Fetches rising YouTube search trends for a given niche keyword using pytrends.
Gracefully degrades if pytrends rate-limits.
"""

import time
import structlog
from typing import Optional

logger = structlog.get_logger(__name__)


def get_niche_trends(keyword: str, timeframe: str = "now 7-d") -> list[dict]:
    """
    Fetches rising search trends for a niche keyword on YouTube.
    Returns list of {query, value} dicts sorted by trend velocity.
    Returns [] on any failure — never crashes the app.
    """
    try:
        from pytrends.request import TrendReq

        logger.info("trend_fetch_start", keyword=keyword)
        start = time.time()

        pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, gprop="youtube")

        related = pytrends.related_queries()
        rising = []

        if related and keyword in related:
            top_df = related[keyword].get("top")
            rising_df = related[keyword].get("rising")

            # Prefer rising queries (breakout trends)
            if rising_df is not None and not rising_df.empty:
                for _, row in rising_df.head(15).iterrows():
                    val = row.get("value", 0)
                    if isinstance(val, str) and val == "Breakout":
                        val = 9999
                    rising.append({
                        "query": str(row["query"]),
                        "value": int(val) if str(val).isdigit() else 500,
                        "type": "rising"
                    })

            # Supplement with top queries
            if top_df is not None and not top_df.empty and len(rising) < 10:
                for _, row in top_df.head(10).iterrows():
                    rising.append({
                        "query": str(row["query"]),
                        "value": int(row.get("value", 0)),
                        "type": "top"
                    })

        elapsed = round((time.time() - start) * 1000, 1)
        logger.info("trend_fetch_complete", keyword=keyword, results=len(rising), duration_ms=elapsed)
        return rising[:20]

    except Exception as e:
        logger.warning("trend_fetch_failed_graceful", keyword=keyword, error=str(e))
        return []


def get_interest_over_time(keyword: str) -> list[dict]:
    """
    Gets Google Trends interest over time (last 90 days) for a keyword.
    Used for the trend sparkline in the dashboard.
    """
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
        pytrends.build_payload([keyword], timeframe="today 3-m", gprop="youtube")
        df = pytrends.interest_over_time()

        if df is None or df.empty or keyword not in df.columns:
            return []

        return [
            {"date": str(idx.date()), "value": int(row[keyword])}
            for idx, row in df.iterrows()
        ]
    except Exception as e:
        logger.warning("trend_interest_failed", keyword=keyword, error=str(e))
        return []
