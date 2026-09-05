"""
Portfolio & Daily Multi-Analysis Recommendations API Router.
Provides endpoints for:
- Holistic portfolio evaluation with 4-pillar multi-analysis
- Automated daily BUY / HOLD / SELL recommendations per stock
- Position management: Add, Sell, Delete, Seed Demo
- Realized trade history & NAV performance
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from src.portfolio.portfolio_advisor import PortfolioAdvisorEngine

router = APIRouter(prefix="/portfolio", tags=["Portfolio & AI Advisor"])


class AddHoldingRequest(BaseModel):
    symbol: str
    entry_price: float
    shares_lot: int
    target_tp1: Optional[float] = None
    target_tp2: Optional[float] = None
    stop_loss: Optional[float] = None
    entry_date: Optional[str] = None
    notes: Optional[str] = None


class SellHoldingRequest(BaseModel):
    holding_id: str
    exit_price: float
    shares_lot: int
    exit_date: Optional[str] = None
    reason: Optional[str] = None


@router.get("/analysis")
async def get_portfolio_analysis(cash_balance: float = Query(50_000_000.0, description="Saldo kas RDN (Rp)")):
    """
    Get full multi-analysis and daily BUY/HOLD/SELL recommendations for all holdings.
    """
    try:
        data = PortfolioAdvisorEngine.get_full_portfolio_analysis(cash_balance=cash_balance)
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis portofolio: {str(e)}")


@router.get("/holdings")
async def get_holdings():
    """Get active holdings list."""
    holdings = PortfolioAdvisorEngine.load_holdings()
    return {
        "status": "success",
        "count": len(holdings),
        "holdings": holdings
    }


@router.post("/add")
async def add_holding(req: AddHoldingRequest):
    """Add a stock holding into portfolio with target TP & SL."""
    try:
        holding = PortfolioAdvisorEngine.add_holding(
            symbol=req.symbol,
            entry_price=req.entry_price,
            shares_lot=req.shares_lot,
            target_tp1=req.target_tp1,
            target_tp2=req.target_tp2,
            stop_loss=req.stop_loss,
            entry_date=req.entry_date,
            notes=req.notes
        )
        return {
            "status": "success",
            "message": f"Berhasil menambahkan {req.shares_lot} lot #{req.symbol.upper()} ke portofolio.",
            "holding": holding
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal menambahkan saham: {str(e)}")


@router.post("/sell")
async def execute_sell(req: SellHoldingRequest):
    """Sell all or part of a holding and record realized PnL."""
    try:
        closed = PortfolioAdvisorEngine.execute_sell(
            holding_id=req.holding_id,
            exit_price=req.exit_price,
            shares_lot=req.shares_lot,
            exit_date=req.exit_date,
            reason=req.reason
        )
        return {
            "status": "success",
            "message": f"Berhasil menjual {req.shares_lot} lot #{closed['symbol']} @ Rp {req.exit_price:,.0f} ({closed['reason']}).",
            "trade": closed
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengeksekusi penjualan: {str(e)}")


@router.delete("/holding/{holding_id}")
async def delete_holding(holding_id: str):
    """Delete a holding from active portfolio."""
    success = PortfolioAdvisorEngine.delete_holding(holding_id)
    if not success:
        raise HTTPException(status_code=404, detail="Holding tidak ditemukan.")
    return {
        "status": "success",
        "message": "Posisi berhasil dihapus dari portofolio."
    }


@router.post("/reset-demo")
async def reset_demo_portfolio():
    """Reset portfolio to default seed holdings."""
    seeds = PortfolioAdvisorEngine.seed_default_holdings()
    return {
        "status": "success",
        "message": f"Portofolio berhasil di-reset ke {len(seeds)} saham acuan awal.",
        "holdings": seeds
    }


@router.get("/closed-trades")
async def get_closed_trades():
    """Get history of realized closed trades."""
    trades = PortfolioAdvisorEngine.load_closed_trades()
    return {
        "status": "success",
        "count": len(trades),
        "trades": trades
    }
