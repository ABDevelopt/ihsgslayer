import math
from typing import Optional, List, Dict, Any
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from src.data.collector import DataCollector
from src.data.universe import FULL_IDX_UNIVERSE, get_stock_info, is_stock_sharia
from src.analytics.patterns import PatternRecognizer
from src.analytics.order_flow import OrderFlowEngine
from src.analytics.broker_foreign import BrokerForeignEngine
from src.analytics.stock_shield import StockShieldEngine

router = APIRouter(prefix="/stocks", tags=["Stocks & Analytics"])

collector = DataCollector()
pattern_engine = PatternRecognizer()
order_flow_engine = OrderFlowEngine()
shield_engine = StockShieldEngine()

def _compute_technical_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute institutional-grade technical indicators from OHLCV DataFrame."""
    if df.empty or len(df) < 14:
        return {}

    close = df['close']
    high = df['high']
    low = df['low']

    # 1. Moving Averages
    ma20 = float(close.rolling(window=20).mean().iloc[-1]) if len(df) >= 20 else float(close.mean())
    ma50 = float(close.rolling(window=50).mean().iloc[-1]) if len(df) >= 50 else float(close.mean())
    ma200 = float(close.rolling(window=200).mean().iloc[-1]) if len(df) >= 200 else float(close.mean())

    # 2. RSI (14)
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=14).mean().iloc[-1]
    avg_loss = loss.rolling(window=14).mean().iloc[-1]
    if avg_loss == 0 or pd.isna(avg_loss):
        rsi14 = 100.0 if avg_gain > 0 else 50.0
    else:
        rs = avg_gain / (avg_loss + 1e-9)
        rsi14 = float(100.0 - (100.0 / (1.0 + rs)))

    # 3. Bollinger Bands (20, 2)
    rolling_std = float(close.rolling(window=20).std().iloc[-1]) if len(df) >= 20 else 0.0
    bb_upper = ma20 + (2.0 * rolling_std)
    bb_lower = ma20 - (2.0 * rolling_std)

    # 4. MACD (12, 26, 9)
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist = macd_line - signal_line

    # 5. Average True Range (ATR 14)
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr14 = float(tr.rolling(window=14).mean().iloc[-1]) if len(df) >= 14 else float(tr.mean())

    # 6. Classic Pivot Points
    last_h = float(high.iloc[-2]) if len(df) >= 2 else float(high.iloc[-1])
    last_l = float(low.iloc[-2]) if len(df) >= 2 else float(low.iloc[-1])
    last_c = float(close.iloc[-2]) if len(df) >= 2 else float(close.iloc[-1])

    pivot = (last_h + last_l + last_c) / 3.0
    r1 = (2.0 * pivot) - last_l
    s1 = (2.0 * pivot) - last_h
    r2 = pivot + (last_h - last_l)
    s2 = pivot - (last_h - last_l)

    curr_p = float(close.iloc[-1])
    trend_bias = "BULLISH_UPTREND" if curr_p > ma50 > ma200 else ("BEARISH_DOWNTREND" if curr_p < ma50 < ma200 else "CONSOLIDATION_SIDEWAYS")

    return {
        "current_price": curr_p,
        "trend_bias": trend_bias,
        "ma20": round(ma20, 2),
        "ma50": round(ma50, 2),
        "ma200": round(ma200, 2),
        "rsi_14": round(rsi14, 2),
        "rsi_status": "OVERSOLD" if rsi14 < 35 else ("OVERBOUGHT" if rsi14 > 70 else "NEUTRAL"),
        "bb_upper": round(bb_upper, 2),
        "bb_middle": round(ma20, 2),
        "bb_lower": round(bb_lower, 2),
        "macd": round(float(macd_line.iloc[-1]), 2),
        "macd_signal": round(float(signal_line.iloc[-1]), 2),
        "macd_hist": round(float(macd_hist.iloc[-1]), 2),
        "macd_status": "BULLISH_CROSS" if macd_line.iloc[-1] > signal_line.iloc[-1] else "BEARISH_CROSS",
        "atr_14": round(atr14, 2),
        "pivot_levels": {
            "pivot": round(pivot, 2),
            "resistance_1": round(r1, 2),
            "resistance_2": round(r2, 2),
            "support_1": round(s1, 2),
            "support_2": round(s2, 2)
        }
    }

def _compute_ai_verdict(
    ai_score: float,
    is_danger_zone: bool,
    order_flow: Dict[str, Any],
    patterns: List[Any],
    tech: Dict[str, Any],
    discount_pct: float,
    safety_shield: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Dynamically determine accurate AI Quantitative Verdict and specific action recommendation."""
    shield = safety_shield or {}
    
    if shield.get("is_gorengan", False):
        return {
            "action": "AVOID / SAHAM GORENGAN",
            "action_code": "DANGER_GORENGAN",
            "text": "PERINGATAN SAHAM GORENGAN: Terdeteksi lonjakan harga/volume ekstrem tanpa dukungan laba riil (Pump & Dump) atau likuiditas gocap. Pembelian DIBLOKIR.",
            "color": "rose"
        }

    if is_danger_zone or shield.get("is_danger", False):
        return {
            "action": "AVOID / DANGER ZONE",
            "action_code": "DANGER",
            "text": "Peringatan Risiko Tinggi! Emiten masuk kategori Danger Zone dengan beban hutang ekstrem, margin laba negatif, atau likuiditas macet. Sangat disarankan dihindari.",
            "color": "rose"
        }

    if not shield.get("allow_buy", True):
        return {
            "action": "AVOID / LIKUIDITAS GOCAP",
            "action_code": "DANGER_ILLIQUID",
            "text": "Peringatan Likuiditas: Saham berada di dekat harga gocap (<= Rp 60) atau transaksi harian terlalu sepi (< Rp 500 Jt/hari). Berisiko tinggi sulit keluar.",
            "color": "rose"
        }

    is_accum = order_flow.get("is_hidden_accumulation", False)
    absorption = float(order_flow.get("absorption_efficiency", 1.0) or 1.0)
    has_patterns = len(patterns) > 0
    trend = tech.get("trend_bias", "CONSOLIDATION_SIDEWAYS")

    if ai_score >= 70.0:
        if is_accum or absorption >= 1.30 or has_patterns or trend == "BULLISH_UPTREND":
            return {
                "action": "STRONG BUY",
                "action_code": "STRONG_BUY",
                "text": "Kualitas Fundamental Unggulan (Top Tier Alpha). Didukung akumulasi institusional aktif dan setup teknikal terkonfirmasi. Sangat layak untuk akumulasi / buy.",
                "color": "emerald"
            }
        else:
            return {
                "action": "ACCUMULATE ON DIP",
                "action_code": "BUY",
                "text": "Fundamental sangat solid di atas rata-rata industri. Layak cicil beli bertahap di area support / demand.",
                "color": "emerald"
            }
    elif ai_score >= 60.0:
        if is_accum or absorption >= 1.30 or has_patterns:
            return {
                "action": "BUY / ACCUMULATE",
                "action_code": "BUY",
                "text": "Fundamental sehat dengan konfirmasi akumulasi order-flow bandar. Rencana eksekusi trading siap diaktifkan.",
                "color": "cyan"
            }
        else:
            return {
                "action": "BUY ON WEAKNESS",
                "action_code": "BUY_DIP",
                "text": "Fundamental berada di atas rata-rata industri. Beli saat terjadi koreksi sehat mendekati area support.",
                "color": "cyan"
            }
    elif ai_score >= 50.0:
        return {
            "action": "HOLD / WAIT & SEE",
            "action_code": "HOLD",
            "text": "Performa fundamental dan momentum berada di rentang wajar/netral. Disarankan tahan posisi atau tunggu breakout dengan lonjakan volume institusi.",
            "color": "amber"
        }
    else:
        return {
            "action": "UNDERPERFORM / REDUCE",
            "action_code": "REDUCE",
            "text": "Skor fundamental di bawah median industri dengan momentum tertinggal. Disarankan kurangi alokasi atau rotasi ke saham sektor pimpinan.",
            "color": "slate"
        }

