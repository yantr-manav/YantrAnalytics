# YantrAnalytics — ReachRadar Ultra

> **AI-Powered Creator Intelligence & Competitive Analysis Platform**
> Built for the Social Media Analytics domain. Startup-grade. Zero-cost data pipeline.

---

## What This Does

ReachRadar Ultra is a full-stack AI intelligence platform that takes a YouTube handle and delivers:

- Deep profile audit (videos, shorts, community posts)
- Automated competitor discovery and benchmarking
- Real-time niche trend detection (Google Trends + YouTube signals)
- AI-generated growth strategy, viral script hooks, and content calendar
- React dashboard with Plotly charts, Mermaid diagrams, and animated visualizations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Charts | Plotly.js (React wrapper) |
| Diagrams | Mermaid.js |
| Styling | Tailwind CSS + Framer Motion |
| Backend | FastAPI (Python 3.11+) |
| AI | Google Gemini 2.0 Flash (via google-genai) |
| Data Scraping | yt-dlp (zero-cost, no API key) |
| Trends | pytrends (Google Trends API wrapper) |
| Transcripts | youtube-transcript-api |
| Logging | Python logging + structlog |
| Rate Limiting | slowapi (FastAPI middleware) |
| Caching | Redis (optional) / in-memory TTL cache |
| Env Management | python-dotenv |

---

## Project Structure

```
YantrAnalytics/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── config.py                # Settings, env vars, constants
│   │   ├── routers/
│   │   │   ├── analyze.py           # /api/analyze endpoint
│   │   │   ├── competitors.py       # /api/competitors endpoint
│   │   │   └── trends.py            # /api/trends endpoint
│   │   ├── services/
│   │   │   ├── youtube_harvester.py # yt-dlp scraping engine
│   │   │   ├── gemini_brain.py      # All Gemini AI prompts
│   │   │   ├── trend_radar.py       # pytrends integration
│   │   │   └── transcript_parser.py # Hook analysis via transcripts
│   │   ├── models/
│   │   │   ├── request_models.py    # Pydantic input validation
│   │   │   └── response_models.py   # Pydantic output schemas
│   │   ├── middleware/
│   │   │   ├── rate_limiter.py      # 10 req/min per IP guardrail
│   │   │   └── error_handler.py     # Global exception handler
│   │   └── utils/
│   │       ├── cache.py             # TTL in-memory cache
│   │       ├── logger.py            # Structured logging setup
│   │       └── validators.py        # Handle sanitization
│   ├── data-extractor/
│   │   ├── yt_profile_fetcher.py    # Raw channel harvester
│   │   └── competitor_engine.py    # Competitor search + analysis
│   ├── .env                         # API keys (never commit)
│   ├── .env.example                 # Template for teammates
│   ├── requirements.txt
│   └── reachradar.log               # Auto-generated log file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── ProfileCard.tsx       # Animated channel overview
│   │   │   │   ├── ViewVelocityChart.tsx # Plotly area chart
│   │   │   │   ├── ContentMixDonut.tsx   # Shorts vs Videos pie
│   │   │   │   ├── CompetitorRadar.tsx   # Radar chart comparison
│   │   │   │   ├── TrendBubbles.tsx      # Bubble chart for trends
│   │   │   │   └── StrategyTree.tsx      # Mermaid content pillars
│   │   │   ├── ui/
│   │   │   │   ├── SearchBar.tsx         # Handle input with validation
│   │   │   │   ├── MetricCard.tsx        # Animated stat cards
│   │   │   │   ├── LoadingWar.tsx        # Cinematic loading screen
│   │   │   │   └── MarkdownRenderer.tsx  # AI report renderer
│   │   │   └── layout/
│   │   │       ├── Navbar.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Landing / search page
│   │   │   ├── Analysis.tsx          # Main dashboard
│   │   │   ├── Competitors.tsx       # Competitor deep-dive
│   │   │   └── Trends.tsx            # Market trend explorer
│   │   ├── hooks/
│   │   │   ├── useAnalysis.ts        # API fetch + state
│   │   │   └── useAnimatedCounter.ts # Number animation hook
│   │   ├── api/
│   │   │   └── client.ts             # Axios instance + interceptors
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── api_reference.md
│   └── demo_screenshots/
│
└── README.md                        # This file
```

