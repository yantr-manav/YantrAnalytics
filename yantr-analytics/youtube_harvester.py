# -*- coding: utf-8 -*-
"""
YouTube Harvester Service
Zero-cost data pipeline using yt-dlp.
Fetches videos, shorts, and community posts for any public channel.
"""

import json
import subprocess
import time
import structlog
from typing import Optional

logger = structlog.get_logger(__name__)

def _run_ytdlp(cmd: list, timeout: int = 60) -> str:
    """Safe subprocess wrapper with timeout and error capture."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout
        )
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        logger.error("ytdlp_timeout", cmd=" ".join(cmd[:4]))
        return ""
    except Exception as e:
        logger.error("ytdlp_error", error=str(e))
        return ""


def fetch_tab_data(handle: str, tab: str, limit: int = 20) -> list[dict]:
    """
    Fetches metadata from a specific YouTube channel tab.
    Tabs: videos | shorts | community
    """
    url = f"https://www.youtube.com/{handle}/{tab}"
    logger.info("fetching_tab", handle=handle, tab=tab, limit=limit)
    start = time.time()

    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "-j",
        "--flat-playlist",
        "--playlist-end", str(limit),
        url
    ]

    items = []
    process = None
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        for line in process.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                duration = item.get("duration", 0) or 0
                items.append({
                    "title": item.get("title") or item.get("description", "Untitled")[:80],
                    "views": item.get("view_count") or 0,
                    "likes": item.get("like_count"),
                    "comments": item.get("comment_count"),
                    "url": item.get("url") or f"https://www.youtube.com/watch?v={item.get('id', '')}",
                    "video_id": item.get("id"),
                    "date": item.get("upload_date"),
                    "duration": duration,
                    "type": "Short" if 0 < duration <= 60 else "Video",
                    "tab": tab
                })
            except json.JSONDecodeError:
                continue

        process.wait()
    except Exception as e:
        logger.error("fetch_tab_error", tab=tab, error=str(e))
        if process:
            process.kill()

    elapsed = round((time.time() - start) * 1000, 1)
    logger.info("tab_fetched", tab=tab, items=len(items), duration_ms=elapsed)
    return items


def fetch_channel_profile(handle: str) -> dict:
    """
    Full channel intelligence harvest: videos + shorts + community posts.
    Returns aggregated profile dict.
    """
    logger.info("profile_harvest_started", handle=handle)
    start = time.time()

    videos = fetch_tab_data(handle, "videos", limit=20)
    shorts = fetch_tab_data(handle, "shorts", limit=20)
    community = fetch_tab_data(handle, "community", limit=10)

    # Channel-level subscriber count (best-effort from first video metadata)
    subscribers = _get_subscriber_count(handle)

    avg_views_videos = (
        sum(v["views"] for v in videos) / len(videos) if videos else 0
    )
    avg_views_shorts = (
        sum(s["views"] for s in shorts) / len(shorts) if shorts else 0
    )

    profile = {
        "handle": handle,
        "subscribers": subscribers,
        "videos": videos,
        "shorts": shorts,
        "community_posts": community,
        "stats": {
            "total_videos_scanned": len(videos),
            "total_shorts_scanned": len(shorts),
            "total_posts_scanned": len(community),
            "avg_views_videos": round(avg_views_videos),
            "avg_views_shorts": round(avg_views_shorts),
            "dominant_format": "Shorts" if avg_views_shorts > avg_views_videos else "Videos"
        }
    }

    elapsed = round((time.time() - start) * 1000, 1)
    logger.info("profile_harvest_complete", handle=handle, total_items=len(videos)+len(shorts), duration_ms=elapsed)
    return profile


def _get_subscriber_count(handle: str) -> Optional[int]:
    """Best-effort subscriber count via yt-dlp channel page."""
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--playlist-end", "1",
        "--print", "%(channel_follower_count)s",
        f"https://www.youtube.com/{handle}/videos"
    ]
    output = _run_ytdlp(cmd, timeout=30)
    try:
        val = output.strip()
        if val and val != "NA" and val.isdigit():
            return int(val)
    except Exception:
        pass
    return None


def search_competitors(niche_keyword: str, limit: int = 5) -> list[dict]:
    """
    Uses yt-dlp YouTube search to find top channels in the same niche.
    Zero-cost alternative to SERP APIs.
    """
    logger.info("competitor_search", keyword=niche_keyword)
    search_query = f"ytsearch{limit}: {niche_keyword} tutorial channel"
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--flat-playlist",
        "--print", "%(uploader)s||%(uploader_url)s||%(view_count)s",
        search_query
    ]

    output = _run_ytdlp(cmd, timeout=45)
    competitors = []
    seen_urls = set()

    for line in output.split("\n"):
        if "||" not in line:
            continue
        parts = line.split("||")
        if len(parts) < 2:
            continue
        name, url = parts[0].strip(), parts[1].strip()
        views = parts[2].strip() if len(parts) > 2 else "0"

        if url and url not in seen_urls:
            seen_urls.add(url)
            competitors.append({
                "name": name,
                "url": url,
                "sample_views": int(views) if views.isdigit() else 0
            })

    logger.info("competitors_found", count=len(competitors))
    return competitors


def get_competitor_summary(channel_url: str, limit: int = 5) -> list[dict]:
    """Quick summary of a competitor's recent content."""
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--playlist-end", str(limit),
        "--print", "%(title)s||%(view_count)s||%(duration)s||%(upload_date)s",
        channel_url
    ]
    output = _run_ytdlp(cmd, timeout=30)
    items = []
    for line in output.split("\n"):
        if "||" not in line:
            continue
        parts = line.split("||")
        if len(parts) < 2:
            continue
        items.append({
            "title": parts[0].strip(),
            "views": int(parts[1]) if parts[1].strip().isdigit() else 0,
            "duration": int(parts[2]) if len(parts) > 2 and parts[2].strip().isdigit() else 0,
            "date": parts[3].strip() if len(parts) > 3 else None
        })
    return items
