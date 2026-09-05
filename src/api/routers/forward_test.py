"""
Forward Test & Paper Trading API Router.
Provides endpoints for monitoring forward testing portfolio, opening/closing positions,
synchronizing real-time prices, and controlling automated quantitative forward test bot.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from src.analytics.forward_tester import ForwardTestEngine, ForwardPosition
from src.data.collector import DataCollector
from src.data.universe import FULL_IDX_UNIVERSE

router = APIRouter(prefix="/forward-test", tags=["Forward Testing Studio"])
collector = DataCollector()
engine = ForwardTestEngine.get_instance()


class OpenPositionRequest(BaseModel):
    symbol: str
    strategy: str = "BPJS"
    entry_price: float
    shares_lot: int = 50
    target_tp1: float
    target_tp2: float
    stop_loss: float
    name: str = ""
    sector: str = ""
    selling_time_window: str = ""
    notes: str = ""


class ClosePositionRequest(BaseModel):
    position_id: str
    close_price: Optional[float] = None
    exit_reason: str = "MANUAL"
    notes: str = ""


class BotSettingsRequest(BaseModel):
    auto_bot_enabled: Optional[bool] = None
    max_concurrent_positions: Optional[int] = None
    default_lot_per_trade: Optional[int] = None
    auto_tp_enabled: Optional[bool] = None
    auto_sl_enabled: Optional[bool] = None
    auto_time_stop_enabled: Optional[bool] = None
    trailing_stop_enabled: Optional[bool] = None
    min_score_filter: Optional[float] = None


@router.get("/status")
async def get_forward_test_status():
    """
    Get current Forward Test simulation status, open positions, KPIs, and closed trade audit logs.
    """
    portfolio = engine.portfolio
    engine._recalculate_metrics()
    return portfolio.model_dump()


@router.post("/open")
async def open_forward_position(req: OpenPositionRequest):
    """
    Open a new paper trading position in Forward Test portfolio.
    """
    try:
        pos = engine.open_position(
            symbol=req.symbol,
            strategy=req.strategy,
            entry_price=req.entry_price,
            shares_lot=req.shares_lot,
            target_tp1=req.target_tp1,
            target_tp2=req.target_tp2,
            stop_loss=req.stop_loss,
            name=req.name,
            sector=req.sector,
            selling_time_window=req.selling_time_window,
            notes=req.notes
        )
        return {"status": "SUCCESS", "message": f"Posisi {req.symbol} berhasil dibuka pada Rp {req.entry_price:,.0f}", "position": pos.model_dump()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/close")
async def close_forward_position(req: ClosePositionRequest):
    """
    Close an open paper trading position in Forward Test portfolio.
    """
    try:
        closed = engine.close_position(
            position_id=req.position_id,
            close_price=req.close_price,
            exit_reason=req.exit_reason,
            notes=req.notes
        )
        return {
            "status": "SUCCESS",
            "message": f"Posisi {closed.symbol} berhasil ditutup pada Rp {closed.close_price:,.0f} ({'+' if (closed.realized_pnl_pct or 0)>0 else ''}{closed.realized_pnl_pct}%)",
            "position": closed.model_dump()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sync-prices")
async def sync_live_prices():
    """
    Fetch live prices for all open positions and trigger automated TP/SL/Trailing Stop rules.
    """
    open_positions = engine.portfolio.open_positions
    if not open_positions:
        return {"status": "SUCCESS", "message": "Tidak ada posisi terbuka untuk disinkronkan.", "actions": []}

    symbols = [pos.symbol for pos in open_positions]
    price_map = {}

    for sym in symbols:
        try:
            ohlcv = collector.fetch_historical_ohlcv(sym, period="5d")
            if not ohlcv.empty:
                last_p = float(ohlcv['close'].iloc[-1])
                price_map[sym] = last_p
        except Exception:
            pass

    actions = engine.sync_live_prices(price_map)
    return {
        "status": "SUCCESS",
        "synced_count": len(price_map),
        "actions_triggered": actions,
        "portfolio": engine.portfolio.model_dump()
    }


@router.post("/bot-settings")
async def update_bot_settings(req: BotSettingsRequest):
    """
    Update automated quantitative forward test bot settings.
    """
    p = engine.portfolio
    if req.auto_bot_enabled is not None:
        p.auto_bot_enabled = req.auto_bot_enabled
        engine.log_bot_event(
            action="BOT_STATE_CHANGE",
            message=f"Auto-Bot diubah menjadi {'AKTIF' if req.auto_bot_enabled else 'NONAKTIF'}.",
            level="INFO"
        )
    if req.max_concurrent_positions is not None:
        p.bot_settings["max_concurrent_positions"] = req.max_concurrent_positions
    if req.default_lot_per_trade is not None:
        p.bot_settings["default_lot_per_trade"] = req.default_lot_per_trade
    if req.auto_tp_enabled is not None:
        p.bot_settings["auto_tp_enabled"] = req.auto_tp_enabled
    if req.auto_sl_enabled is not None:
        p.bot_settings["auto_sl_enabled"] = req.auto_sl_enabled
    if req.auto_time_stop_enabled is not None:
        p.bot_settings["auto_time_stop_enabled"] = req.auto_time_stop_enabled
    if req.trailing_stop_enabled is not None:
        p.bot_settings["trailing_stop_enabled"] = req.trailing_stop_enabled
    if req.min_score_filter is not None:
        p.bot_settings["min_score_filter"] = req.min_score_filter

    engine._save_state()
    return {"status": "SUCCESS", "bot_settings": p.bot_settings, "auto_bot_enabled": p.auto_bot_enabled}


@router.post("/bot/run-cycle")
async def run_autonomous_bot_cycle():
    """
    Trigger 1 full autonomous bot cycle immediately (live price evaluation + auto scan & entry).
    """
    from src.api.routers.screener import _build_current_universe_metrics
    from src.analytics.pre_ara_hunter import PreARAHunterEngine
    from src.analytics.bpjs import BPJSEngine
    from src.analytics.bsjp import BSJPEngine

    universe_metrics = _build_current_universe_metrics()
    ohlcv_map = {m["symbol"]: collector.fetch_historical_ohlcv(m["symbol"], period="3mo") for m in universe_metrics[:30]}

    candidates_pool = []
    try:
        pre_ara = PreARAHunterEngine.scan_pre_ara_universe(ohlcv_map, min_score=60.0)
        for c in pre_ara:
            d = c.model_dump()
            d["strat_code"] = "PRE_ARA"
            candidates_pool.append(d)
    except Exception:
        pass

    try:
        bpjs = BPJSEngine.scan_bpjs_universe(ohlcv_map, min_score=60.0)
        for c in bpjs:
            d = c.model_dump()
            d["strat_code"] = "BPJS"
            candidates_pool.append(d)
    except Exception:
        pass

    cycle_result = engine.execute_autonomous_cycle(candidates_pool)
    return {
        "status": "SUCCESS",
        "cycle_result": cycle_result,
        "portfolio": engine.portfolio.model_dump()
    }


@router.get("/bot/logs")
async def get_bot_logs(limit: int = 50):
    """
    Get latest live activity logs from the quantitative autonomous bot.
    """
    logs = engine.portfolio.bot_logs[:limit]
    return {"count": len(logs), "logs": [l.model_dump() for l in logs]}


@router.post("/reset")
async def reset_forward_portfolio(initial_capital: float = Body(100_000_000.0, embed=True)):
    """
    Reset forward testing paper portfolio to initial capital.
    """
    engine.reset_portfolio(initial_capital)
    return {"status": "SUCCESS", "message": f"Portofolio Forward Test berhasil di-reset ke modal Rp {initial_capital:,.0f}."}
