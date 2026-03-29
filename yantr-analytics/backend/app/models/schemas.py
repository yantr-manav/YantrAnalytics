# -*- coding: utf-8 -*-
"""
Pydantic Models — Request & Response schemas.
Input validation prevents prompt injection and bad data.
"""

import re
from pydantic import BaseModel, field_validator
from typing import Optional


# ── Request Models ─────────────────────────────────────────────────────────────

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
        if not re.match(r'^[a-zA-Z0-9_\-\.]{3,50}$', v):
            raise ValueError("Handle must be 3-50 alphanumeric characters (letters, numbers, _ - .)")
        return f"@{v}"

    @field_validator("video_limit")
    @classmethod
    def clamp_limit(cls, v: int) -> int:
        return max(5, min(v, 50))


class CompetitorRequest(BaseModel):
    niche: str
    user_handle: str

    @field_validator("niche")
    @classmethod
    def clean_niche(cls, v: str) -> str:
        v = v.strip()[:100]
        return re.sub(r'[^\w\s\-]', '', v)


class TitleTestRequest(BaseModel):
    video_idea: str
    niche: str
    keywords: list[str] = []

    @field_validator("video_idea")
    @classmethod
    def clean_idea(cls, v: str) -> str:
        return v.strip()[:200]


class CalendarRequest(BaseModel):
    handle: str
    niche: str
    content_pillars: list[str] = []
    top_keywords: list[str] = []


# ── Response Models ────────────────────────────────────────────────────────────

class RadarScores(BaseModel):
    hook_strength: float = 5.0
    visual_quality: float = 5.0
    seo: float = 5.0
    engagement: float = 5.0
    consistency: float = 5.0
    community: float = 5.0


class ChannelStats(BaseModel):
    total_videos_scanned: int = 0
    total_shorts_scanned: int = 0
    total_posts_scanned: int = 0
    avg_views_videos: int = 0
    avg_views_shorts: int = 0
    dominant_format: str = "Videos"
    engagement_rate: float = 0.0
    upload_frequency_days: Optional[float] = None


class VideoItem(BaseModel):
    title: str
    views: int = 0
    likes: Optional[int] = None
    url: str = ""
    video_id: Optional[str] = None
    date: Optional[str] = None
    duration: int = 0
    thumbnail: str = ""
    type: str = "Video"


class ChannelProfile(BaseModel):
    handle: str
    subscribers: Optional[int] = None
    videos: list[VideoItem] = []
    shorts: list[VideoItem] = []
    community_posts: list[dict] = []
    stats: ChannelStats = ChannelStats()


class AnalysisResult(BaseModel):
    niche: str = "General"
    sub_niche: str = ""
    authority_type: str = "Educator"
    viral_probability_score: int = 50
    hook_score: int = 50
    content_pillars: list[str] = []
    top_keywords: list[str] = []
    radar_scores: RadarScores = RadarScores()
    growth_potential: str = "Medium"
    estimated_monthly_views: int = 0
    report_markdown: str = ""
