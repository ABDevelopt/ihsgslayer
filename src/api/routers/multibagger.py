"""
Multibagger Screener API Router.
Exposes high-conviction Indonesian stocks with 2x - 5x+ upside potential based on
Minervini Stage 2 Superperformance, Small/Mid-Cap Runway, and Deep Bandarmologi.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from src.analytics.multibagger_hunter import MultibaggerHunterEngine

router = APIRouter(prefix="/screener/multibagger", tags=["Multibagger Hunter"])


@router.get("")
async def get_multibagger_candidates(
    min_score: float = Query(60.0, ge=40.0, le=95.0, description="Skor minimal Multibagger (40-95)")
):
    """
    Get prospective multibagger stocks with 2x - 5x+ upside projections.
    """
    try:
        candidates = MultibaggerHunterEngine.scan_multibagger_candidates(min_score=min_score)
        
        # Sector breakdown
        sectors: Dict[str, int] = {}
        for c in candidates:
            sec = c.get("sector", "General")
            sectors[sec] = sectors.get(sec, 0) + 1

        avg_score = round(sum(c["multibagger_score"] for c in candidates) / len(candidates), 1) if candidates else 0.0

        return {
            "status": "success",
            "count": len(candidates),
            "average_score": avg_score,
            "sectors_distribution": sectors,
            "methodology": {
                "pillar_1": "Minervini Stage 2 Trend Template (Price > MA50 > MA150 > MA200)",
                "pillar_2": "Fundamental Catalyst & Sector Supercycle (Turnaround & High Margin)",
                "pillar_3": "Stealth Institutional Bandarmologi (CR3 >= 55% & Bandar VWAP)",
                "pillar_4": "Small/Mid-Cap Growth Runway & Volume Contraction Pattern (VCP)"
            },
            "candidates": candidates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memindai saham multibagger: {str(e)}")
