"""
Danger Shield & Anti-Suspension/FCA/ARB Radar API Router.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query
from src.data.universe import FULL_IDX_UNIVERSE, is_stock_sharia
from src.data.collector import DataCollector
from src.analytics.stock_shield import StockShieldEngine

router = APIRouter(prefix="/shield", tags=["Danger & Risk Shield"])
collector = DataCollector()
shield_engine = StockShieldEngine()


@router.get("/radar")
def get_danger_shield_radar(
    filter_type: Optional[str] = Query("ALL", description="ALL, FCA, SUSPENSION, ARB, SAFE"),
    limit: int = Query(50, ge=1, le=100)
) -> Dict[str, Any]:
    """
    Scans the IDX universe and returns a real-time Risk Radar categorizing stocks into:
    - FCA Hazard (Papan Pemantauan Khusus / Gocap / Likuiditas Mati)
    - Suspension Hazard (UMA / Kenaikan Liar / Volatilitas Ekstrem)
    - ARB Hazard (Distribusi Pucuk / Breakdown Waterfall / Dekat Gembok ARB)
    - Safe Tier Alpha (Bebas Seluruh Risiko Bahaya)
    """
    sample_universe = FULL_IDX_UNIVERSE[:60]
    symbols = [s["symbol"] for s in sample_universe]

    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="30d", max_workers=10)

    fca_list = []
    suspension_list = []
    arb_list = []
    safe_list = []

    for stock in sample_universe:
        sym = stock["symbol"]
        name = stock.get("name", sym)
        sector = stock.get("sector", "General")
        is_sharia = is_stock_sharia(sym)

        df = ohlcv_map.get(sym)
        if df is None or df.empty or len(df) < 5:
            continue

        c = float(df["close"].iloc[-1])
        prev_c = float(df["close"].iloc[-2]) if len(df) >= 2 else c
        v = float(df["volume"].iloc[-1])
        v_ma = float(df["volume"].iloc[-20:].mean()) if len(df) >= 20 else v
        adtv = v_ma * c

        ret_1m = float(((c - df["close"].iloc[-20]) / df["close"].iloc[-20]) * 100.0) if len(df) >= 20 else 0.0
        ret_3m = float(((c - df["close"].iloc[0]) / df["close"].iloc[0]) * 100.0)
        atr_pct = float(((df["high"] - df["low"]).tail(14).mean() / c) * 100.0) if len(df) >= 14 else 3.0
        vol_intensity = float(v / (v_ma + 1e-6))

        fund = collector.fetch_fundamentals(sym)

        eval_res = shield_engine.evaluate_stock_safety(
            symbol=sym,
            price=c,
            fundamentals=fund,
            adtv_20=adtv,
            df_ohlcv=df,
            return_1m=ret_1m,
            return_3m=ret_3m,
            volume_intensity=vol_intensity,
            atr_pct=atr_pct
        )

        item = {
            "symbol": sym,
            "name": name,
            "sector": sector,
            "is_sharia": is_sharia,
            "current_price": c,
            "change_pct": round(((c - prev_c) / prev_c) * 100.0, 2) if prev_c > 0 else 0.0,
            "safety_score": eval_res["safety_score"],
            "risk_score": eval_res["risk_score"],
            "risk_level": eval_res["risk_level"],
            "shield_verdict": eval_res["shield_verdict"],
            "risk_badge": eval_res["risk_badge"],
            "risk_color": eval_res["risk_color"],
            "is_safe_to_buy": eval_res["is_safe_to_buy"],
            "is_fca_hazard": eval_res["is_fca_hazard"],
            "fca_reasons": eval_res["fca_reasons"],
            "is_suspension_hazard": eval_res["is_suspension_hazard"],
            "suspension_reasons": eval_res["suspension_reasons"],
            "is_arb_hazard": eval_res["is_arb_hazard"],
            "arb_reasons": eval_res["arb_reasons"],
            "warning_flags": eval_res["warning_flags"],
            "human_advice": eval_res["human_advice"]
        }

        if eval_res["is_fca_hazard"]:
            fca_list.append(item)
        if eval_res["is_suspension_hazard"]:
            suspension_list.append(item)
        if eval_res["is_arb_hazard"]:
            arb_list.append(item)
        if eval_res["is_safe_to_buy"]:
            safe_list.append(item)

    all_flagged = fca_list + [x for x in suspension_list if x["symbol"] not in [f["symbol"] for f in fca_list]] + [x for x in arb_list if x["symbol"] not in [f["symbol"] for f in fca_list] and x["symbol"] not in [s["symbol"] for s in suspension_list]]

    return {
        "total_scanned": len(sample_universe),
        "total_hazardous_count": len(all_flagged),
        "total_safe_count": len(safe_list),
        "fca_count": len(fca_list),
        "suspension_count": len(suspension_list),
        "arb_count": len(arb_list),
        "fca_hazards": fca_list[:limit],
        "suspension_hazards": suspension_list[:limit],
        "arb_hazards": arb_list[:limit],
        "safe_stocks": safe_list[:limit]
    }


@router.get("/check/{symbol}")
def check_single_stock_safety(symbol: str) -> Dict[str, Any]:
    """
    Comprehensive safety & anti-suspension/FCA/ARB diagnostic for a single stock.
    """
    sym = symbol.upper() if symbol.endswith(".JK") else f"{symbol.upper()}.JK"
    df = collector.fetch_daily_ohlcv(sym, period="3mo")
    if df.empty or len(df) < 5:
        return {"symbol": sym, "error": "Data OHLCV tidak memadai"}

    c = float(df["close"].iloc[-1])
    prev_c = float(df["close"].iloc[-2]) if len(df) >= 2 else c
    v = float(df["volume"].iloc[-1])
    v_ma = float(df["volume"].iloc[-20:].mean()) if len(df) >= 20 else v
    adtv = v_ma * c

    ret_1m = float(((c - df["close"].iloc[-20]) / df["close"].iloc[-20]) * 100.0) if len(df) >= 20 else 0.0
    ret_3m = float(((c - df["close"].iloc[0]) / df["close"].iloc[0]) * 100.0)
    atr_pct = float(((df["high"] - df["low"]).tail(14).mean() / c) * 100.0) if len(df) >= 14 else 3.0
    vol_intensity = float(v / (v_ma + 1e-6))

    fund = collector.fetch_fundamentals(sym)

    eval_res = shield_engine.evaluate_stock_safety(
        symbol=sym,
        price=c,
        fundamentals=fund,
        adtv_20=adtv,
        df_ohlcv=df,
        return_1m=ret_1m,
        return_3m=ret_3m,
        volume_intensity=vol_intensity,
        atr_pct=atr_pct
    )

    return {
        "symbol": sym,
        "is_sharia": is_stock_sharia(sym),
        "current_price": c,
        "change_pct": round(((c - prev_c) / prev_c) * 100.0, 2) if prev_c > 0 else 0.0,
        **eval_res
    }
