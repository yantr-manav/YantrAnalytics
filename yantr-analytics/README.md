# YantrAnalytics

> **AI Creator Intelligence — read the signal in any YouTube channel.**
> Point it at any public handle and get a precision intelligence report: viral scoring,
> competitor benchmarking, trend radar, and an AI growth blueprint — in under 60 seconds.
> Zero-cost data pipeline. No API key required from the viewer.

---

## What it does

Give YantrAnalytics a YouTube handle and it returns:

- **Deep profile audit** — videos, shorts, and community posts harvested in parallel
- **AI intelligence scores** — viral probability, hook strength, and a 6-axis performance radar
- **Competitor discovery & benchmarking** — top channels in the same niche, scored and compared
- **Trend radar** — rising YouTube search queries for the niche (Google Trends signals)
- **AI growth blueprint** — positioning, content-gap analysis, a 7-day action plan, and a Mermaid content-pillar diagram
- **Creator tools** — a 30-day content calendar generator and an A/B title tester with CTR prediction
- **PDF export** of the full report

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript 5.9 · Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS `@theme`) |
| Motion | Framer Motion 12 |
| 3D | three.js · @react-three/fiber 9 · @react-three/drei (lazy-loaded WebGL hero) |
| Icons | lucide-react |
| Charts | Plotly.js 3 (`plotly.js-basic-dist` via the react-plotly.js factory) |
| Diagrams | Mermaid 11 |
| Markdown | react-markdown |
| Backend | FastAPI · Python 3.11+ |
| AI | Google Gemini 2.5 Flash (`google-genai`), with a Groq (Llama 3.3) fallback |
| Data harvesting | yt-dlp (public data, no API key) |
| Trends | pytrends (Google Trends) |
| PDF | reportlab |
| Hardening | slowapi (rate limiting) · structlog (structured logs) · tenacity (retry/backoff) |
| Caching | in-memory TTL cache |

---

## Project structure

```
yantr-analytics/                 # repo root = the Vite frontend
├── index.html
├── package.json · vite.config.ts · tsconfig*.json · eslint.config.js
├── public/
│   └── favicon.svg              # YantrAnalytics "signal Y" mark
├── src/
│   ├── main.tsx                 # entry: Router + Toaster
│   ├── App.tsx                  # routes, ScrollToTop, root ErrorBoundary, lazy dashboard
│   ├── index.css                # Tailwind v4 design system (@theme tokens, utilities)
│   ├── components/
│   │   ├── Logo.tsx             # brand mark + wordmark
│   │   ├── Icon3D.tsx           # glassy 3D-style icon tile (wraps a Lucide glyph)
│   │   ├── ErrorBoundary.tsx    # app-level + WebGL fallback boundary
│   │   └── three/
│   │       ├── YantraOrb.tsx    # the WebGL "yantra" scene (lazy chunk)
│   │       └── HeroScene.tsx    # Suspense + error fallback + reduced-motion guard
│   ├── pages/
│   │   ├── Home.tsx             # landing page
│   │   └── Analysis.tsx         # dashboard (Overview/Competitors/Trends/Report/Tools)
│   ├── hooks/useAnalysis.ts     # analyze API state machine (idle/loading/success/error)
│   ├── api/client.ts            # axios instance + endpoint helpers
│   ├── lib/
│   │   ├── theme.ts             # JS design tokens (chart colors, Plotly layout)
│   │   └── format.ts            # number/handle formatting
│   └── types/
│       ├── index.ts             # API response interfaces
│       └── plotly-basic.d.ts    # module shim for plotly.js-basic-dist
│
└── backend/                     # FastAPI service
    ├── app/
    │   ├── main.py              # app, CORS, logging, rate limiter, /health
    │   ├── routers/
    │   │   ├── analyze.py       # POST /api/analyze (the full pipeline)
    │   │   ├── trends.py        # GET  /api/trends
    │   │   └── tools.py         # title-test · calendar · PDF export
    │   ├── services/
    │   │   ├── youtube_harvester.py  # parallel yt-dlp harvesting
    │   │   ├── gemini_brain.py       # LLM prompts, retry, Groq fallback, heuristic fallback
    │   │   ├── trend_radar.py        # pytrends integration
    │   │   └── transcript_parser.py
    │   ├── models/schemas.py    # Pydantic request/response models
    │   └── utils/cache.py       # in-memory TTL cache
    ├── data-extractor/          # standalone profile-fetcher scripts
    ├── requirements.txt
    ├── start_backend.bat        # Windows convenience launcher
    └── .env.example
```

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- `yt-dlp` available (installed via `requirements.txt`; keep it updated: `pip install -U yt-dlp`)