@router.get("/")
async def list_stocks():
    """List all available IDX stocks in the complete universe."""
    return {"total": len(FULL_IDX_UNIVERSE), "universe": FULL_IDX_UNIVERSE}


_TICKER_TAPE_CACHE = {}
_TICKER_TAPE_TS = 0

@router.get("/ticker-tape")
async def get_live_ticker_tape(force_refresh: bool = False):
    """
    Returns live real-time prices for IHSG Composite Index and top active BEI stocks.
    Cached for 45 seconds for ultra-fast UI rendering.
    """
    global _TICKER_TAPE_CACHE, _TICKER_TAPE_TS
    import time
    now_ts = time.time()

    if not force_refresh and _TICKER_TAPE_CACHE and (now_ts - _TICKER_TAPE_TS < 45):
        return _TICKER_TAPE_CACHE

    import yfinance as yf

    symbols = [
        "^JKSE", "BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK",
        "ASII.JK", "WOOD.JK", "DIVA.JK", "PTBA.JK", "BBNI.JK",
        "ADRO.JK", "BRIS.JK", "BREN.JK", "AMMN.JK", "UNTR.JK", "ICBP.JK"
    ]

    badges = {
        "^JKSE": "Indeks Utama",
        "BBCA.JK": "Big Cap",
        "BBRI.JK": "Banking",
        "BMRI.JK": "Order-Flow 🔥",
        "TLKM.JK": "Telco",
        "ASII.JK": "Automotive",
        "WOOD.JK": "Pre-ARA 🚀",
        "DIVA.JK": "Pre-ARA 🚀",
        "PTBA.JK": "Dividen",
        "BBNI.JK": "Banking",
        "ADRO.JK": "Energy",
        "BRIS.JK": "Syariah",
        "BREN.JK": "Renewable",
        "AMMN.JK": "Mining",
        "UNTR.JK": "Heavy Eq.",
        "ICBP.JK": "Consumer"
    }

    defaults = {
        "^JKSE": (6487.30, 6405.69),
        "BBCA.JK": (6400.0, 6350.0),
        "BBRI.JK": (3150.0, 3130.0),
        "BMRI.JK": (4190.0, 4160.0),
        "TLKM.JK": (2600.0, 2600.0),
        "ASII.JK": (4800.0, 4780.0),
        "WOOD.JK": (208.0, 202.0),
        "DIVA.JK": (138.0, 130.0),
        "PTBA.JK": (2480.0, 2420.0),
        "BBNI.JK": (3700.0, 3680.0),
        "ADRO.JK": (2670.0, 2610.0),
        "BRIS.JK": (1780.0, 1780.0),
        "BREN.JK": (3370.0, 3310.0),
        "AMMN.JK": (4440.0, 4390.0),
        "UNTR.JK": (24225.0, 23850.0),
        "ICBP.JK": (7925.0, 7850.0)
    }

    results = []

    try:
        data = yf.download(" ".join(symbols), period="5d", interval="1d", progress=False)
        close_df = data["Close"] if (data is not None and not data.empty and "Close" in data) else None
    except Exception:
        close_df = None

    for sym in symbols:
        cur_p = None
        prev_p = None

        if close_df is not None and sym in close_df:
            ser = close_df[sym].dropna()
            if len(ser) >= 2:
                cur_p = float(ser.iloc[-1])
                prev_p = float(ser.iloc[-2])
            elif len(ser) == 1:
                cur_p = float(ser.iloc[-1])
                prev_p = cur_p

        if cur_p is None:
            cur_p, prev_p = defaults.get(sym, (1000.0, 1000.0))

        chg_pct = ((cur_p - prev_p) / prev_p * 100.0) if prev_p > 0 else 0.0
        is_up = chg_pct >= 0

        sym_display = "IHSG" if sym == "^JKSE" else sym
        price_display = f"{cur_p:,.2f}" if sym == "^JKSE" else f"Rp {cur_p:,.0f}"

        results.append({
            "symbol": sym_display,
            "raw_symbol": sym,
            "price": price_display,
            "price_num": round(cur_p, 2),
            "prev_price_num": round(prev_p, 2),
            "change": f"{chg_pct:+.2f}%",
            "change_num": round(chg_pct, 2),
            "isUp": is_up,
            "badge": badges.get(sym, "Active")
        })

    payload = {
        "timestamp": now_ts,
        "items": results
    }

    _TICKER_TAPE_CACHE = payload
    _TICKER_TAPE_TS = now_ts
    return payload

