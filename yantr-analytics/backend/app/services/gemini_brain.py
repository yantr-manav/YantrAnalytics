# -*- coding: utf-8 -*-
"""
Gemini Brain Service
All AI prompts are batched into single calls to minimize quota usage.
Exponential backoff retry logic handles rate limits gracefully.
"""

import os
import json
import time
import re
import httpx
import structlog
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception
from google import genai
from dotenv import load_dotenv

# Load .env from backend/ directory
_backend_dir = Path(__file__).resolve().parent.parent.parent  # services/../../ = backend/
load_dotenv(_backend_dir / ".env", override=False)
logger = structlog.get_logger(__name__)

_api_key = os.getenv("GEMINI_API_KEY", "")
client = genai.Client(api_key=_api_key) if _api_key else None
MODEL = "gemini-2.5-flash"  # stable model available on free tier
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("Groq_API_KEY") or ""
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def is_quota_error(error: Exception | str) -> bool:
    msg = str(error).lower()
    return (
        "resource_exhausted" in msg
        or ("quota" in msg and "exceeded" in msg)
        or "429" in msg
    )


def _should_retry_gemini(exc: Exception) -> bool:
    # Do not retry quota exhaustion here; we fallback to Groq immediately.
    return not is_quota_error(exc)


def build_fallback_analysis(handle: str, profile: dict, reason: str = "") -> dict:
    """
    Deterministic fallback analysis when Gemini quota is unavailable.
    Keeps API contract intact so frontend can still render a full report.
    """
    videos = profile.get("videos", [])[:15]
    shorts = profile.get("shorts", [])[:10]
    stats = profile.get("stats", {})

    titles = [v.get("title", "") for v in videos + shorts if v.get("title")]
    words: dict[str, int] = {}
    stop = {
        "the", "and", "for", "with", "this", "that", "from", "your", "you", "how",
        "what", "when", "why", "into", "about", "are", "was", "will", "video", "shorts"
    }
    for t in titles:
        for w in re.findall(r"[a-zA-Z]{4,}", t.lower()):
            if w in stop:
                continue
            words[w] = words.get(w, 0) + 1

    top_keywords = [k for k, _ in sorted(words.items(), key=lambda kv: kv[1], reverse=True)[:5]]
    if not top_keywords:
        top_keywords = ["content", "growth", "strategy", "youtube", "creator"]

    niche = "General"
    if top_keywords:
        niche = top_keywords[0].capitalize()

    avg_views = int(stats.get("avg_views_videos", 0) or 0)
    avg_shorts = int(stats.get("avg_views_shorts", 0) or 0)
    engagement = float(stats.get("engagement_rate", 0) or 0)
    viral_score = max(20, min(85, int((engagement * 12) + (avg_views / 5000) + (avg_shorts / 7000))))
    hook_score = max(25, min(80, int((engagement * 10) + 35)))

    report_markdown = f"""
## Channel Intelligence Report: {handle}

### Status
Gemini quota is currently exhausted, so this report is generated using local heuristics.
You can keep using the app; AI-rich sections will return once quota resets.

### Snapshot
- Dominant format: {stats.get('dominant_format', 'Videos')}
- Avg views (videos): {avg_views:,}
- Avg views (shorts): {avg_shorts:,}
- Engagement rate: {engagement}%

### Fast Recommendations
1. Publish around these likely high-signal keywords: {', '.join(top_keywords)}.
2. Increase first-10-second hook intensity in both titles and openings.
3. Keep upload cadence consistent and batch related topics into mini-series.

### Quota Note
Reason: {reason[:200] if reason else 'Gemini API quota limit reached.'}
""".strip()

    return {
        "niche": niche,
        "sub_niche": "Heuristic Fallback",
        "authority_type": "Educator",
        "viral_probability_score": viral_score,
        "hook_score": hook_score,
        "content_pillars": top_keywords[:3],
        "top_keywords": top_keywords,
        "radar_scores": {
            "hook_strength": round(min(10, max(3, hook_score / 10)), 1),
            "visual_quality": 6.0,
            "seo": 5.5,
            "engagement": round(min(10, max(2, engagement * 2)), 1),
            "consistency": 6.0,
            "community": 5.0,
        },
        "growth_potential": "Medium" if viral_score < 65 else "High",
        "estimated_monthly_views": int((avg_views * 8) + (avg_shorts * 15)),
        "report_markdown": report_markdown,
    }