### 1 — Backend

```bash
cd backend
python -m venv .analytics-env
# Windows:
.analytics-env\Scripts\activate
# macOS/Linux:
source .analytics-env/bin/activate

pip install -r requirements.txt
cp .env.example .env        # then edit .env (see below)

uvicorn app.main:app --reload --port 8000
```

> Windows shortcut: `start_backend.bat` activates the venv, installs deps, and starts the server.

API docs: `http://localhost:8000/docs` · Health: `http://localhost:8000/health`

### 2 — Frontend

```bash
# from the repo root (yantr-analytics/)
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/health` to the backend on port 8000.

### Environment variables (`backend/.env`)

```env
GEMINI_API_KEY=your_key_here          # required — https://aistudio.google.com/
GROQ_API_KEY=                          # optional — fallback LLM when Gemini quota is exhausted
GROQ_MODEL=llama-3.3-70b-versatile     # optional
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CACHE_TTL_SECONDS=3600
LOG_LEVEL=INFO
APP_ENV=development
```

If Gemini quota runs out and no Groq key is set, the backend serves a **deterministic heuristic report** so the UI still renders a full analysis.

---

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/analyze` | Full pipeline: harvest → AI analysis → competitors + trends (parallel) → Mermaid |
| `GET`  | `/api/trends?keyword=<niche>` | Rising YouTube search queries for a niche |
| `POST` | `/api/tools/title-test` | 5 AI-ranked title variations with CTR scores |
| `POST` | `/api/tools/calendar` | 30-day content calendar |
| `GET`  | `/api/export/pdf/{handle}` | Download the report as a PDF (uses cached analysis) |
| `DELETE` | `/api/cache/{handle}` | Force-refresh a handle's cached analysis |
| `GET`  | `/health` | Dependency-aware health check (yt-dlp, Gemini key, cache) |
| `GET`  | `/api/cache/stats` | Cache statistics |

**`POST /api/analyze`**

```jsonc
// request
{ "handle": "@mkbhd", "include_shorts": true, "include_community": true, "video_limit": 20, "run_competitors": true }

// response (shape)
{ "handle": "@mkbhd", "profile": { … }, "analysis": { "niche", "viral_probability_score", "hook_score", "radar_scores", "report_markdown", … },
  "competitors": { "competitors": [ … ], "report": "…" }, "trends": [ … ], "mermaid_diagram": "graph TD…", "cached": false }
```

---

## Engineering notes

- **Async-safe pipeline** — every blocking yt-dlp / LLM call runs in a threadpool; competitor scan and trend fetch run concurrently via `asyncio.gather(..., return_exceptions=True)`, so one failure never sinks the whole request.
- **Parallel harvesting** — videos, shorts, community, and subscriber count are fetched simultaneously, turning a multi-minute sequential scrape into a sub-60-second parallel one.
- **LLM quota strategy** — the niche, scores, keywords, and full report come from a **single** batched Gemini call. Results are cached per handle (1h TTL). On quota exhaustion it falls back to Groq, then to a deterministic local heuristic — the contract never breaks.
- **Input validation & prompt-injection guard** — handles are sanitized by a Pydantic validator (3–50 chars, rejects injection-y tokens) before reaching any prompt.
- **Rate limiting** — 10 analyses/min per IP via slowapi.
- **Lean frontend** — the landing page ships ~125 KB gzip; Plotly + Mermaid (the dashboard) and the WebGL hero (three.js) are each split into their own lazy chunks. The 3D hero sits behind `Suspense` + an `ErrorBoundary` and a `prefers-reduced-motion` guard, so a GPU/driver failure degrades to a static fallback rather than blanking the page.

---

## Known limitations

- YouTube dislikes are no longer public — that field is always `null`.
- Community posts aren't accessible on every channel (needs a recent yt-dlp).
- pytrends has unofficial rate limits — the Trends tab degrades gracefully to empty when throttled.
- yt-dlp benefits from frequent updates: `pip install -U yt-dlp`.

---

## License

MIT — built for the Social Media Analytics domain.

**YantrAnalytics** · 2026
