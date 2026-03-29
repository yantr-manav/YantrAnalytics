# YantrAnalytics — Industry-Grade Upgrade Plan

Transform the scaffold into a fully working, production-quality AI creator intelligence platform.

## Current State (What's Broken / Missing)

| Area | Problem |
|------|---------|
| Backend pipeline | All service calls in [analyze_router.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/analyze_router.py) are **commented out** — nothing actually runs |
| Backend structure | Files are dumped in root ([gemini_brain.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/gemini_brain.py), [youtube_harvester.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/youtube_harvester.py)) instead of proper `app/` package |
| Frontend | [src/App.tsx](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/src/App.tsx) is **Vite boilerplate** (counter button, logo links) — not the actual app |
| Frontend packages | [package.json](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/package.json) only has `react` + `react-dom` — no tailwind, plotly, framer-motion, etc. |
| Features | Transcript hook analysis, PDF export, content calendar, A/B tester are all `TODO` |

## User Review Required

> [!IMPORTANT]
> The backend pipeline requires `yt-dlp`, `pytrends`, and a valid `GEMINI_API_KEY`. Make sure:
> - `yt-dlp` is installed globally (`pip install yt-dlp`)
> - Your [.env](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/backend/.env) file in `backend/` has a valid `GEMINI_API_KEY`
> - Python virtual env is activated before running

> [!WARNING]
> The backend restructuring will create a proper `app/` package inside the `backend/` directory. The existing loose files ([gemini_brain.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/gemini_brain.py), [youtube_harvester.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/youtube_harvester.py) in `yantr-analytics/`) will be kept but the canonical versions will live in `backend/app/services/`.

---

## Proposed Changes

### Backend — Wire Up + New Features

#### [MODIFY] [analyze_router.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/analyze_router.py)
Uncomment and fully activate the pipeline. Wire up all 5 steps: harvest → Gemini AI → competitor scan → trends → Mermaid diagram. Add cache integration.

#### [NEW] backend/app/services/trend_radar.py
PyTrends integration — fetches rising YouTube search queries for a given niche keyword. Handles rate limiting gracefully (returns empty list on failure, never crashes).

#### [NEW] backend/app/services/transcript_parser.py
Uses `youtube-transcript-api` to fetch the first 30s of the top 3 competitor video transcripts and runs a Gemini call to score hook structure.

#### [NEW] backend/app/routers/export.py
`POST /api/export/pdf` — uses `reportlab` to generate a downloadable PDF of the analysis report. Returns a `StreamingResponse`.

#### [NEW] backend/app/routers/tools.py
- `POST /api/calendar` — Gemini-powered 30-day content calendar based on competitor upload patterns
- `POST /api/title-test` — input a video idea, get 5 AI-ranked title variations with CTR prediction scores

#### [MODIFY] [main.py](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/main.py)
Register new routers. Enhanced `/health` endpoint with dependency checks.

#### [NEW] backend/requirements.txt (updated)
Add: `youtube-transcript-api`, `reportlab`, `pytrends`, `redis` (optional).

---

### Frontend — Complete Rebuild

#### [MODIFY] [package.json](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/package.json)
Install all required packages:
- `react-router-dom`, `axios`, `react-markdown`
- `plotly.js`, `react-plotly.js`
- [mermaid](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/gemini_brain.py#206-225), `framer-motion`
- `tailwindcss`, `@tailwindcss/vite`, `postcss`, `autoprefixer`
- `react-hot-toast` (toast notifications)
- `@types/plotly.js`, `@types/react-router-dom`

#### [NEW] tailwind.config.js + postcss.config.js
Dark-mode-first Tailwind config with custom colors, animations, and font (Inter from Google Fonts).

#### [MODIFY] [src/index.css](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/src/index.css)
Full dark design system: CSS variables for the color palette, glassmorphism utilities, custom scrollbar, gradient utilities.

#### [MODIFY] [index.html](file:///c:/Users/Saivamshi/Music/Sai\Coding\YantrAnalytics\yantr-analytics\index.html)
Add Google Fonts (Inter), SEO meta tags, Open Graph tags, favicon.

#### [MODIFY] [src/main.tsx](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/src/main.tsx)
Add `BrowserRouter` + `Toaster` wrapper.

#### [MODIFY] [src/App.tsx](file:///c:/Users/Saivamshi/Music/Sai/Coding/YantrAnalytics/yantr-analytics/src/App.tsx)
Replace boilerplate with proper route declarations: `/` → Home, `/analyze/:handle` → Analysis.

#### [NEW] src/types/index.ts
Full TypeScript interfaces for all API responses.

#### [NEW] src/api/client.ts
Axios instance with base URL, request/response interceptors, and toast error handling.

#### [NEW] src/hooks/useAnalysis.ts
React hook for the analyze API: state machine with `idle | loading | success | error` phases.

#### [NEW] src/pages/Home.tsx
Stunning dark landing page with:
- Animated gradient hero section with logo
- YouTube handle search bar with validation
- Animated feature pills
- Stats counter section
- Glassmorphism cards showing platform capabilities

#### [NEW] src/pages/Analysis.tsx
Full analytics dashboard with 5 tabs: **Overview | Competitors | Trends | Report | Tools**
- Metric cards with animated counters
- View Velocity area chart (Plotly)
- Content Mix donut chart
- Competitor radar chart
- Top keywords cloud
- Cinematic loading war room
- Error state with retry

#### [NEW] src/components/Dashboard/
- `ViewVelocityChart.tsx` — Plotly area chart
- `ContentMixDonut.tsx` — Plotly donut
- `CompetitorRadar.tsx` — Plotly radar
- `TrendBubbles.tsx` — Plotly bubble chart
- `StrategyTree.tsx` — Mermaid renderer
- `ScoreGauge.tsx` — Animated viral/hook score gauge

#### [NEW] src/components/ui/
- `MetricCard.tsx` — animated stat card with micro animation
- `LoadingWarRoom.tsx` — cinematic multi-step loading screen
- `SearchBar.tsx` — validated input with YouTube handle formatting
- `KeywordCloud.tsx` — tag pills with hover glow
- `PdfExportButton.tsx` — triggers PDF download

#### [NEW] src/components/layout/
- `Navbar.tsx` — top navigation with logo + links
- `Sidebar.tsx` — optional desktop sidebar

---

## Verification Plan

### Backend Verification
```bash
# From yantr-analytics/backend directory (with venv active):
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Then check:
curl http://localhost:8000/health
# Expected: {"status": "operational", "service": "ReachRadar Ultra", "dependencies": {...}}
```

### Frontend Verification  
```bash
# From yantr-analytics/ directory:
npm install
npm run dev
# Open http://localhost:5173 — should show the landing page (NOT Vite boilerplate)
```

### End-to-End Browser Test
Using the browser tool:
1. Navigate to `http://localhost:5173`
2. Type `@MrBeast` in the search bar → click Analyze
3. Verify loading war room appears with animated steps
4. Wait for dashboard → verify metric cards, charts, and report tab all render

### Manual Testing Checklist
- [ ] Enter an invalid handle (e.g. `a`) → should show validation error
- [ ] Enter a valid handle → loading screen appears → dashboard loads
- [ ] Click each tab: Overview, Competitors, Trends, Report, Tools
- [ ] Click "Export PDF" → PDF downloads
- [ ] Enter video idea in A/B Title Tester → 5 titles appear
