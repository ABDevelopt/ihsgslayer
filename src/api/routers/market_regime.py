"""
Market Regime API Router.
Exposes current IDX market regime, composite IHSG volatility & trend metrics,
and dynamic strategy weights.
"""

from fastapi import APIRouter, HTTPException
from src.analytics.market_regime import MarketRegimeEngine

router = APIRouter(prefix="/market-regime", tags=["Market Regime"])


@router.get("/current")
async def get_current_regime():
    """
    Get current IHSG market regime classification, volatility metrics,
    and adaptive strategy biases.
    """
    try:
        data = MarketRegimeEngine.get_current_regime()
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memuat rezim pasar: {str(e)}")
