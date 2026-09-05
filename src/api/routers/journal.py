"""
Trading Journal & Unitized NAV API Router.
Handles manual & screener trade records, FIFO accounting, mark-to-market valuation, and JSON persistence.
"""

import os
import json
import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from src.journal.engine import TradingJournalEngine, TradeEntry
from src.data.collector import DataCollector

router = APIRouter(prefix="/journal", tags=["Trading Journal & NAV"])
collector = DataCollector()

JOURNAL_STATE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "trading_journal_state.json")


class JournalEntryRequest(BaseModel):
    symbol: str
    entry_price: float
    shares_lot: int
    action: str = "BUY"  # BUY or SELL
    notes: Optional[str] = None
    trade_date: Optional[str] = None


class JournalState(BaseModel):
    initial_cash: float = 100_000_000.0
    cash_balance: float = 100_000_000.0
    total_equity: float = 100_000_000.0
    stock_market_value: float = 0.0
    total_pnl_rp: float = 0.0
    total_pnl_pct: float = 0.0
    nav_per_unit: float = 1000.0
    open_positions: List[Dict[str, Any]] = Field(default_factory=list)
    closed_positions: List[Dict[str, Any]] = Field(default_factory=list)
    nav_history: List[Dict[str, Any]] = Field(default_factory=list)


def _load_journal_state() -> JournalState:
    try:
        if os.path.exists(JOURNAL_STATE_FILE):
            with open(JOURNAL_STATE_FILE, "r", encoding="utf-8") as f:
                return JournalState.model_validate(json.load(f))
    except Exception:
        pass
    
    # Initialize default state with starting seed
    today_str = datetime.now().strftime("%Y-%m-%d")
    return JournalState(
        initial_cash=100_000_000.0,
        cash_balance=100_000_000.0,
        total_equity=100_000_000.0,
        nav_history=[{"date": today_str, "nav": 1000.0}]
    )


def _save_journal_state(state: JournalState):
    try:
        os.makedirs(os.path.dirname(JOURNAL_STATE_FILE), exist_ok=True)
        with open(JOURNAL_STATE_FILE, "w", encoding="utf-8") as f:
            f.write(state.model_dump_json(indent=2))
    except Exception:
        pass


_state: JournalState = _load_journal_state()


def _recalculate_portfolio():
    global _state
    market_val = 0.0
    for pos in _state.open_positions:
        sym = pos["symbol"]
        price = pos.get("current_price") or pos.get("entry_price") or 0.0
        shares = pos.get("shares_lot", 0) * 100
        val = shares * price
        market_val += val
        pos["current_price"] = price
        pos["market_value"] = val

    total_realized_pnl = sum(c.get("realized_pnl_rp", 0.0) for c in _state.closed_positions)
    _state.stock_market_value = round(market_val, 2)
    _state.total_equity = round(_state.cash_balance + market_val, 2)
    _state.total_pnl_rp = round(total_realized_pnl, 2)
    _state.total_pnl_pct = round(((_state.total_equity - _state.initial_cash) / _state.initial_cash) * 100.0, 2)
    _state.nav_per_unit = round((_state.total_equity / _state.initial_cash) * 1000.0, 2)
    _save_journal_state(_state)


@router.get("/portfolio-summary")
@router.get("/portfolio")
async def get_portfolio_summary():
    """Get complete portfolio summary for journal page."""
    _recalculate_portfolio()
    return _state.model_dump()