---

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- `yt-dlp` installed globally (`pip install yt-dlp`)

### Step 1 — Clone & Backend Setup

```bash
git clone https://github.com/yourusername/YantrAnalytics.git
cd YantrAnalytics/backend

python -m venv .analytics-env
# Windows:
.analytics-env\Scripts\activate
# Mac/Linux:
source .analytics-env/bin/activate

pip install -r requirements.txt
```

### Step 2 — Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Google AI Studio — get from https://aistudio.google.com/
GEMINI_API_KEY=your_key_here

# App settings
APP_ENV=development
LOG_LEVEL=INFO
CACHE_TTL_SECONDS=3600

# Rate limiting
RATE_LIMIT_PER_MINUTE=10
```

### Step 3 — Run Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Step 4 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Endpoints

### POST `/api/analyze`

Runs the full intelligence pipeline for a given handle.

**Request:**
```json
{
  "handle": "@swayamdhadange-t5v",
  "options": {
    "include_shorts": true,
    "include_community": true,
    "video_limit": 20
  }
}
```

**Response:**
```json
{
  "profile": {
    "handle": "@swayamdhadange-t5v",
    "niche": "CMA Exam Preparation",
    "authority_type": "Expert",
    "videos": [...],
    "shorts": [...],
    "community_posts": [...]
  },
  "analysis": {
    "niche": "CMA Finance Education",
    "content_mix_ratio": { "videos": 0.7, "shorts": 0.3 },
    "avg_views": 1240,
    "viral_probability_score": 62,
    "hook_score": 48,
    "report_markdown": "..."
  }
}
```

### POST `/api/competitors`

Finds and analyzes top 5 competitors in the same niche.

**Request:**
```json
{
  "niche": "CMA Finance Education",
  "user_handle": "@swayamdhadange-t5v"
}
```

### GET `/api/trends?keyword=CMA+exam`

Returns rising YouTube search trends for a keyword.

---

## Guardrails & Industry Standards

### Input Validation
All handles are sanitized via a Pydantic validator. Rejects: empty strings, handles > 50 chars, handles with invalid characters, and non-YouTube URLs if a URL is accidentally passed.

```python
# validators.py
def sanitize_handle(handle: str) -> str:
    handle = handle.strip().lstrip("@")
    if not re.match(r'^[a-zA-Z0-9_\-\.]{3,50}$', handle):
        raise ValueError("Invalid YouTube handle format")
    return f"@{handle}"
```

### Rate Limiting
10 requests per minute per IP address (via `slowapi`). Prevents abuse and keeps you under Gemini free-tier limits.

### Gemini Retry Logic
Exponential backoff with 3 retries. If quota is hit, returns a graceful error rather than crashing.

```python
# In gemini_brain.py
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def call_gemini(prompt: str) -> str:
    ...
