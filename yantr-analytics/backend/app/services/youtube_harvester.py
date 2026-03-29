# -*- coding: utf-8 -*-
"""
YouTube Harvester Service — Parallelized Edition
Uses concurrent.futures.ThreadPoolExecutor to run all yt-dlp calls in parallel.
Sequential calls were the #1 cause of timeouts (2-4 min). Parallel cuts it to <60s.
"""

import json
import subprocess
import time
import structlog
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeout

logger = structlog.get_logger(__name__)

# Global thread pool for subprocess operations — reused across requests
_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="ytdlp")


def _run_ytdlp(cmd: list, timeout: int = 45) -> str:
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
        logger.warning("ytdlp_timeout", cmd=" ".join(cmd[:4]))
        return ""
    except Exception as e:
        logger.error("ytdlp_error", error=str(e))
        return ""


def _fetch_tab_sync(handle: str, tab: str, limit: int) -> list[dict]:
    """
    Internal sync function — fetches one tab via yt-dlp streaming JSON.
    Called in thread pool, so safe to block here.
    """
    url = f"https://www.youtube.com/{handle}/{tab}"
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--no-check-certificate",
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
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        # Timeout the whole process read at 40 seconds
        import threading
        def _kill():
            try:
                process.kill()
            except Exception:
                pass
        timer = threading.Timer(40, _kill)
        timer.start()

        try:
            for line in process.stdout:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                    duration = item.get("duration", 0) or 0
                    vid_id = item.get("id", "")
                    items.append({
                        "title": (item.get("title") or item.get("description") or "Untitled")[:80],
                        "views": item.get("view_count") or 0,
                        "likes": item.get("like_count"),
                        "comments": item.get("comment_count"),
                        "url": item.get("url") or f"https://www.youtube.com/watch?v={vid_id}",
                        "video_id": vid_id,
                        "date": item.get("upload_date"),
                        "duration": duration,
                        "thumbnail": item.get("thumbnail") or f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg",
                        "type": "Short" if 0 < duration <= 60 else "Video",
                        "tab": tab
                    })
                except json.JSONDecodeError:
                    continue
        finally:
            timer.cancel()

        process.wait()
    except Exception as e:
        logger.warning("fetch_tab_error", tab=tab, error=str(e))
        if process:
            try:
                process.kill()
            except Exception:
                pass

    return items


def _get_subscriber_count_sync(handle: str) -> Optional[int]:
    """Best-effort subscriber count via yt-dlp."""
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--no-check-certificate",
        "--playlist-end", "1",
        "--print", "%(channel_follower_count)s",
        f"https://www.youtube.com/{handle}/videos"
    ]
    output = _run_ytdlp(cmd, timeout=20)
    try:
        val = output.strip()
        if val and val != "NA" and val.isdigit():
            return int(val)
    except Exception:
        pass
    return None


