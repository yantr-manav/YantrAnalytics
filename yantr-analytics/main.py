# -*- coding: utf-8 -*-
"""
YantrAnalytics — ReachRadar Ultra
FastAPI Backend Entry Point
Industry-standard architecture with guardrails, rate limiting, and structured logging.
"""

import time
import logging
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import os

load_dotenv()

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
    logger.info("reachradar_startup", version="2.0.0", environment=os.getenv("APP_ENV", "development"))
    yield
    logger.info("reachradar_shutdown")

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="ReachRadar Ultra API",
    description="AI-Powered Creator Intelligence Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    logger.info("request_received", method=request.method, path=request.url.path, ip=request.client.host)
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
from app.routers import analyze, competitors, trends

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(competitors.router, prefix="/api", tags=["Competitors"])
app.include_router(trends.router, prefix="/api", tags=["Trends"])

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "operational", "service": "ReachRadar Ultra"}