@retry(
    retry=retry_if_exception(_should_retry_gemini),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=20),
    reraise=True
)
def _call_gemini(prompt: str, max_tokens: int = 3000) -> str:
    """
    Core Gemini call with retry on quota exhaustion.
    Uses tenacity for exponential backoff — never crashes the app.
    """
    if not client:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env")

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
    except Exception as e:
        err_str = str(e)
        if is_quota_error(e):
            # Intentionally avoid noisy repeated warnings; fallback provider handles this.
            logger.info("gemini_quota_exhausted", error=err_str[:120])
        else:
            logger.error("gemini_unexpected_error", error=err_str[:200])
        raise


def _call_groq(prompt: str, max_tokens: int = 3000) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set")

    logger.info("groq_call_start", model=GROQ_MODEL, prompt_chars=len(prompt))
    start = time.time()
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "You are a precise analysis assistant."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": max_tokens,
    }

    with httpx.Client(timeout=90) as hc:
        r = hc.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()

    text = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not text:
        raise RuntimeError("Groq returned empty response")

    elapsed = round((time.time() - start) * 1000, 1)
    logger.info("groq_call_success", duration_ms=elapsed, response_chars=len(text))
    return text


def _call_llm(prompt: str, max_tokens: int = 3000) -> str:
    """
    Provider chain:
    1) Gemini (preferred)
    2) Groq fallback
    """
    gemini_error = None
    try:
        return _call_gemini(prompt, max_tokens=max_tokens)
    except Exception as e:
        gemini_error = e
        logger.info("llm_provider_fallback", from_provider="gemini", to_provider="groq")

    try:
        return _call_groq(prompt, max_tokens=max_tokens)
    except Exception as groq_error:
        logger.error(
            "llm_all_providers_failed",
            gemini_error=str(gemini_error)[:200] if gemini_error else "",
            groq_error=str(groq_error)[:200],
        )
        raise RuntimeError(f"All LLM providers failed. Gemini: {gemini_error}; Groq: {groq_error}")


def _parse_json_from_response(raw: str) -> tuple[dict, str]:
    """
    Extracts the first JSON object found in the response, returns (json_dict, remaining_markdown).
    Handles cases where Gemini wraps JSON in ```json fences.
    """
    import re
    # Try to find JSON in ```json ... ``` fence
    fence_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
    if fence_match:
        try:
            json_data = json.loads(fence_match.group(1))
            rest = raw[fence_match.end():].strip()
            return json_data, rest
        except json.JSONDecodeError:
            pass

    # Try line-by-line for a standalone JSON object
    lines = raw.strip().split("\n")
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            try:
                return json.loads(stripped), "\n".join(lines[i+1:]).strip()
            except json.JSONDecodeError:
                pass

    # Try multi-line JSON
    for i, line in enumerate(lines):
        if line.strip().startswith("{"):
            for j in range(i+1, len(lines)+1):
                candidate = "\n".join(lines[i:j])
                try:
                    data = json.loads(candidate)
                    return data, "\n".join(lines[j:]).strip()
                except json.JSONDecodeError:
                    continue

    return {}, raw


def run_master_analysis(handle: str, profile: dict) -> dict:
    """
    SINGLE Gemini call that extracts: niche, analysis, action plan, and full report.
    Batching into 1 call saves 2/3 of daily quota.
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

PART 1 — JSON (one line only, no code fences):
{{"niche": "...", "sub_niche": "...", "authority_type": "Expert|Entertainer|Educator|Curator", "viral_probability_score": 0-100, "hook_score": 0-100, "content_pillars": ["pillar1", "pillar2", "pillar3"], "top_keywords": ["kw1","kw2","kw3","kw4","kw5"], "radar_scores": {{"hook_strength": 0-10, "visual_quality": 0-10, "seo": 0-10, "engagement": 0-10, "consistency": 0-10, "community": 0-10}}, "growth_potential": "Low|Medium|High|Explosive", "estimated_monthly_views": 0}}

PART 2 — Markdown Report (immediately after the JSON line):

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

    raw = _call_llm(prompt)
    json_data, report_markdown = _parse_json_from_response(raw)

    return {
        "niche": json_data.get("niche", "General"),
        "sub_niche": json_data.get("sub_niche", ""),
        "authority_type": json_data.get("authority_type", "Educator"),
        "viral_probability_score": json_data.get("viral_probability_score", 50),
        "hook_score": json_data.get("hook_score", 50),
        "content_pillars": json_data.get("content_pillars", []),
        "top_keywords": json_data.get("top_keywords", []),
        "radar_scores": json_data.get("radar_scores", {}),
        "growth_potential": json_data.get("growth_potential", "Medium"),
        "estimated_monthly_views": json_data.get("estimated_monthly_views", 0),
        "report_markdown": report_markdown
    }


def run_competitive_analysis(user_handle: str, user_analysis: dict, competitors_data: list[dict]) -> str:
    """
    Second Gemini call — generates the comparative benchmarking report.
    Only triggered when competitor data is ready.
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