def fetch_channel_profile(handle: str) -> dict:
    """
    Full channel intelligence harvest — ALL tabs fetched IN PARALLEL.
    Uses ThreadPoolExecutor to run videos, shorts, community, and subscriber
    count simultaneously instead of sequentially.
    Total time: max(slowest_tab) instead of sum(all_tabs).
    """
    logger.info("profile_harvest_started", handle=handle)
    start = time.time()

    # ── Submit all tasks in parallel ──────────────────────────────────────────
    futures = {
        _executor.submit(_fetch_tab_sync, handle, "videos", 15): "videos",
        _executor.submit(_fetch_tab_sync, handle, "shorts", 15): "shorts",
        _executor.submit(_fetch_tab_sync, handle, "community", 5): "community",
        _executor.submit(_get_subscriber_count_sync, handle): "subscribers",
    }

    videos, shorts, community, subscribers = [], [], [], None

    for future in as_completed(futures, timeout=50):
        key = futures[future]
        try:
            result = future.result()
            if key == "videos":
                videos = result
            elif key == "shorts":
                shorts = result
            elif key == "community":
                community = result
            elif key == "subscribers":
                subscribers = result
        except Exception as e:
            logger.warning(f"parallel_fetch_error_{key}", error=str(e))

    # ── Compute stats ─────────────────────────────────────────────────────────
    avg_views_videos = sum(v["views"] for v in videos) / len(videos) if videos else 0
    avg_views_shorts = sum(s["views"] for s in shorts) / len(shorts) if shorts else 0

    total_items = videos + shorts
    engagement_rate = 0.0
    if total_items:
        items_with_likes = [v for v in total_items if v.get("likes")]
        if items_with_likes:
            engagement_rate = round(
                sum(v["likes"] / max(v["views"], 1) for v in items_with_likes) / len(items_with_likes) * 100, 2
            )

    upload_frequency_days = None
    dated = sorted([v for v in videos if v.get("date")], key=lambda x: x["date"], reverse=True)
    if len(dated) >= 2:
        try:
            from datetime import datetime
            dates = [datetime.strptime(v["date"], "%Y%m%d") for v in dated[:10]]
            deltas = [(dates[i] - dates[i+1]).days for i in range(len(dates)-1)]
            upload_frequency_days = round(sum(deltas) / len(deltas), 1) if deltas else None
        except Exception:
            pass

    elapsed = round((time.time() - start) * 1000, 1)
    logger.info("profile_harvest_complete", handle=handle,
                videos=len(videos), shorts=len(shorts), duration_ms=elapsed)

    return {
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
            "dominant_format": "Shorts" if avg_views_shorts > avg_views_videos else "Videos",
            "engagement_rate": engagement_rate,
            "upload_frequency_days": upload_frequency_days,
        }
    }


def _get_competitor_summary_sync(channel_url: str, limit: int = 3) -> list[dict]:
    """Quick summary of a competitor's recent content (reduced limit for speed)."""
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--no-check-certificate",
        "--playlist-end", str(limit),
        "--print", "%(title)s||%(view_count)s||%(duration)s||%(upload_date)s",
        channel_url
    ]
    output = _run_ytdlp(cmd, timeout=20)
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


def search_competitors(niche_keyword: str, limit: int = 5) -> list[dict]:
    """
    Uses yt-dlp YouTube search to find top channels in the same niche.
    Returns basic list — competitor summaries are fetched in parallel separately.
    """
    logger.info("competitor_search", keyword=niche_keyword)
    # Limit search to 2x to find enough unique channels
    search_query = f"ytsearch{limit * 2}: {niche_keyword} tutorial channel"
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--no-check-certificate",
        "--flat-playlist",
        "--print", "%(uploader)s||%(uploader_url)s||%(view_count)s",
        search_query
    ]

    output = _run_ytdlp(cmd, timeout=30)
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

        if url and url not in seen_urls and name:
            seen_urls.add(url)
            competitors.append({
                "name": name,
                "url": url,
                "sample_views": int(views) if views.isdigit() else 0
            })
            if len(competitors) >= limit:
                break

    logger.info("competitors_found", count=len(competitors))
    return competitors


def fetch_competitor_summaries_parallel(competitors: list[dict], videos_per_comp: int = 3) -> list[dict]:
    """
    Fetches recent videos for ALL competitors IN PARALLEL using executor.map.
    Simpler than dict-as-keys pattern, avoids 'unhashable type' edge cases.
    """
    if not competitors:
        return competitors

    urls = [c.get("url", "") for c in competitors]

    def _fetch(url: str) -> list[dict]:
        if not url:
            return []
        try:
            return _get_competitor_summary_sync(url, videos_per_comp)
        except Exception:
            return []

    try:
        with ThreadPoolExecutor(max_workers=min(len(urls), 4)) as exe:
            # map preserves order and raises on timeout
            results = list(exe.map(_fetch, urls, timeout=30))
    except Exception as e:
        logger.warning("competitor_map_failed", error=str(e))
        results = [[] for _ in competitors]

    for i, comp in enumerate(competitors):
        comp["recent_videos"] = results[i] if i < len(results) else []

    return competitors



# Keep old name for backward compat
def get_competitor_summary(channel_url: str, limit: int = 3) -> list[dict]:
    return _get_competitor_summary_sync(channel_url, limit)
