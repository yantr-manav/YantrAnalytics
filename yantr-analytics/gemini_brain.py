# -*- coding: utf-8 -*-
"""
Gemini Brain Service
All AI prompts are batched into single calls to minimize quota usage.
Exponential backoff retry logic handles rate limits gracefully.
"""

import os
import json
import time
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google import genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable
from dotenv import load_dotenv

load_dotenv()
logger = structlog.get_logger(__name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.5-flash"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=20),
    retry=retry_if_exception_type((ResourceExhausted, ServiceUnavailable)),
    reraise=True
)
def _call_gemini(prompt: str, max_tokens: int = 2000) -> str:
    """
    Core Gemini call with retry on quota exhaustion.
    Uses tenacity for exponential backoff — never crashes the app.
    """
    logger.info("gemini_call_start", model=MODEL, prompt_chars=len(prompt))
    start = time.time()
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )
        elapsed = round((time.time() - start) * 1000, 1)
        logger.info("gemini_call_success", duration_ms=elapsed, response_chars=len(response.text))
        return response.text
    except ResourceExhausted:
        logger.warning("gemini_quota_exceeded_retrying")
        raise
    except Exception as e:
        logger.error("gemini_unexpected_error", error=str(e))
        raise


def run_master_analysis(handle: str, profile: dict) -> dict:
    """
    SINGLE Gemini call that extracts: niche, analysis, and action plan.
    Batching into 1 call saves 2/3 of your daily quota.
    """
    videos = profile.get("videos", [])[:15]
    shorts = profile.get("shorts", [])[:10]
    community = profile.get("community_posts", [])[:5]
    stats = profile.get("stats", {})

    video_titles = [v["title"] for v in videos]
    short_titles = [s["title"] for s in shorts]

    prompt = f"""
You are a Senior Social Media Data Scientist and Creator Growth Strategist.
Analyze this YouTube channel and return a JSON object followed by a detailed Markdown report.

CHANNEL: {handle}
SUBSCRIBER COUNT: {profile.get('subscribers', 'Unknown')}
STATS: {json.dumps(stats)}
RECENT VIDEO TITLES (last 15): {json.dumps(video_titles)}
RECENT SHORT TITLES (last 10): {json.dumps(short_titles)}
COMMUNITY POSTS (last 5): {json.dumps([p['title'] for p in community])}

REQUIRED OUTPUT — Return this EXACTLY in two parts:

PART 1 — JSON (for frontend charts, one line):
{{"niche": "...", "sub_niche": "...", "authority_type": "Expert|Entertainer|Educator|Curator", "viral_probability_score": 0-100, "hook_score": 0-100, "content_pillars": ["pillar1", "pillar2", "pillar3"], "top_keywords": ["kw1","kw2","kw3","kw4","kw5"], "radar_scores": {{"hook_strength": 0-10, "visual_quality": 0-10, "seo": 0-10, "engagement": 0-10, "consistency": 0-10, "community": 0-10}}}}

PART 2 — Markdown Report (after the JSON line):

## Channel Intelligence Report: {handle}

### Market Positioning
[Precise sub-niche, channel authority type, unique positioning]

### Content Engine Diagnostics
[Shorts vs long-form performance, community engagement tone, upload patterns]

### Competitive Moat
[Why people subscribe to THIS creator — the USP]

### Content Gap Analysis
[What is missing that the audience is hungry for]

### Hook Optimization
[Specific improvements to title structure and first-sentence hooks]

### Viral Architecture: Next Video Blueprint
**60-second Short script:**
[Hook (0-3s): ...] [Value (3-45s): ...] [CTA (45-60s): ...]

**10-minute video outline:**
[Title suggestion, 5-section outline with timestamps]

### Monetization Strategy
[3 specific monetization angles beyond AdSense for this niche]

### 7-Day Elite Action Plan
| Day | Task | Why It Works |
|-----|------|-------------|
| Day 1 | ... | ... |
[Fill all 7 days]

Be specific. No generic advice. Reference the actual content titles you saw.
"""

    raw = _call_gemini(prompt)

    # Parse: first line is JSON, rest is Markdown
    lines = raw.strip().split("\n")
    json_data = {}
    markdown_start = 0

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            try:
                json_data = json.loads(stripped)
                markdown_start = i + 1
                break
            except json.JSONDecodeError:
                pass

    report_markdown = "\n".join(lines[markdown_start:]).strip()

    return {
        "niche": json_data.get("niche", "General"),
        "sub_niche": json_data.get("sub_niche", ""),
        "authority_type": json_data.get("authority_type", "Educator"),
        "viral_probability_score": json_data.get("viral_probability_score", 50),
        "hook_score": json_data.get("hook_score", 50),
        "content_pillars": json_data.get("content_pillars", []),
        "top_keywords": json_data.get("top_keywords", []),
        "radar_scores": json_data.get("radar_scores", {}),
        "report_markdown": report_markdown
    }


def run_competitive_analysis(user_handle: str, user_analysis: dict, competitors_data: list[dict]) -> str:
    """
    Second Gemini call (only triggered when competitor data is ready).
    Generates the comparative benchmarking report in Markdown.
    """
    comp_summary = "\n".join([
        f"COMPETITOR: {c['name']}\nRECENT CONTENT: {json.dumps(c.get('recent_videos', []))}\n"
        for c in competitors_data[:5]
    ])

    prompt = f"""
You are a Chief Content Strategist at a top creator agency.

USER: {user_handle}
USER NICHE: {user_analysis.get('niche')}
USER RADAR SCORES: {json.dumps(user_analysis.get('radar_scores', {}))}
USER KEYWORDS: {json.dumps(user_analysis.get('top_keywords', []))}

COMPETITOR DATASET:
{comp_summary}

Generate a COMPETITIVE INTELLIGENCE REPORT in Markdown:

# Market Benchmarking: {user_handle} vs Top 5

## Comparative Metrics Table
| Metric | {user_handle} | Market Average | The Gap | How to Close It |
|--------|--------------|----------------|---------|-----------------|
| Hook Velocity | | | | |
| Content Depth | | | | |
| SEO Optimization | | | | |
| Upload Consistency | | | | |
| Engagement Bait | | | | |
| Thumbnail Psychology | | | | |

## Retention Science Audit
[Why are competitors getting more views? Analyze editing rhythm, curiosity gaps, first 5 seconds.]

## The Blue Ocean Opportunity
[2 specific content angles that competitors are IGNORING but the audience craves. 
These must be based on the actual keyword gaps you see in the competitor titles.]

## Competitor Strengths to Learn From
[For each top competitor: one specific tactic that user should adopt immediately]

## First-Mover Strategy
[Specific content piece user can publish this week that no competitor has covered yet]

Be brutally specific. Reference actual competitor names and actual content topics.
"""

    return _call_gemini(prompt)


def extract_mermaid_diagram(content_pillars: list[str], niche: str) -> str:
    """Generates Mermaid.js diagram code for content architecture."""
    prompt = f"""
Generate ONLY valid Mermaid.js code (no explanation, no markdown fences) for a content pillar tree diagram.
Channel niche: {niche}
Content pillars: {json.dumps(content_pillars)}

Output format — start with 'graph TD' and include 8-12 nodes total.
Example structure:
graph TD
    A[Channel Brand] --> B(Pillar 1)
    A --> C(Pillar 2)
    B --> D[Sub-topic 1a]
    B --> E[Sub-topic 1b]
"""
    raw = _call_gemini(prompt, max_tokens=500)
    # Clean up in case model wraps in fences
    raw = raw.replace("```mermaid", "").replace("```", "").strip()
    return raw