# Market Benchmarking: {user_handle} vs Top Competitors

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
[2 specific content angles that competitors are IGNORING but the audience craves.]

## Competitor Strengths to Learn From
[For each top competitor: one specific tactic to adopt immediately]

## First-Mover Strategy
[1 specific content piece user can publish this week that no competitor has covered yet]

Be brutally specific. Reference actual competitor names and actual content topics.
"""

    return _call_llm(prompt)


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
    raw = _call_llm(prompt, max_tokens=500)
    raw = raw.replace("```mermaid", "").replace("```", "").strip()
    return raw


def generate_content_calendar(handle: str, niche: str, analysis: dict, competitors: list[dict]) -> dict:
    """
    LLM call to generate a 30-day content calendar.
    Based on competitor upload patterns and trend windows.
    Returns the parsed JSON object: {"calendar": [...], "weekly_theme": {...}}.
    """
    comp_patterns = []
    for c in competitors[:3]:
        videos = c.get("recent_videos", [])[:5]
        comp_patterns.append(f"{c['name']}: {json.dumps([v['title'] for v in videos])}")

    prompt = f"""
You are a content strategist building a 30-day YouTube publishing calendar.

CREATOR: {handle}
NICHE: {niche}
CONTENT PILLARS: {json.dumps(analysis.get('content_pillars', []))}
TOP KEYWORDS: {json.dumps(analysis.get('top_keywords', []))}
DOMINANT FORMAT: {analysis.get('authority_type', 'Educator')}
COMPETITOR RECENT CONTENT:
{chr(10).join(comp_patterns)}

Generate a 30-day content calendar in this EXACT JSON format:
{{
  "calendar": [
    {{
      "day": 1,
      "date_label": "Day 1",
      "format": "Long-form Video|Short|Community Post",
      "title": "Exact video/post title",
      "hook": "First sentence hook",
      "rationale": "Why this will perform"
    }}
  ],
  "weekly_theme": {{
    "week1": "theme description",
    "week2": "theme description",
    "week3": "theme description",
    "week4": "theme description"
  }}
}}

Create 30 entries mixing formats. Focus on trending angles in the niche.
"""
    raw = _call_llm(prompt)
    json_data, _ = _parse_json_from_response(raw)
    return json_data


def generate_title_variations(video_idea: str, niche: str, keywords: list[str]) -> list[dict]:
    """
    A/B title tester: generates 5 title variations with CTR predictions.
    """
    prompt = f"""
You are a YouTube title optimization expert with 10 years of A/B testing experience.

VIDEO IDEA: {video_idea}
NICHE: {niche}
TOP KEYWORDS: {json.dumps(keywords)}

Generate exactly 5 title variations. Return ONLY this JSON (no explanation):
{{
  "titles": [
    {{
      "title": "Title text here",
      "ctr_score": 0-100,
      "hook_type": "Curiosity Gap|Numbered List|How-To|Controversy|Story",
      "seo_keywords_used": ["kw1", "kw2"],
      "why_it_works": "Brief 1-sentence explanation"
    }}
  ]
}}

Rank them from highest to lowest CTR score. Be specific and creative.
"""
    raw = _call_llm(prompt, max_tokens=1000)
    json_data, _ = _parse_json_from_response(raw)
    return json_data.get("titles", [])
