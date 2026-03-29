# -*- coding: utf-8 -*-
"""
Transcript Parser Service
Fetches the first 30 seconds of competitor video transcripts via youtube-transcript-api
and analyzes hook structure using Gemini AI.
"""

import structlog
from typing import Optional

logger = structlog.get_logger(__name__)


def get_video_transcript(video_id: str, max_seconds: int = 30) -> Optional[str]:
    """
    Fetches transcript for a YouTube video, truncated to first N seconds.
    Returns None if transcript unavailable.
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled

        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "en-US", "en-GB"])

        # Collect text for the first max_seconds
        hook_text = []
        for entry in transcript_list:
            if entry["start"] > max_seconds:
                break
            hook_text.append(entry["text"])

        return " ".join(hook_text).strip() if hook_text else None

    except Exception as e:
        logger.debug("transcript_unavailable", video_id=video_id, error=str(e))
        return None


def analyze_competitor_hooks(competitor_videos: list[dict]) -> dict:
    """
    Fetches transcripts for top competitor videos and analyzes hook patterns.
    Returns analysis dict with hook patterns and recommendations.
    """
    hooks_collected = []

    for video in competitor_videos[:5]:
        video_id = video.get("video_id") or _extract_video_id(video.get("url", ""))
        if not video_id:
            continue

        transcript = get_video_transcript(video_id)
        if transcript:
            hooks_collected.append({
                "title": video.get("title", "Unknown"),
                "views": video.get("views", 0),
                "hook_text": transcript[:300]
            })

    if not hooks_collected:
        return {
            "hooks_analyzed": 0,
            "common_patterns": [],
            "hook_recommendation": "Unable to analyze hooks — transcripts not publicly available for these videos.",
            "avg_hook_score": 0
        }

    # Use Gemini to analyze the hooks
    try:
        from app.services.gemini_brain import _call_gemini
        import json

        hooks_json = json.dumps(hooks_collected, indent=2)
        prompt = f"""
You are a YouTube hook optimization expert. Analyze these competitor video openings:

{hooks_json}

Return ONLY this JSON (no code fences):
{{
  "common_patterns": ["pattern1", "pattern2", "pattern3"],
  "winning_formula": "1-2 sentence formula that all high-view hooks share",
  "hook_recommendation": "Specific actionable hook template for this niche",
  "avg_hook_score": 0-100,
  "hooks_analyzed": {len(hooks_collected)}
}}
"""
        raw = _call_gemini(prompt, max_tokens=500)
        from app.services.gemini_brain import _parse_json_from_response
        result, _ = _parse_json_from_response(raw)
        result["hooks_analyzed"] = len(hooks_collected)
        return result

    except Exception as e:
        logger.error("hook_analysis_failed", error=str(e))
        return {
            "hooks_analyzed": len(hooks_collected),
            "common_patterns": [],
            "hook_recommendation": "Error during AI analysis.",
            "avg_hook_score": 0
        }


def _extract_video_id(url: str) -> Optional[str]:
    """Extracts YouTube video ID from various URL formats."""
    import re
    patterns = [
        r"youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})",
        r"youtu\.be/([a-zA-Z0-9_-]{11})",
        r"youtube\.com/shorts/([a-zA-Z0-9_-]{11})"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None
