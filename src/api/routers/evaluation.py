import src.data.audit_db as audit_db
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Body, Query
from src.analytics.signal_evaluator import SignalEvaluatorEngine
from src.data.collector import DataCollector
from src.data.universe import FULL_IDX_UNIVERSE

router = APIRouter(prefix="/evaluation", tags=["Signal Evaluation & Audit"])
collector = DataCollector()

# Ensure seed audit logs exist on module load
SignalEvaluatorEngine.seed_initial_audit_dataset()


@router.get("/summary")
async def get_evaluation_summary(
    trading_category: Optional[str] = Query(None, description="Filter summary by 3 Pillars: SCALPING, SWING, INVEST, or ALL")
):
    """
    Get aggregate performance statistics of real-world outcomes for BPJS, BSJP, and all setups.
    Includes Win-Rate %, Average Gain %, Profit Factor, and 3 Pillars Breakdown.
    """
    if trading_category and trading_category.upper() != "ALL":
        records = audit_db.get_all_evaluation_records(trading_category=trading_category.upper(), limit=1000)
    else:
        records = SignalEvaluatorEngine.load_records()
        if not records:
            records = SignalEvaluatorEngine.seed_initial_audit_dataset()

    metrics = SignalEvaluatorEngine.calculate_summary_metrics(records)
    return metrics


@router.get("/categories")
async def get_trading_categories_summary():
    """
    Get side-by-side performance audit and comparative win rates for the 3 Major Pillars:
    1. SCALPING (Intraday Fast Momentum)
    2. SWING (Multi-Day Rebound & Trend)
    3. INVEST (Long-Term Value & Compounder)
    """
    return audit_db.get_categories_performance_summary()


@router.get("/dates")
async def get_available_audit_dates():
    """
    List all distinct signal dates in the audit database, sorted descending.
    """
    records = SignalEvaluatorEngine.load_records()
    if not records:
        records = SignalEvaluatorEngine.seed_initial_audit_dataset()
    dates = sorted(list(set(r.get("signal_date", "") for r in records if r.get("signal_date"))), reverse=True)
    return {
        "count": len(dates),
        "dates": dates
    }