@router.post("/entries")
async def add_journal_entry(req: JournalEntryRequest):
    """
    Record a new trade entry (BUY or SELL) from Screener, QuickBuyModal, or Journal.
    """
    global _state
    sym = req.symbol.strip().upper()
    if not sym.endswith(".JK"):
        sym = f"{sym}.JK"

    total_shares = req.shares_lot * 100
    gross_val = total_shares * req.entry_price
    buy_fee = gross_val * 0.0015  # 0.15% fee
    total_cost = gross_val + buy_fee

    if req.action.upper() == "BUY":
        if total_cost > _state.cash_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Saldo kas tidak mencukupi (Tersedia: Rp {_state.cash_balance:,.0f}, Dibutuhkan: Rp {total_cost:,.0f})"
            )

        _state.cash_balance -= total_cost
        today_str = req.trade_date or datetime.now().strftime("%Y-%m-%d")

        new_pos = {
            "id": str(uuid.uuid4())[:8],
            "symbol": sym,
            "entry_price": req.entry_price,
            "current_price": req.entry_price,
            "shares_lot": req.shares_lot,
            "total_shares": total_shares,
            "entry_date": today_str,
            "invested_capital": round(total_cost, 2),
            "status": "OPEN",
            "notes": req.notes or f"Manual Entry #{sym}"
        }
        _state.open_positions.append(new_pos)
        _recalculate_portfolio()

        return {
            "status": "SUCCESS",
            "message": f"Berhasil mencatat pembelian {req.shares_lot} lot #{sym} @ Rp {req.entry_price:,.0f}",
            "position": new_pos,
            "portfolio": _state.model_dump()
        }

    else:
        # SELL Action
        open_match = [p for p in _state.open_positions if p["symbol"] == sym]
        if not open_match:
            raise HTTPException(status_code=400, detail=f"Tidak ada posisi terbuka untuk saham {sym} untuk dijual.")

        target = open_match[0]
        sell_fee = gross_val * 0.0025
        net_proceeds = gross_val - sell_fee
        cost_basis = target["entry_price"] * total_shares * 1.0015
        pnl_amt = net_proceeds - cost_basis
        pnl_pct = (pnl_amt / cost_basis) * 100.0 if cost_basis > 0 else 0.0

        _state.cash_balance += net_proceeds
        _state.open_positions = [p for p in _state.open_positions if p["id"] != target["id"]]

        closed_pos = {
            "id": target["id"],
            "symbol": sym,
            "entry_price": target["entry_price"],
            "exit_price": req.entry_price,
            "shares_lot": req.shares_lot,
            "entry_date": target["entry_date"],
            "exit_date": req.trade_date or datetime.now().strftime("%Y-%m-%d"),
            "status": "CLOSED",
            "realized_pnl_rp": round(pnl_amt, 2),
            "realized_pnl_pct": round(pnl_pct, 2),
            "notes": req.notes or "Manual Exit"
        }
        _state.closed_positions.append(closed_pos)
        _recalculate_portfolio()

        return {
            "status": "SUCCESS",
            "realized_pnl_amt": round(pnl_amt, 2),
            "message": f"Berhasil mencatat penjualan {req.shares_lot} lot #{sym} @ Rp {req.entry_price:,.0f}",
            "closed_position": closed_pos,
            "portfolio": _state.model_dump()
        }


@router.post("/buy")
async def record_buy_trade(trade: TradeEntry):
    """Backward-compatible BUY endpoint."""
    return await add_journal_entry(
        JournalEntryRequest(
            symbol=trade.symbol,
            entry_price=trade.price,
            shares_lot=int(trade.shares / 100) if trade.shares >= 100 else 1,
            action="BUY",
            notes=trade.notes
        )
    )


@router.post("/sell")
async def record_sell_trade(trade: TradeEntry):
    """Backward-compatible SELL endpoint."""
    return await add_journal_entry(
        JournalEntryRequest(
            symbol=trade.symbol,
            entry_price=trade.price,
            shares_lot=int(trade.shares / 100) if trade.shares >= 100 else 1,
            action="SELL",
            notes=trade.notes
        )
    )


@router.get("/trades")
async def list_closed_trades():
    """List all closed trades with realized P&L."""
    return {
        "count": len(_state.closed_positions),
        "trades": _state.closed_positions
    }


@router.post("/reset")
async def reset_journal(initial_capital: float = Body(100_000_000.0, embed=True)):
    """Reset journal portfolio to initial balance."""
    global _state
    today_str = datetime.now().strftime("%Y-%m-%d")
    _state = JournalState(
        initial_cash=initial_capital,
        cash_balance=initial_capital,
        total_equity=initial_capital,
        stock_market_value=0.0,
        total_pnl_rp=0.0,
        total_pnl_pct=0.0,
        open_positions=[],
        closed_positions=[],
        nav_history=[{"date": today_str, "nav": 1000.0}]
    )
    _save_journal_state(_state)
    return {"status": "SUCCESS", "message": "Jurnal berhasil di-reset.", "portfolio": _state.model_dump()}
