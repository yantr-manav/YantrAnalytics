# -*- coding: utf-8 -*-
"""
Tools Router — New industry-grade feature endpoints.
- POST /api/tools/calendar    — 30-day content calendar generator
- POST /api/tools/title-test  — A/B title variation tester
- POST /api/export/pdf        — PDF report download
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
import structlog
import io

from app.models.schemas import TitleTestRequest, CalendarRequest
from app.services.gemini_brain import generate_content_calendar, generate_title_variations
from app.utils.cache import cache_get

logger = structlog.get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/tools/title-test")
@limiter.limit("10/minute")
async def ab_title_tester(request: Request, body: TitleTestRequest):
    """
    A/B Title Tester: input a video idea, get 5 AI-ranked title variations.
    Each title comes with a CTR prediction score and hook type classification.
    """
    logger.info("title_test_requested", idea=body.video_idea[:50])

    try:
        titles = generate_title_variations(
            video_idea=body.video_idea,
            niche=body.niche,
            keywords=body.keywords
        )
        return {
            "video_idea": body.video_idea,
            "niche": body.niche,
            "titles": titles,
            "total": len(titles)
        }
    except Exception as e:
        logger.error("title_test_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Title generation failed. Please try again.")


@router.post("/tools/calendar")
@limiter.limit("5/minute")
async def content_calendar(request: Request, body: CalendarRequest):
    """
    30-Day Content Calendar Generator.
    Uses competitor patterns + niche trends to schedule content intelligently.
    """
    logger.info("calendar_requested", handle=body.handle, niche=body.niche)

    # Try to pull competitor data from cache if available
    cache_key = f"analysis:@{body.handle.lstrip('@')}"
    cached = cache_get(cache_key)
    competitors = cached.get("competitors", {}).get("competitors", []) if cached else []

    analysis_context = {
        "content_pillars": body.content_pillars,
        "top_keywords": body.top_keywords,
        "authority_type": cached.get("analysis", {}).get("authority_type", "Educator") if cached else "Educator"
    }

    try:
        calendar_data = generate_content_calendar(
            handle=body.handle,
            niche=body.niche,
            analysis=analysis_context,
            competitors=competitors
        )
        return {
            "handle": body.handle,
            "niche": body.niche,
            "calendar": calendar_data.get("calendar", []),
            "weekly_themes": calendar_data.get("weekly_theme", {}),
            "total_entries": len(calendar_data.get("calendar", []))
        }
    except Exception as e:
        logger.error("calendar_generation_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Calendar generation failed. Please try again.")


@router.get("/export/pdf/{handle}")
@limiter.limit("5/minute")
async def export_pdf(request: Request, handle: str):
    """
    PDF Export — Generates a downloadable intelligence report PDF.
    Uses cached analysis data to build the PDF via reportlab.
    """
    handle = f"@{handle.lstrip('@')}"
    cache_key = f"analysis:{handle}"
    cached = cache_get(cache_key)

    if not cached:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis found for {handle}. Run an analysis first."
        )

    try:
        pdf_bytes = _generate_pdf(handle, cached)
        filename = f"yantranalytics_{handle.lstrip('@')}_report.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="PDF export requires reportlab. Install: pip install reportlab"
        )
    except Exception as e:
        logger.error("pdf_export_failed", handle=handle, error=str(e))
        raise HTTPException(status_code=500, detail="PDF generation failed.")


def _generate_pdf(handle: str, data: dict) -> bytes:
    """Generates a PDF from analysis data using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.colors import HexColor, white, black
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.units import cm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    BLUE = HexColor("#3b82f6")
    DARK = HexColor("#0d1117")
    GRAY = HexColor("#6b7280")
    LIGHT_GRAY = HexColor("#f3f4f6")

    title_style = ParagraphStyle("Title", parent=styles["Title"],
                                 fontSize=24, textColor=BLUE, spaceAfter=6)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
                               fontSize=14, textColor=DARK, spaceBefore=12, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"],
                                fontSize=10, textColor=HexColor("#374151"), leading=16)
    meta_style = ParagraphStyle("Meta", parent=styles["Normal"],
                                fontSize=9, textColor=GRAY)

    analysis = data.get("analysis", {})
    profile = data.get("profile", {})
    stats = profile.get("stats", {})

    story = []

    # Header
    story.append(Paragraph("YantrAnalytics — Intelligence Report", title_style))
    story.append(Paragraph(f"Channel: {handle}", h2_style))
    story.append(Paragraph(f"Niche: {analysis.get('niche', 'N/A')} · Authority: {analysis.get('authority_type', 'N/A')}", meta_style))
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
    story.append(Spacer(1, 0.4*cm))

    # Key Metrics Table
    story.append(Paragraph("Key Metrics", h2_style))
    metrics_data = [
        ["Metric", "Value"],
        ["Viral Probability Score", f"{analysis.get('viral_probability_score', 0)}/100"],
        ["Hook Score", f"{analysis.get('hook_score', 0)}/100"],
        ["Growth Potential", analysis.get("growth_potential", "N/A")],
        ["Avg. Views (Videos)", f"{stats.get('avg_views_videos', 0):,}"],
        ["Avg. Views (Shorts)", f"{stats.get('avg_views_shorts', 0):,}"],
        ["Dominant Format", stats.get("dominant_format", "N/A")],
        ["Engagement Rate", f"{stats.get('engagement_rate', 0):.2f}%"],
    ]
    if profile.get("subscribers"):
        metrics_data.append(["Subscribers", f"{profile['subscribers']:,}"])

    table = Table(metrics_data, colWidths=[8*cm, 8*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GRAY, white]),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5*cm))

    # Top Keywords
    keywords = analysis.get("top_keywords", [])
    if keywords:
        story.append(Paragraph("Top Keywords", h2_style))
        story.append(Paragraph(" · ".join(keywords), body_style))
        story.append(Spacer(1, 0.3*cm))

    # Content Pillars
    pillars = analysis.get("content_pillars", [])
    if pillars:
        story.append(Paragraph("Content Pillars", h2_style))
        for i, p in enumerate(pillars, 1):
            story.append(Paragraph(f"{i}. {p}", body_style))
        story.append(Spacer(1, 0.3*cm))

    # AI Report (strip markdown formatting for PDF)
    report_md = analysis.get("report_markdown", "")
    if report_md:
        story.append(HRFlowable(width="100%", thickness=1, color=BLUE))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Full AI Intelligence Report", h2_style))
        # Simple markdown → paragraph conversion
        for line in report_md.split("\n"):
            clean = line.replace("**", "").replace("*", "").replace("`", "").replace("#", "").strip()
            if clean:
                if line.startswith("##"):
                    story.append(Paragraph(clean, h2_style))
                elif clean:
                    story.append(Paragraph(clean, body_style))

    # Footer
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GRAY))
    story.append(Paragraph("Generated by YantrAnalytics · AI Creator Intelligence", meta_style))

    doc.build(story)
    return buffer.getvalue()