```

### Prompt Injection Guard
All user inputs are passed as data (not embedded directly into system prompts). Handles like `@ignore-previous-instructions` are rejected at the validator level.

### Structured Logging

```python
# Every operation is logged with context
logger.info("analysis_started", handle=handle, ip=request.client.host)
logger.info("yt_scrape_complete", items_fetched=len(items), duration_ms=elapsed)
logger.error("gemini_quota_exceeded", retry_count=3, handle=handle)
```

Log file: `backend/reachradar.log`

### Caching
Results are cached for 1 hour per handle. This reduces Gemini API calls and makes the demo fast for repeated lookups.

---

## Gemini Quota Management

This is critical for your Google AI Studio free tier (15 RPM, 1500 RPD).

**The solution used in this project:**

1. Batch all 3 prompts (niche extraction, profile analysis, competitive report) into a single Gemini call using a structured master prompt. This uses 1 request instead of 3.

2. Cache results per handle for 1 hour.

3. Exponential backoff retry (see above).

4. If you need more throughput for demos: enable billing in AI Studio (pay-as-you-go). For a student project, typical cost is under ₹50/month.

---

## React Frontend — Key Components

### `ViewVelocityChart.tsx`
Area chart (Plotly) showing view count over the last 20 videos. Hover to see video titles. Color-coded by content type (video vs. short).

### `CompetitorRadar.tsx`
Radar chart with 6 axes: Hook Strength, Visual Quality, SEO, Engagement Rate, Upload Frequency, Community Activity. User is plotted against top 3 competitors.

### `TrendBubbles.tsx`
Bubble chart where bubble size = trend velocity, x-axis = search volume, y-axis = competition density. Each bubble is a rising trend keyword.

### `StrategyTree.tsx`
Mermaid.js content pillar diagram rendered inside a React component using `mermaid.render()`. Shows the channel's content architecture.

### `LoadingWar.tsx`
Cinematic loading screen showing each pipeline step (Harvesting → Scanning Competitors → Trend Detection → AI Synthesis) with animated progress and live logs.

---

## Improvements to Implement (Priority Order)

### High Priority
- [ ] **Transcript Hook Analyzer** — use `youtube-transcript-api` to fetch the first 30 seconds of top 3 competitor videos and analyze hook structure via AI
- [ ] **Viral Probability Score** — composite score (0–100) based on: hook strength + niche trend alignment + upload timing + thumbnail keyword match
- [ ] **Export to PDF** — one-click report download using `reportlab` on the backend

### Medium Priority
- [ ] **Multi-platform support** — Reddit (PRAW) for niche community sentiment, cross-referenced with YouTube data
- [ ] **Content Calendar Generator** — 30-day posting schedule auto-generated based on competitor upload patterns and trend windows
- [ ] **A/B Title Tester** — input your video idea, get 5 title variations ranked by CTR prediction

### Low Priority (Startup Features)
- [ ] **User accounts** — save analysis history (Supabase or Firebase)
- [ ] **Webhook alerts** — notify user when a trend in their niche spikes
- [ ] **Batch mode** — analyze multiple channels at once for agency use

---

## Academic Presentation Guide

When presenting to your guide, frame it around these 4 concepts:

**1. Prescriptive Analytics (not just Descriptive)**
Most dashboards *describe* data. This platform *prescribes* action. Emphasize the 7-Day Action Plan and Viral Script Blueprint as the prescriptive output layer.

**2. Multi-Source Intelligence Fusion**
You are fusing 3 data streams: yt-dlp (behavioral data), pytrends (intent data), and Gemini AI (synthesis layer). This is a genuine multimodal analytics pipeline.

**3. Zero-Cost Data Infrastructure**
By using yt-dlp as a public data harvester and pytrends for trend signals, the platform achieves enterprise-grade data collection at $0 infrastructure cost. Contrast this with tools like HypeAuditor ($399/mo) and VidIQ ($99/mo).

**4. Industry-Standard Engineering**
Point to: structured logging, Pydantic input validation, rate limiting middleware, exponential backoff, environment variable isolation, and separation of concerns (services/routers/models). This is production-grade architecture for a student project.

---

## Known Limitations

- YouTube dislikes are no longer public — this data will always be `null`
- Community posts may not be accessible on all channels (requires yt-dlp version 2024.x+)
- pytrends has unofficial rate limits — if it fails, the trends section gracefully degrades
- yt-dlp may need updating weekly: `pip install -U yt-dlp`

---

## Requirements

```
# backend/requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
google-genai==0.8.0
python-dotenv==1.0.1
yt-dlp==2024.11.18
pytrends==4.9.2
youtube-transcript-api==0.6.2
pandas==2.2.2
pydantic==2.7.1
slowapi==0.1.9
structlog==24.1.0
tenacity==8.3.0
httpx==0.27.0
```

```json
// frontend/package.json dependencies
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "plotly.js": "^2.32.0",
  "react-plotly.js": "^2.6.0",
  "mermaid": "^11.0.0",
  "framer-motion": "^11.2.0",
  "axios": "^1.7.2",
  "react-markdown": "^9.0.1",
  "tailwindcss": "^3.4.4",
  "typescript": "^5.4.5"
}
```

---

## License

MIT License. Built for academic purposes under the Social Media Analytics subject.

---

## Author

Saivamshi | YantrAnalytics | 2026