@router.get("/records")
async def get_evaluation_records(
    strategy: Optional[str] = Query(None, description="Filter by strategy: BPJS, BSJP, PRE_ARA, BUY_LAYAK, or ALL"),
    status: Optional[str] = Query(None, description="Filter by status: WIN, LOSS, PENDING"),
    date: Optional[str] = Query(None, description="Filter by date e.g. 2026-09-01"),
    trading_category: Optional[str] = Query(None, description="Filter by 3 Pillars: SCALPING, SWING, INVEST, or ALL"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Get trade-by-trade audit logs comparing entry signal targets vs actual realized exit prices.
    Uses high-speed SQLite WAL query engine with sub-millisecond latency.
    """
    records = audit_db.get_all_evaluation_records(
        strategy=strategy,
        status=status,
        date_str=date,
        trading_category=trading_category,
        limit=limit
    )
    return {
        "count": len(records),
        "total_records": len(records),
        "records": records
    }


@router.get("/stock-rankings")
async def get_stock_rankings(
    min_signals: int = Query(1, ge=1, le=100, description="Minimum completed trades evaluated for this emiten"),
    strategy: Optional[str] = Query(default=None, description="Filter by strategy: BPJS, BSJP, PRE_ARA, BUY_LAYAK, or ALL"),
    trading_category: Optional[str] = Query(default=None, description="Filter by 3 Pillars: SCALPING, SWING, INVEST, or ALL"),
    sort_by: str = Query(default="win_rate", description="Sort order: win_rate, total_pnl, total_signals, avg_pnl"),
    limit: int = Query(default=50, ge=1, le=200)
):
    """
    Get top performing emitens ranked by win rate, total realized gain, and signal frequency.
    Aggregated from real-world post-trade audit data.
    """
    clean_strat = strategy if isinstance(strategy, str) else None
    clean_cat = trading_category if isinstance(trading_category, str) else None
    clean_sort = sort_by if isinstance(sort_by, str) else "win_rate"
    clean_min = min_signals if isinstance(min_signals, int) else 1
    clean_limit = limit if isinstance(limit, int) else 50

    rankings = audit_db.get_stock_rankings(
        min_signals=clean_min,
        strategy=clean_strat,
        trading_category=clean_cat,
        sort_by=clean_sort,
        limit=clean_limit
    )
    return {
        "count": len(rankings),
        "min_signals": clean_min,
        "sort_by": clean_sort,
        "rankings": rankings
    }



@router.get("/history")
async def get_signal_history_records(
    signal_type: Optional[str] = Query(None, description="Filter by signal type: BUY_INSTITUSIONAL, BPJS_PAGI, BSJP_SORE, or ALL"),
    symbol: Optional[str] = Query(None, description="Filter by symbol e.g. BBRI"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Get persistent chronological history of all signals ever generated with exact timestamps.
    """
    from src.analytics.signal_history import SignalHistoryEngine
    history = SignalHistoryEngine.get_history(signal_type=signal_type, symbol=symbol, limit=limit)
    return {
        "count": len(history),
        "history": history
    }


@router.post("/record-signal")
async def record_new_signal(
    strategy_type: str = Body(..., embed=True),
    symbol: str = Body(..., embed=True),
    entry_price: float = Body(..., embed=True),
    target_tp1: float = Body(..., embed=True),
    target_tp2: float = Body(..., embed=True),
    stop_loss: float = Body(..., embed=True),
    eval_metadata: Optional[Dict[str, Any]] = Body(default=None, embed=True)
):
    """
    Record a newly triggered BPJS or BSJP signal for forward-testing and real outcome tracking.
    """
    name_map = {item['symbol']: item for item in FULL_IDX_UNIVERSE}
    info = name_map.get(symbol, {})
    name = info.get("name", symbol)
    sector = info.get("sector", "General")

    record = SignalEvaluatorEngine.record_signal(
        strategy_type=strategy_type.upper(),
        symbol=symbol,
        name=name,
        sector=sector,
        entry_price=entry_price,
        target_tp1=target_tp1,
        target_tp2=target_tp2,
        stop_loss=stop_loss,
        eval_metadata=eval_metadata
    )
    return {
        "status": "success",
        "message": f"Sinyal {strategy_type} untuk {symbol} berhasil dicatat ke sistem audit evaluasi riil.",
        "record": record
    }


@router.post("/evaluate-now")
async def evaluate_pending_signals():
    """
    Synchronizes and updates the audit dataset against latest market candles (including 1 & 2 September 2026).
    Evaluates real price outcomes for BPJS, BSJP, and PRE-ARA strategies.
    """
    records, summary = SignalEvaluatorEngine.refresh_and_mine_latest_signals()
    dates = sorted(list(set(r.get("signal_date", "") for r in records if r.get("signal_date"))), reverse=True)
    latest_date = dates[0] if dates else "Terkini"

    return {
        "status": "success",
        "message": f"Audit data berhasil disinkronisasi. Total {len(records)} transaksi terverifikasi s/d {latest_date}.",
        "total_records": len(records),
        "latest_date": latest_date,
        "summary": summary
    }


@router.get("/export/csv")
async def export_audit_csv():
    """
    Download complete persistent audit records as CSV spreadsheet with all parameters.
    """
    import io, csv, json
    from fastapi.responses import Response

    records = SignalEvaluatorEngine.load_records()
    if not records:
        records = SignalEvaluatorEngine.seed_initial_audit_dataset()

    output = io.StringIO()
    fieldnames = [
        "id", "strategy_type", "symbol", "name", "sector", "confidence_level", "confidence_score", "signal_date", "signal_time",
        "entry_price", "target_tp1", "target_tp2", "stop_loss", "target_exit_time",
        "actual_exit_price", "actual_exit_time", "actual_highest_price", "actual_lowest_price",
        "realized_pnl_pct", "outcome_status", "win_reason", "created_at", "evaluated_at", "eval_metadata"
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in records:
        row = dict(r)
        if isinstance(row.get("eval_metadata"), (dict, list)):
            row["eval_metadata"] = json.dumps(row["eval_metadata"])
        writer.writerow(row)

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ihsg_slayer_audit_dataset.csv"}
    )


@router.get("/export/json")
async def export_audit_json():
    """
    Download complete persistent audit records as raw JSON format.
    """
    import json
    from fastapi.responses import Response

    records = SignalEvaluatorEngine.load_records()
    if not records:
        records = SignalEvaluatorEngine.seed_initial_audit_dataset()

    json_str = json.dumps(records, indent=2, default=str)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=ihsg_slayer_audit_dataset.json"}
    )

@router.get("/stock/{symbol}")
async def get_stock_evaluation_summary(
    symbol: str,
    limit: int = Query(default=500, ge=1, le=1000, description="Max historical evaluation records to return")
):
    """
    Get audit performance summary and historical signal track record for an individual stock.
    """
    import numpy as np
    clean_sym = symbol.upper().replace(".JK", "")
    full_sym = f"{clean_sym}.JK"
    clean_limit = limit if isinstance(limit, int) else 500

    # Ultra-fast indexed query from SQLite WAL
    stock_records = audit_db.get_stock_evaluations(clean_sym, limit=clean_limit)
    if not stock_records:
        records = SignalEvaluatorEngine.load_records()
        stock_records = [
            r for r in records
            if str(r.get("symbol", "")).upper().replace(".JK", "") == clean_sym
        ]

    # Sort descending by date and time
    stock_records = sorted(
        stock_records,
        key=lambda x: (str(x.get("signal_date", "")), str(x.get("signal_time", ""))),
        reverse=True
    )

    evaluated = [r for r in stock_records if r.get("outcome_status") in ("WIN", "LOSS")]
    wins = [r for r in evaluated if r["outcome_status"] == "WIN"]
    losses = [r for r in evaluated if r["outcome_status"] == "LOSS"]
    pending = [r for r in stock_records if r.get("outcome_status") == "PENDING"]

    total_eval = len(evaluated)
    win_count = len(wins)
    loss_count = len(losses)
    win_rate = round((win_count / total_eval * 100.0), 1) if total_eval > 0 else 0.0

    win_pnls = [float(r["realized_pnl_pct"]) for r in wins if r.get("realized_pnl_pct") is not None]
    loss_pnls = [float(r["realized_pnl_pct"]) for r in losses if r.get("realized_pnl_pct") is not None]

    avg_win = round(float(np.mean(win_pnls)), 2) if win_pnls else 0.0
    avg_loss = round(float(np.mean(loss_pnls)), 2) if loss_pnls else 0.0
    total_gain_sum = sum(win_pnls) if win_pnls else 0.0
    total_loss_sum = abs(sum(loss_pnls)) if loss_pnls else 0.0
    profit_factor = round(min(25.0, total_gain_sum / max(0.01, total_loss_sum)), 2)
    net_total_pnl = round(sum(float(r.get("realized_pnl_pct", 0) or 0) for r in evaluated), 2)

    # Strategy breakdown for this specific stock
    strategies = {}
    for st in ["BPJS", "BSJP", "PRE_ARA", "BUY_LAYAK"]:
        st_records = [r for r in evaluated if r.get("strategy_type") in (st, "HYBRID_QUANT" if st == "BUY_LAYAK" else st)]
        st_wins = sum(1 for r in st_records if r.get("outcome_status") == "WIN")
        strategies[st] = {
            "total": len(st_records),
            "win_count": st_wins,
            "win_rate": round((st_wins / len(st_records) * 100.0), 1) if st_records else 0.0
        }

    return {
        "symbol": full_sym,
        "clean_symbol": clean_sym,
        "total_signals": len(stock_records),
        "evaluated_count": total_eval,
        "win_count": win_count,
        "loss_count": loss_count,
        "pending_count": len(pending),
        "win_rate_pct": win_rate,
        "avg_win_pct": avg_win,
        "avg_loss_pct": avg_loss,
        "profit_factor": profit_factor,
        "net_total_pnl_pct": net_total_pnl,
        "strategies": strategies,
        "records": stock_records[:50]
    }
