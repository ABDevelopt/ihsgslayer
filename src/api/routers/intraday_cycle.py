"""
FastAPI Router for Intraday Market Cycle & Morning Fade Protection.
Provides endpoints for:
1. Real-time WIB market timing radar (/intraday/radar)
2. Live screener for Morning Fade vs Healthy Retest stocks (/intraday/fade-screener)
3. One-click Profit & Breakeven Lock execution (/intraday/lock-breakeven)
4. Specific stock fade evaluation (/intraday/stock/{symbol}/fade-analysis)
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException
from src.analytics.morning_fade_engine import MorningFadeEngine
from src.analytics.forward_tester import ForwardTestEngine

router = APIRouter(prefix="/intraday", tags=["Intraday Cycle & Morning Fade"])


@router.get("/radar", summary="Get Current Real-Time WIB Market Timing Phase")
def get_intraday_radar() -> Dict[str, Any]:
    """
    Get current market timing phase in WIB with tactical instructions and prohibited actions.
    """
    engine = MorningFadeEngine.get_instance()
    current_phase = engine.get_current_intraday_phase()

    is_fri = current_phase.get("is_friday", False)

    if is_fri:
        schedule = [
            {"time": "08:45 - 09:00", "phase": "Pre-Opening Discovery", "action": "Siapkan order jual BSJP"},
            {"time": "09:00 - 09:15", "phase": "Euforia Pembukaan (Seller Mode)", "action": "Eksekusi Take Profit BSJP, DILARANG ENTRY BPJS"},
            {"time": "09:15 - 09:45", "phase": "Jendela Emas BPJS (Buyer Mode)", "action": "Entry BPJS terkonfirmasi (Diskon Sizing 50%)"},
            {"time": "09:45 - 10:30", "phase": "Morning Retest & Kunci Breakeven", "action": "Kunci Breakeven (+0.4% fee)"},
            {"time": "10:30 - 11:30", "phase": "Melandai Sesi 1 Jumat", "action": "Sesi 1 tutup 11:30 WIB, hindari order baru"},
            {"time": "11:30 - 14:00", "phase": "Jeda Sholat Jumat", "action": "Bursa rehat, tidak ada perdagangan"},
            {"time": "14:00 - 14:30", "phase": "Pembukaan Sesi 2 Jumat", "action": "Volume tipis, waspadai aksi de-risking"},
            {"time": "14:30 - 15:45", "phase": "Penutupan Jumat (Weekend De-Risking)", "action": "Amankan kas >= 70-100%, filter BSJP super ketat"},
            {"time": "15:45 - 16:00", "phase": "Pre-Closing (100% Cash Enforcement)", "action": "Tutup seluruh posisi scalping/intraday"},
        ]
    else:
        schedule = [
            {"time": "08:45 - 09:00", "phase": "Pre-Opening Discovery", "action": "Siapkan order jual BSJP"},
            {"time": "09:00 - 09:15", "phase": "Euforia Pembukaan (Seller Mode)", "action": "Eksekusi Take Profit BSJP, DILARANG ENTRY BPJS"},
            {"time": "09:15 - 09:45", "phase": "Jendela Emas BPJS (Buyer Mode)", "action": "Entry saham BPJS terkonfirmasi Open=Low & VWAP"},
            {"time": "09:45 - 10:30", "phase": "Morning Retest & Kunci Breakeven", "action": "Kunci Breakeven (+0.4% fee), hindari entry baru"},
            {"time": "10:30 - 13:30", "phase": "Melandai Siang (Liquidity Bleed)", "action": "Disiplin Wait & See"},
            {"time": "13:30 - 14:30", "phase": "Penemuan Tren Sesi 2", "action": "Observasi saham bertahan"},
            {"time": "14:30 - 15:45", "phase": "Akumulasi Penutupan (Golden BSJP)", "action": "Akumulasi beli sore untuk gap-up esok"},
            {"time": "15:45 - 16:00", "phase": "Pre-Closing & Zero Overnight", "action": "Tutup posisi scalping 100% Cash"},
        ]

    return {
        "current_phase": current_phase,
        "full_schedule": schedule,
        "friday_shield": current_phase.get("friday_shield")
    }


@router.get("/friday-shield", summary="Get Friday Risk Shield & Weekend De-Risking Profile")
def get_friday_shield_profile() -> Dict[str, Any]:
    """
    Get real-time Friday Risk Shield parameters (position sizing multiplier, cash reserve targets).
    """
    from src.analytics.friday_shield import FridayShieldEngine
    return FridayShieldEngine.get_friday_risk_profile()


@router.get("/fade-screener", summary="Screen for Morning Fade vs Healthy Retest Candidates")
def get_fade_screener() -> Dict[str, Any]:
    """
    Screen active liquid stocks to separate those suffering from morning profit-taking fade
    from those displaying clean institutional retests.
    """
    engine = MorningFadeEngine.get_instance()

    # Curated / active watchlist mock data covering active IDX momentum tickers
    mock_universe = [
        {"symbol": "MEDC.JK", "open": 1380, "high": 1445, "low": 1375, "current": 1435, "prev_close": 1360, "vwap": 1420},
        {"symbol": "BRMS.JK", "open": 420, "high": 456, "low": 418, "current": 424, "prev_close": 410, "vwap": 435},
        {"symbol": "ADRO.JK", "open": 3720, "high": 3790, "low": 3710, "current": 3770, "prev_close": 3690, "vwap": 3750},
        {"symbol": "ANTM.JK", "open": 1610, "high": 1690, "low": 1600, "current": 1615, "prev_close": 1590, "vwap": 1650},
        {"symbol": "BBCA.JK", "open": 10100, "high": 10250, "low": 10075, "current": 10200, "prev_close": 10050, "vwap": 10180},
        {"symbol": "ENRG.JK", "open": 240, "high": 268, "low": 238, "current": 244, "prev_close": 234, "vwap": 255},
        {"symbol": "ASII.JK", "open": 5050, "high": 5150, "low": 5050, "current": 5125, "prev_close": 5000, "vwap": 5100},
        {"symbol": "GOTO.JK", "open": 72, "high": 79, "low": 71, "current": 73, "prev_close": 70, "vwap": 76},
    ]

    fading_stocks = []
    healthy_retests = []

    for item in mock_universe:
        eval_res = engine.evaluate_morning_fade(
            symbol=item["symbol"],
            open_price=float(item["open"]),
            high_price=float(item["high"]),
            low_price=float(item["low"]),
            current_price=float(item["current"]),
            prev_close=float(item["prev_close"]),
            vwap=float(item.get("vwap", item["open"]))
        )
        if eval_res["is_fading"]:
            fading_stocks.append(eval_res)
        elif eval_res["is_healthy_retest"]:
            healthy_retests.append(eval_res)

    return {
        "fading_stocks": fading_stocks,
        "healthy_retests": healthy_retests,
        "total_scanned": len(mock_universe)
    }


@router.post("/lock-breakeven", summary="Execute Breakeven Profit Lock Across All Active Positions")
def execute_breakeven_lock(min_gain_pct: float = Query(2.0, ge=0.5, le=10.0)) -> Dict[str, Any]:
    """
    Elevates stop loss to breakeven (+0.4% fee coverage) on all qualifying green positions.
    """
    ft_engine = ForwardTestEngine.get_instance()
    locked_count = ft_engine.lock_all_qualifying_breakeven(min_gain_pct=min_gain_pct)
    return {
        "status": "SUCCESS",
        "positions_locked": locked_count,
        "min_gain_threshold_pct": min_gain_pct,
        "message": f"Berhasil mengunci modal pada {locked_count} posisi aktif dengan keuntungan >= +{min_gain_pct}%."
    }


@router.get("/stock/{symbol}/fade-analysis", summary="Analyze Morning Fade for a Specific Stock")
def get_stock_fade_analysis(
    symbol: str,
    open_price: float = Query(..., description="Harga pembukaan hari ini"),
    high_price: float = Query(..., description="Harga tertinggi hari ini"),
    low_price: float = Query(..., description="Harga terendah hari ini"),
    current_price: float = Query(..., description="Harga saat ini"),
    prev_close: float = Query(..., description="Harga penutupan kemarin"),
    vwap: Optional[float] = Query(None, description="Volume Weighted Average Price")
) -> Dict[str, Any]:
    """
    Evaluate single stock candle anatomy to detect morning fade vs healthy support retest.
    """
    engine = MorningFadeEngine.get_instance()
    clean_sym = symbol.strip().upper()
    return engine.evaluate_morning_fade(
        symbol=clean_sym,
        open_price=open_price,
        high_price=high_price,
        low_price=low_price,
        current_price=current_price,
        prev_close=prev_close,
        vwap=vwap
    )