@router.get("/{symbol}")
async def get_stock_overview(symbol: str, days: int = Query(default=200, ge=30, le=500)):
    """
    Get unified 360-degree analytics for a single stock:
    - Fundamental deep analysis (ROE, NPM, PER, PBV, DER, Graham Value, Peer Comparison)
    - Technical deep analysis (Candles, MAs, RSI, MACD, Bollinger Bands, ATR, Pivots)
    - 5-Pillar AI Intelligence Score (Unified cross-sectional benchmark)
    - Active Smart Pick Patterns
    - Deep Order-Flow & Liquidity Pressure Model (LPM)
    - Dynamic AI Quantitative Verdict & Action Recommendation
    """
    from src.api.routers.screener import _build_current_universe_metrics

    symbol = symbol.upper()
    if not symbol.endswith(".JK"):
        symbol += ".JK"

    # 1. Fetch OHLCV
    ohlcv_df = collector.fetch_historical_ohlcv(symbol, period=f"{days}d")
    if ohlcv_df.empty:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found or no historical data.")

    # 2. Fetch Fundamentals
    fund_data = collector.fetch_fundamentals(symbol)
    curr_close = float(ohlcv_df['close'].iloc[-1])

    # 3. Lookup Unified Cross-Sectional Score from Universal Cache (Consistent across entire platform)
    universe_metrics = _build_current_universe_metrics()
    stock_metric = next((m for m in universe_metrics if m['symbol'] == symbol), None)
    stock_info = get_stock_info(symbol) or {}
    sector = stock_metric['sector'] if stock_metric else stock_info.get('sector', 'Financials')
    subsector = stock_info.get('subsector', '')
    company_name = stock_info.get('name', symbol)

    if stock_metric:
        ai_score_val = round(float(stock_metric['ai_score']), 1)
        is_danger_val = stock_metric.get('is_danger_zone', False)
        ai_score_dict = {
            "symbol": symbol,
            "is_sharia": is_stock_sharia(symbol),
            "sharia_category": "Saham Syariah (ISSI / DES)" if is_stock_sharia(symbol) else "Non-Syariah",
            "date": str(ohlcv_df['date'].iloc[-1]),
            "ai_score": ai_score_val,
            "label": stock_metric.get('label', 'FAIR_VALUE'),
            "is_danger_zone": is_danger_val,
            "profitability_score": round(float(stock_metric.get('profitability_score', 50.0)), 1),
            "valuation_score": round(float(stock_metric.get('valuation_score', 50.0)), 1),
            "health_score": round(float(stock_metric.get('health_score', 50.0)), 1),
            "liquidity_score": round(float(stock_metric.get('liquidity_score', 50.0)), 1),
            "momentum_score": round(float(stock_metric.get('momentum_score', 50.0)), 1),
            "danger_reasons": stock_metric.get('warning_flags', [])
        }

    else:
        ai_score_val = 50.0
        is_danger_val = False
        ai_score_dict = {
            "symbol": symbol,
        "is_sharia": is_stock_sharia(symbol),
        "sharia_category": "Saham Syariah (ISSI / DES)" if is_stock_sharia(symbol) else "Non-Syariah",
            "date": str(ohlcv_df['date'].iloc[-1]),
            "ai_score": 50.0,
            "label": "NEUTRAL",
            "is_danger_zone": False,
            "profitability_score": 50.0,
            "valuation_score": 50.0,
            "health_score": 50.0,
            "liquidity_score": 50.0,
            "momentum_score": 50.0,
            "danger_reasons": []
        }

    # 4. Technical Indicators & Patterns
    tech_indicators = _compute_technical_indicators(ohlcv_df)
    patterns = pattern_engine.scan_all_patterns(ohlcv_df)
    order_flow_res = order_flow_engine.detect_orderflow_signals(ohlcv_df)

    # 5. Graham Fair Value Estimation
    per = fund_data.get("per") or 12.0
    pbv = fund_data.get("pbv") or 1.5
    eps_est = curr_close / (per if per > 0 else 15.0)
    bvps_est = curr_close / (pbv if pbv > 0 else 1.5)
    graham_val = math.sqrt(max(1.0, 22.5 * max(0.1, eps_est) * max(0.1, bvps_est)))
    discount_pct = ((graham_val - curr_close) / (graham_val + 1e-9)) * 100.0

    # 6. Anti-Gorengan & Problematic Stock Protection Assessment
    adtv_val = float(ohlcv_df['value'].iloc[-20:].mean()) if len(ohlcv_df) >= 20 else float(ohlcv_df['close'].iloc[-1] * 1e5)
    ret_1m = ((curr_close / ohlcv_df['close'].iloc[-21]) - 1.0) * 100.0 if len(ohlcv_df) >= 22 else 0.0
    ret_3m = ((curr_close / ohlcv_df['close'].iloc[-63]) - 1.0) * 100.0 if len(ohlcv_df) >= 64 else 0.0
    atr_pct = (tech_indicators.get("atr_14", 0.0) / (curr_close + 1e-6)) * 100.0

    safety_shield = shield_engine.evaluate_stock_safety(
        symbol=symbol,
        price=curr_close,
        fundamentals=fund_data,
        adtv_20=adtv_val,
        return_1m=ret_1m,
        return_3m=ret_3m,
        volume_intensity=order_flow_res.get("volume_intensity", 1.0),
        atr_pct=atr_pct
    )

    # 7. Dynamic Quantitative Verdict
    verdict = _compute_ai_verdict(
        ai_score=ai_score_val,
        is_danger_zone=is_danger_val,
        order_flow=order_flow_res,
        patterns=patterns,
        tech=tech_indicators,
        discount_pct=discount_pct,
        safety_shield=safety_shield
    )

    # 8. Sector Peer Comparison
    peers = [
        {"symbol": s["symbol"], "name": s.get("name", s["symbol"]), "price": s.get("price", 0), "ai_score": s.get("ai_score", 50), "label": s.get("label", "NEUTRAL")}
        for s in universe_metrics if s.get("sector") == sector and s["symbol"] != symbol
    ][:5]

    # 9. Chart-ready Candle Data
    chart_candles = []
    for _, row in ohlcv_df.tail(60).iterrows():
        chart_candles.append({
            "date": str(row["date"]),
            "open": float(row["open"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "close": float(row["close"]),
            "volume": int(row["volume"])
        })

    return {
        "symbol": symbol,
        "is_sharia": is_stock_sharia(symbol),
        "sharia_category": "Saham Syariah (ISSI / DES)" if is_stock_sharia(symbol) else "Non-Syariah",
        "name": company_name,
        "sector": sector,
        "subsector": subsector,
        "latest_price": curr_close,
        "as_of_date": str(ohlcv_df['date'].iloc[-1]),
        "ai_score": ai_score_dict,
        "verdict": verdict,
        "protection_shield": safety_shield,
        "fundamentals": fund_data,
        "valuation_models": {
            "graham_number": round(graham_val, 2),
            "discount_to_fair_value_pct": round(discount_pct, 2),
            "valuation_status": "UNDERVALUED" if discount_pct > 15 else ("OVERVALUED" if discount_pct < -15 else "FAIR")
        },
        "technical_analysis": tech_indicators,
        "active_patterns": [p.model_dump() for p in patterns],
        "order_flow": order_flow_res,
        "sector_peers": peers,
        "chart_candles": chart_candles
    }

@router.get("/{symbol}/order-flow")
async def get_stock_order_flow_analysis(symbol: str, days: int = 60):
    """
    Analisis Mendalam Mikrostruktur Pasar & Akumulasi Bandar (LPM).
    Menghasilkan:
    - Kurva Tekanan Likuiditas (Liquidity Pressure Model - LPM Time Series)
    - Signed Volume Delta per Bar
    - Efisiensi Penyerapan Volume (Absorption Efficiency)
    - Indikator Hidden Accumulation / Distribution Divergence
    """
    symbol = symbol.upper()
    if not symbol.endswith(".JK"):
        symbol += ".JK"

    ohlcv_df = collector.fetch_historical_ohlcv(symbol, period=f"{max(days, 60)}d")
    if ohlcv_df.empty:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found or no historical data.")

    stock_info = get_stock_info(symbol) or {}
    company_name = stock_info.get("name", symbol)
    sector = stock_info.get("sector", "Financials")

    # Hitung Order Flow & LPM
    of_metrics = order_flow_engine.detect_orderflow_signals(ohlcv_df)

    # Hitung Delta & Time Series
    df_calc = ohlcv_df.copy()
    delta_s = order_flow_engine.calculate_signed_volume_delta(df_calc)
    lpm_s = order_flow_engine.calculate_liquidity_pressure(df_calc)
    intensity_s = order_flow_engine.calculate_volume_intensity(df_calc)
    absorption_s = order_flow_engine.calculate_volume_rotation_absorption(df_calc)

    df_calc["delta"] = delta_s
    df_calc["lpm"] = lpm_s
    df_calc["intensity"] = intensity_s
    df_calc["absorption"] = absorption_s

    # Ambil baris terakhir N hari untuk visualisasi grafik
    chart_df = df_calc.tail(days)
    lpm_series = []
    for _, row in chart_df.iterrows():
        lpm_series.append({
            "date": str(row["date"]),
            "close": float(row["close"]),
            "volume": int(row["volume"]),
            "delta": round(float(row["delta"]), 2),
            "lpm": round(float(row["lpm"]), 2),
            "intensity": round(float(row["intensity"]), 2),
            "absorption": round(float(row["absorption"]), 2)
        })

    # Normalized LPM Score (0 - 100)
    recent_lpm = df_calc["lpm"].iloc[-1]
    lpm_min = df_calc["lpm"].tail(60).min()
    lpm_max = df_calc["lpm"].tail(60).max()
    lpm_range = max(lpm_max - lpm_min, 1.0)
    lpm_score = round(max(5.0, min(98.0, ((recent_lpm - lpm_min) / lpm_range) * 100.0)), 1)

    # Accumulation Fraction estimate
    accum_frac = round(min(0.95, max(0.40, (lpm_score / 100.0) * 0.85 + 0.15)), 2)

    # Narasi Kuantitatif Bandar
    curr_close = float(ohlcv_df["close"].iloc[-1])
    is_accum = of_metrics.get("is_hidden_accumulation", False)
    intensity_val = of_metrics.get("volume_intensity", 1.0)
    absorption_val = of_metrics.get("absorption_efficiency", 1.0)

    if is_accum:
        narrative = f"Terdeteksi AKUMULASI SENYAP (Hidden Accumulation) pada saham {symbol} ({company_name}). Bandar aktif menyerap antrean jual retail dengan efisiensi serap {absorption_val}x tanpa membiarkan harga melonjak liar. Struktur konsolidasi ini berpotensi kuat memicu fase markup harga (breakout)."
    elif lpm_score >= 70.0:
        narrative = f"Saham {symbol} berada dalam fase AKUMULASI MASIF dengan Skor LPM {lpm_score}/100. Aliran volume beli institusi (Signed Delta) konsisten mendominasi di level harga Rp {curr_close:,.0f}."
    elif of_metrics.get("is_distribution_warning", False):
        narrative = f"PERINGATAN DISTRIBUSI: Terjadi anomali lonjakan volume (Intensity {intensity_val}x) di tengah pelemahan kurva LPM. Bandar mengindikasikan pelepasan muatan ke pelaku pasar retail."
    else:
        narrative = f"Aliran dana pada {symbol} berada dalam kondisi normal dengan Skor LPM {lpm_score}/100 dan Volume Intensity {intensity_val}x. Belum ada anomali lonjakan akumulasi atau distribusi ekstrem dalam 10 hari terakhir."

    return {
        "symbol": symbol,
        "is_sharia": is_stock_sharia(symbol),
        "sharia_category": "Saham Syariah (ISSI / DES)" if is_stock_sharia(symbol) else "Non-Syariah",
        "name": company_name,
        "sector": sector,
        "current_price": curr_close,
        "lpm_score": lpm_score,
        "volume_intensity": intensity_val,
        "absorption_efficiency": absorption_val,
        "accumulation_fraction": accum_frac,
        "is_hidden_accumulation": is_accum,
        "is_distribution_warning": of_metrics.get("is_distribution_warning", False),
        "intensity_spike": of_metrics.get("intensity_spike", False),
        "narrative": narrative,
        "lpm_series": lpm_series
    }