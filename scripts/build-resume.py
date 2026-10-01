#!/usr/bin/env python3
"""Build the one-page resume at public/resume.pdf."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "resume.pdf"
INK = HexColor("#1a1a1a")
MUTED = HexColor("#444444")
RULE = HexColor("#222222")

FONT_CANDIDATES = {
    # Liberation Sans is metric-compatible with Arial, so layout matches on Linux/CI.
    "Arial": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ],
    "Arial-Bold": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ],
}

for font_name, candidates in FONT_CANDIDATES.items():
    font_path = next((p for p in candidates if Path(p).exists()), None)
    if font_path is None:
        raise SystemExit(f"No font found for {font_name}: {candidates}")
    pdfmetrics.registerFont(TTFont(font_name, font_path))


def style(name, **kwargs):
    defaults = dict(fontName="Arial", textColor=INK, leading=12)
    defaults.update(kwargs)
    return ParagraphStyle(name, **defaults)


NAME = style("name", fontName="Arial-Bold", fontSize=18, leading=22, alignment=TA_CENTER, spaceAfter=4)
CONTACT = style("contact", fontSize=9, leading=12, alignment=TA_CENTER, textColor=MUTED, spaceAfter=10)
H = style("h", fontName="Arial-Bold", fontSize=10, leading=13, spaceBefore=8, spaceAfter=3, textColor=INK)
BODY = style("body", fontSize=9, leading=11.5, alignment=TA_JUSTIFY, spaceAfter=4)
ROLE = style("role", fontName="Arial-Bold", fontSize=9.5, leading=12)
META = style("meta", fontSize=9, leading=12, textColor=MUTED)
BULLET = style("bullet", fontSize=9, leading=11.4, alignment=TA_LEFT)
EXPERTISE = style("expertise", fontSize=8.5, leading=11.5, alignment=TA_CENTER, textColor=MUTED)


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(item, BULLET), leftIndent=8, bulletColor=INK) for item in items],
        bulletType="bullet",
        bulletFontName="Arial",
        bulletFontSize=8,
        leftIndent=12,
        bulletOffsetY=-1,
        spaceBefore=1,
        spaceAfter=2,
    )


def role_header(title, dates, company_loc):
    top = Table(
        [[Paragraph(title, ROLE), Paragraph(dates, META)]],
        colWidths=[5.4 * inch, 2.1 * inch],
    )
    top.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return [top, Paragraph(company_loc, META), Spacer(1, 3)]


def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.4 * inch,
        title="Jarrod Tran",
        author="Jarrod Tran",
    )
    story = [
        Paragraph("JARROD TRAN", NAME),
        Paragraph(
            "jarrodtran@outlook.com  ·  (607) 760-2068  ·  linkedin.com/in/jarrodtran",
            CONTACT,
        ),
        Paragraph("SUMMARY", H),
        Paragraph(
            "AI enablement and factory-strategy leader. Builds teams and systems that turn new technology into cost, capacity, and productivity results. Tesla Energy, Waymo, Apple.",
            BODY,
        ),
        Paragraph("EXPERIENCE", H),
        *role_header(
            "Lead, AI Enablement &amp; Factory Strategy",
            "Aug 2023 – Present",
            "Tesla  ·  Houston, TX",
        ),
        bullets(
            [
                "Define and lead the AI enablement strategy for Tesla Energy Manufacturing: roadmap, operating model, governance, workforce enablement, and executive reporting across Megapack, Powerwall, battery cell/LFP, Supercharger, and Solar.",
                "Built and lead a forward-deployed AI engineering organization spanning product management and embedded engineering. 1,000+ active users and 20+ production AI solutions, including RAG troubleshooting, automated reporting, workflow automation, and decision-support.",
                "Established an AI productivity framework modeled at about 540 reclaimed hours per week and $1.6M in annualized value, with MCP-based automation as additional upside.",
                "Own factory strategy and production planning for Megapack across California, Texas, and Shanghai. Scaled production 3.2x, from 14.7 GWh to 46.7 GWh, and built the capacity roadmap to 130+ GWh.",
                "Directed a $23M capacity investment portfolio across 50+ initiatives, generating $156M in incremental annual profit. Separately delivered $260M in annualized cost savings through NPI and manufacturing cost-down.",
                "Developed manufacturing and supply-chain strategies protecting against $550M in projected tariff exposure, then built and promoted successors so day-to-day factory strategy could run without me.",
            ]
        ),
        *role_header(
            "Strategy &amp; Operations Manager",
            "Oct 2022 – May 2023",
            "Waymo  ·  Mountain View, CA",
        ),
        bullets(
            [
                "Led annual planning, OKRs, and quarterly business reviews for Engineering Operations in a safety-critical autonomous-vehicle environment.",
                "Built leadership dashboards and ran cross-functional work across hardware, software, fleet, Product, Legal, and Engineering, including safety and regulatory requirements for commercial deployment.",
            ]
        ),
        *role_header(
            "Strategic Operations Program Manager",
            "Jun 2021 – Jun 2022",
            "Apple  ·  Cupertino, CA",
        ),
        bullets(
            [
                "Scaled global iPhone operations 293% year over year, from 4.3M to 16.9M units, and supported program revenue growth from $2B to $10B by turning demand into capacity and supplier-readiness plans.",
                "Led Apple's iPhone manufacturing launch in India from inception through mass production, and expanded India-manufactured exports from 6 to 40+ countries.",
            ]
        ),
        *role_header(
            "Program Manager, Special Projects",
            "Jun 2018 – Jun 2021",
            "Tesla  ·  Fremont, CA",
        ),
        bullets(
            [
                "Managed Project Roadrunner, Tesla's 4680 battery-cell program, from early pilot to a production-ready platform heading into Battery Day.",
                "Designed and launched a $3.5M-per-month mobile logistics platform, Warehouse on Wheels, and led production planning and recovery across Model 3 and Model Y.",
            ]
        ),
        Paragraph("EDUCATION", H),
        Paragraph(
            "University at Buffalo  ·  B.S. Business Administration, Finance  ·  Cum Laude",
            BODY,
        ),
        Paragraph("EXPERTISE", H),
        Paragraph(
            "AI Enablement  ·  Factory &amp; Capacity Strategy  ·  Forward-Deployed Engineering  ·  NPI  ·  Cost Transformation  ·  Global Operations  ·  Workforce Planning  ·  Cross-Functional Leadership",
            EXPERTISE,
        ),
    ]
    doc.build(story)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
