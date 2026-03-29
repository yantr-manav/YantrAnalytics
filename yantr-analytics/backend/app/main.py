# -*- coding: utf-8 -*-
"""
YantrAnalytics — ReachRadar Ultra
FastAPI Backend Entry Point — Industry-Standard Architecture
Guardrails: rate limiting, structured logging, global error handling, CORS
"""

import time
import logging
import structlog
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

# Load .env from backend/ directory regardless of CWD
_backend_dir = Path(__file__).resolve().parent.parent  # backend/app/../ = backend/
load_dotenv(_backend_dir / ".env", override=False)

# ─── Structured Logging Setup ─────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    handlers=[
        logging.FileHandler("reachradar.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = structlog.get_logger(__name__)

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── App Lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "reachradar_startup",
        version="3.0.0",
        environment=os.getenv("APP_ENV", "development"),
        gemini_key_set=bool(os.getenv("GEMINI_API_KEY"))
    )
    yield
    logger.info("reachradar_shutdown")

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="ReachRadar Ultra API",
    description="AI-Powered Creator Intelligence & Competitive Analysis Platform",
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    client_ip = request.client.host if request.client else "unknown"
    logger.info("request_received", method=request.method, path=request.url.path, ip=client_ip)
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info("request_completed", status=response.status_code, duration_ms=duration)
    return response

# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "Analysis pipeline failed. Please try again."}
    )

# ─── Routers ──────────────────────────────────────────────────────────────────
from app.routers import analyze, trends, tools

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(trends.router, prefix="/api", tags=["Trends"])
app.include_router(tools.router, prefix="/api", tags=["Tools"])

# ─── Health Check with Dependency Status ──────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    """Enhanced health check with dependency status."""
    import subprocess
    import os

    # Check yt-dlp
    try:
        result = subprocess.run(["yt-dlp", "--version"], capture_output=True, text=True, timeout=5)
        ytdlp_ok = result.returncode == 0
        ytdlp_version = result.stdout.strip() if ytdlp_ok else "not found"
    except Exception:
        ytdlp_ok = False
        ytdlp_version = "not found"

    # Check Gemini key
    gemini_ok = bool(os.getenv("GEMINI_API_KEY"))

    from app.utils.cache import cache_stats
    cache = cache_stats()

    return {
        "status": "operational" if (ytdlp_ok and gemini_ok) else "degraded",
        "service": "ReachRadar Ultra",
        "version": "3.0.0",
        "dependencies": {
            "yt_dlp": {"ok": ytdlp_ok, "version": ytdlp_version},
            "gemini_api": {"ok": gemini_ok},
        },
        "cache": cache
    }

# ─── Cache Stats Endpoint ─────────────────────────────────────────────────────
@app.get("/api/cache/stats", tags=["System"])
async def cache_statistics():
    from app.utils.cache import cache_stats
    return cache_stats()
