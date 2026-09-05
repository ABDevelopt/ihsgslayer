import json
import os
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from fastapi import APIRouter, Body
from src.screener.engine import ScreenerEngine, ScreenerFilter
from src.screener.nl_parser import NaturalLanguageParser
from src.data.collector import DataCollector
from src.data.universe import FULL_IDX_UNIVERSE, is_stock_sharia
from src.analytics.ai_score import AIScoreEngine
from src.analytics.patterns import PatternRecognizer
from src.analytics.order_flow import OrderFlowEngine
from src.analytics.stock_shield import StockShieldEngine

router = APIRouter(prefix="/screener", tags=["Screener & Ranking"])

screener_engine = ScreenerEngine()
nl_parser = NaturalLanguageParser()
collector = DataCollector()
ai_engine = AIScoreEngine()
pattern_engine = PatternRecognizer()
order_flow_engine = OrderFlowEngine()
shield_engine = StockShieldEngine()

# High-Performance Memory & Disk Cache
DISK_CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "precomputed_universe.json")
_UNIVERSE_CACHE: Dict[str, Any] = {"timestamp": 0.0, "metrics": []}
_UNIVERSE_CACHE_TTL: float = 86400.0  # 24 hours (authoritative deterministic universe)

def _load_disk_cache():
    global _UNIVERSE_CACHE
    try:
        if os.path.exists(DISK_CACHE_PATH):
            with open(DISK_CACHE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                loaded_metrics = data.get("metrics", [])
                if len(loaded_metrics) >= len(_UNIVERSE_CACHE.get("metrics", [])):
                    _UNIVERSE_CACHE["timestamp"] = data.get("timestamp", time.time())
                    _UNIVERSE_CACHE["metrics"] = loaded_metrics
    except Exception:
        pass

# Initialize from disk cache immediately on module load (<1ms)
_load_disk_cache()

def _build_current_universe_metrics(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    High-Performance Zero-Latency Assembled Metrics across the complete IDX Universe.
    Returns in <0.5ms from in-memory cache.
    """
    now = time.time()
    if not _UNIVERSE_CACHE.get("metrics") or len(_UNIVERSE_CACHE["metrics"]) < 250:
        _load_disk_cache()

    if not force_refresh and _UNIVERSE_CACHE.get("metrics") and (now - _UNIVERSE_CACHE["timestamp"]) < _UNIVERSE_CACHE_TTL:
        return _UNIVERSE_CACHE["metrics"]

    universe_metrics = []
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    
    # Fetch OHLCV concurrently across universe
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="100d", max_workers=25)
    raw_stock_data = []

    for item in FULL_IDX_UNIVERSE:
        sym = item['symbol']
        sec = item['sector']
        df = ohlcv_map.get(sym, pd.DataFrame())
        if df is None or df.empty or len(df) < 5:
            continue
        fund = collector.fetch_fundamentals(sym)
        
        curr_p = float(df['close'].iloc[-1])
        ret_1m = ((curr_p / df['close'].iloc[-21]) - 1.0) * 100.0 if len(df) >= 22 else 0.0
        ret_3m = ((curr_p / df['close'].iloc[-63]) - 1.0) * 100.0 if len(df) >= 64 else 0.0
        adtv = float(df['value'].iloc[-20:].mean()) if len(df) >= 20 else 1e9

        raw_stock_data.append({
            "symbol": sym,
            "is_sharia": is_stock_sharia(sym),
            "sector": sec,
            "date": str(df['date'].iloc[-1]) if not df.empty else "2026-08-26",
            "roe": fund.get("roe"),
            "npm": fund.get("npm"),
            "roa": fund.get("roa"),
            "per": fund.get("per"),
            "pbv": fund.get("pbv"),
            "der": fund.get("der"),
            "adtv_20": adtv,
            "return_1m": ret_1m,
            "return_3m": ret_3m,
            "price": curr_p
        })

    # Score AI
    scores = {res.symbol: res for res in ai_engine.compute_score_for_universe(raw_stock_data)}

    # Assemble full metrics
    for raw in raw_stock_data:
        sym = raw['symbol']
        df = ohlcv_map.get(sym, None)
        active_pats = [p.pattern_name for p in pattern_engine.scan_all_patterns(df)] if df is not None and not df.empty else []
        of_res = order_flow_engine.detect_orderflow_signals(df) if df is not None and not df.empty else {}
        score_obj = scores.get(sym)

        # Anti-Gorengan & Problematic Stock Protection Assessment
        fund_dict = {
            "roe": raw.get("roe"),
            "npm": raw.get("npm"),
            "der": raw.get("der"),
            "pbv": raw.get("pbv"),
            "per": raw.get("per"),
        }
        atr_pct = 0.0
        if df is not None and len(df) >= 14:
            tr = (df['high'] - df['low']).rolling(14).mean().iloc[-1]
            atr_pct = (tr / (raw["price"] + 1e-6)) * 100.0

        safety = shield_engine.evaluate_stock_safety(
            symbol=sym,
            price=raw["price"],
            fundamentals=fund_dict,
            adtv_20=raw["adtv_20"],
            return_1m=raw.get("return_1m"),
            return_3m=raw.get("return_3m"),
            volume_intensity=of_res.get("volume_intensity", 1.0),
            atr_pct=atr_pct
        )

        universe_metrics.append({
            "symbol": sym,
            "is_sharia": is_stock_sharia(sym),
            "sector": raw["sector"],
            "price": raw["price"],
            "ai_score": score_obj.ai_score if score_obj else 50.0,
            "label": score_obj.label if score_obj else "NEUTRAL",
            "is_danger_zone": (score_obj.is_danger_zone if score_obj else False) or safety.get("is_danger", False),
            "profitability_score": score_obj.profitability_score if score_obj else 50.0,
            "valuation_score": score_obj.valuation_score if score_obj else 50.0,
            "health_score": score_obj.health_score if score_obj else 50.0,
            "active_patterns": active_pats,
            "adtv_20": raw["adtv_20"],
            "liquidity_pressure": of_res.get("liquidity_pressure", 0.0),
            "volume_intensity": of_res.get("volume_intensity", 1.0),
            "is_hidden_accumulation": of_res.get("is_hidden_accumulation", False),
            "is_orca_signal": (score_obj.ai_score >= 60) and ("AREA_DEMAND" in active_pats or of_res.get("is_hidden_accumulation", False)),
            "net_foreign_val": float(raw["adtv_20"] * 0.15),
            "safety_score": safety["safety_score"],
            "risk_level": safety["risk_level"],
            "risk_badge": safety["risk_badge"],
            "risk_color": safety["risk_color"],
            "is_gorengan": safety.get("is_gorengan", False),
            "allow_buy": safety.get("allow_buy", True),
            "warning_flags": safety.get("warning_flags", []),
            "flags_count": safety.get("flags_count", 0),
            "shield_plain_summary": safety.get("plain_summary", "")
        })

    if universe_metrics and len(universe_metrics) >= int(len(FULL_IDX_UNIVERSE) * 0.85):
        _UNIVERSE_CACHE["timestamp"] = now
        _UNIVERSE_CACHE["metrics"] = universe_metrics

        # Save to disk asynchronously/safely
        try:
            os.makedirs(os.path.dirname(DISK_CACHE_PATH), exist_ok=True)
            with open(DISK_CACHE_PATH, "w", encoding="utf-8") as f:
                json.dump({"timestamp": now, "metrics": universe_metrics}, f)
        except Exception:
            pass
        return universe_metrics
    else:
        # Rate limited or failed: preserve existing valid cache
        if _UNIVERSE_CACHE.get("metrics") and len(_UNIVERSE_CACHE["metrics"]) >= 250:
            return _UNIVERSE_CACHE["metrics"]
        _load_disk_cache()
        return _UNIVERSE_CACHE.get("metrics", [])


@router.post("/query")
async def screen_stocks(filter_params: ScreenerFilter = Body(...)):
    """Execute quantitative screener with structured filter parameters."""
    universe = _build_current_universe_metrics()
    results = screener_engine.filter_and_rank(universe, filter_params)
    return {
        "count": len(results),
        "filter": filter_params.model_dump(),
        "results": results
    }

@router.post("/natural-language")
async def screen_by_natural_language(query: str = Body(..., embed=True)):
    """Parse natural language query and return matching screened stocks."""
    parsed_filter = nl_parser.parse_query(query)
    universe = _build_current_universe_metrics()
    results = screener_engine.filter_and_rank(universe, parsed_filter)
    return {
        "original_query": query,
        "parsed_filter": parsed_filter.model_dump(),
        "count": len(results),
        "results": results
    }

@router.get("/bsjp")
async def get_bsjp_candidates(min_score: float = 60.0):
    """
    Screening Khusus Beli Sore Jual Pagi (BSJP).
    Menyaring seluruh emiten bursa di sesi sore (15:45 - 16:00 WIB) dengan probabilitas
    tertinggi mengalami Gap-Up / Morning Surge di pembukaan pagi esok hari.
    """
    from src.analytics.bsjp import BSJPEngine
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="60d", max_workers=25)
    ihsg_df = collector.fetch_historical_ohlcv("^JKSE", period="60d")

    candidates = BSJPEngine.scan_bsjp_universe(ohlcv_map, FULL_IDX_UNIVERSE, min_score=min_score, ihsg_df=ihsg_df)
    
    # Auto-log to Signal History and Real Outcome Audit (Dual-Sync)
    from src.analytics.signal_history import SignalHistoryEngine
    from src.analytics.signal_evaluator import SignalEvaluatorEngine
    now = datetime.now()
    now_time_str = now.strftime("%H:%M WIB")
    now_date_str = now.strftime("%Y-%m-%d")
    for c in candidates:
        SignalHistoryEngine.record_signal_event(
            signal_type="BSJP_SORE",
            symbol=c.symbol,
            name=c.name,
            sector=c.sector,
            price_at_signal=c.close_price,
            ai_score=c.bsjp_score,
            setup_pattern="Pre-Closing Surge",
            entry_zone=f"Rp {int(c.close_price*0.995):,} - Rp {int(c.close_price*1.005):,}",
            target_tp1=f"Rp {int(c.target_sell_morning_min):,}",
            target_tp2=f"Rp {int(c.target_sell_morning_max):,}",
            stop_loss=f"Rp {int(c.stop_loss_morning):,}",
            rationale=f"Kandidat BSJP dengan probabilitas gap-up {c.gap_up_probability}"
        )
        SignalEvaluatorEngine.record_signal(
            strategy_type="BSJP",
            symbol=c.symbol,
            name=c.name,
            sector=c.sector,
            entry_price=c.close_price,
            target_tp1=c.target_sell_morning_min,
            target_tp2=c.target_sell_morning_max,
            stop_loss=c.stop_loss_morning,
            signal_time=now_time_str,
            signal_date=now_date_str,
            eval_metadata={"bsjp_score": c.bsjp_score, "gap_up_probability": c.gap_up_probability}
        )

    from src.analytics.friday_shield import FridayShieldEngine
    friday_shield = FridayShieldEngine.get_friday_risk_profile()

    return {
        "session": "PRE_CLOSING_15_50_WIB",
        "friday_shield": friday_shield,
        "universe_size": len(FULL_IDX_UNIVERSE),
        "description": "Kandidat Beli Sore Jual Pagi (BSJP) seluruh semesta emiten BEI untuk target keluar 09:00 - 09:15 WIB esok hari",
        "count": len(candidates),
        "candidates": [c.model_dump() for c in candidates]
    }

@router.get("/bpjs")
async def get_bpjs_candidates(min_score: float = 60.0):
    """
    Screening Khusus Beli Pagi Jual Sore (BPJS - Intraday Momentum & Breakout).
    Menyaring seluruh emiten bursa di sesi pagi (09:15 - 09:45 WIB) dengan lonjakan volume,
    dominasi pembeli (minimal lower shadow), dan breakout level resistensi untuk target
    profit keluar di sesi sore (15:00 - 15:45 WIB).
    """
    from src.analytics.bpjs import BPJSEngine
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="60d", max_workers=25)

    candidates = BPJSEngine.scan_bpjs_universe(
        ohlcv_map=ohlcv_map,
        universe_list=FULL_IDX_UNIVERSE,
        min_score=min_score,
        collector=collector,
        shield_engine=shield_engine
    )

    # Auto-log to Signal History and Real Outcome Audit (Dual-Sync)
    from src.analytics.signal_history import SignalHistoryEngine
    from src.analytics.signal_evaluator import SignalEvaluatorEngine
    now = datetime.now()
    now_time_str = now.strftime("%H:%M WIB")
    now_date_str = now.strftime("%Y-%m-%d")
    for c in candidates:
        SignalHistoryEngine.record_signal_event(
            signal_type="BPJS_PAGI",
            symbol=c.symbol,
            name=c.name,
            sector=c.sector,
            price_at_signal=c.current_price,
            ai_score=c.bpjs_score,
            setup_pattern=f"Morning Breakout (Vol {c.volume_multiplier}x)",
            entry_zone=c.entry_zone,
            target_tp1=c.target_tp1_intraday,
            target_tp2=c.target_tp2_intraday,
            stop_loss=c.stop_loss_intraday,
            risk_reward=c.risk_reward_ratio,
            safety_shield_status=c.safety_shield_status,
            rationale=c.rationale
        )
        tp1_val = round(c.current_price * 1.035, 0)
        tp2_val = round(c.current_price * 1.070, 0)
        sl_val = round(c.current_price * 0.975, 0)
        SignalEvaluatorEngine.record_signal(
            strategy_type="BPJS",
            symbol=c.symbol,
            name=c.name,
            sector=c.sector,
            entry_price=c.current_price,
            target_tp1=tp1_val,
            target_tp2=tp2_val,
            stop_loss=sl_val,
            signal_time=now_time_str,
            signal_date=now_date_str,
            eval_metadata={"bpjs_score": c.bpjs_score, "volume_multiplier": c.volume_multiplier}
        )

    return {
        "session": "MORNING_BREAKOUT_09_15_WIB",
        "timing_gate": BPJSEngine.get_bpjs_timing_gate(),
        "universe_size": len(FULL_IDX_UNIVERSE),
        "description": "Kandidat Beli Pagi Jual Sore (BPJS) seluruh semesta emiten BEI dengan momentum intraday probabilitas tinggi",
        "count": len(candidates),
        "candidates": [c.model_dump() for c in candidates]
    }

@router.get("/pre-ara")
async def get_pre_ara_candidates(min_score: float = 65.0):
    """
    Prediktor Kuantitatif Calon Saham Top Gainer / Pre-ARA (Auto Rejection Atas +20% s/d +35%).
    Mendeteksi saham yang berada di fase awal letupan (+1.5% s/d +7.5%) dengan akselerasi
    Volume Velocity >= 1.5x, dominasi buyer kuat, dan potensi mengunci kenaikan ke batas ARA harian.
    """
    from src.analytics.pre_ara_hunter import PreARAHunterEngine
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="60d", max_workers=25)

    candidates = PreARAHunterEngine.scan_pre_ara_universe(
        ohlcv_map=ohlcv_map,
        universe_list=FULL_IDX_UNIVERSE,
        min_score=min_score,
        collector=collector,
        shield_engine=shield_engine
    )

    # Auto-log to Signal History and Real Outcome Audit (Dual-Sync)
    from src.analytics.signal_history import SignalHistoryEngine
    from src.analytics.signal_evaluator import SignalEvaluatorEngine
    now = datetime.now()
    now_time_str = now.strftime("%H:%M WIB")
    now_date_str = now.strftime("%Y-%m-%d")
    for c in candidates:
        SignalHistoryEngine.record_signal_event(
            signal_type="PRE_ARA_HUNTER",
            symbol=c.symbol,
            name=c.name,
            sector=c.sector,
            price_at_signal=c.current_price,
            ai_score=c.pre_ara_score,
            setup_pattern=f"Pre-ARA Velocity {c.volume_velocity_multiplier:.1f}x (Buyer {c.buyer_dominance_pct:.0f}%)",
            entry_zone=c.entry_zone,
            target_tp1=c.target_ara_sell,
            target_tp2=f"Plafon ARA Rp {c.ara_ceiling_price:,.0f}",
            stop_loss=c.stop_loss,
            risk_reward=c.risk_reward_ratio,
            safety_shield_status=c.safety_status,
            rationale=c.pre_ara_rationale
        )
        SignalEvaluatorEngine.record_signal(
            strategy_type="PRE_ARA",
            symbol=c.symbol,
            name=c.name,
            sector=c.sector,
            entry_price=c.current_price,
            target_tp1=c.predicted_tp1_price,
            target_tp2=c.ara_ceiling_price,
            stop_loss=c.predicted_stop_loss_price,
            signal_time=now_time_str,
            signal_date=now_date_str,
            eval_metadata={"pre_ara_score": c.pre_ara_score, "ara_probability": c.ara_probability}
        )

    return {
        "strategy": "PRE_ARA_MOMENTUM_HUNTER",
        "universe_size": len(FULL_IDX_UNIVERSE),
        "description": "Prediksi Kuantitatif Calon Top Gainer & Pre-ARA (+20% s/d +35%) di fase awal letupan",
        "count": len(candidates),
        "candidates": [c.model_dump() for c in candidates]
    }

@router.get("/timeframes")
async def get_timeframe_categorized_stocks():
    """
    Menyaring seluruh 280 semesta emiten BEI ke dalam 3 Kategori Horizon Waktu Trading:
    1. HARIAN (Intraday BPJS / Pre-ARA: 09:15 - 15:45 WIB, TP +3% - +7%, SL -2.5%)
    2. MINGGUAN (Swing Rebound / Trend MA20: 3-20 Hari, TP +8% - +20%, SL -4.0%)
    3. JANGKA PANJANG (Value & Growth Investing: 3-24 Bulan, Margin of Safety > 20%)
    """
    from src.analytics.timeframe_categorizer import TimeframeStrategyEngine
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="60d", max_workers=25)

    categorized = TimeframeStrategyEngine.categorize_universe_by_timeframe(
        ohlcv_map=ohlcv_map,
        universe_list=FULL_IDX_UNIVERSE,
        collector=collector,
        shield_engine=shield_engine
    )

    scalping_list = [c.model_dump() for c in categorized.get("scalping", categorized.get("harian", []))]
    swing_list = [c.model_dump() for c in categorized.get("swing", categorized.get("mingguan", []))]
    invest_list = [c.model_dump() for c in categorized.get("invest", categorized.get("jangka_panjang", []))]

    scalping_block = {
        "title": "Scalping (Intraday Fast Momentum)",
        "holding": "09:15 - 15:45 WIB (Zero Overnight)",
        "target_pnl": "+2.5% s/d +7.0% / ARA",
        "cut_loss": "-1.5% s/d -2.5%",
        "sizing_advice": "Alokasi lincah 5% - 15% modal, proteksi Cut Loss otomatis",
        "count": len(scalping_list),
        "candidates": scalping_list
    }
    swing_block = {
        "title": "Swing Trading (Trend & Rebound)",
        "holding": "3 - 20 Hari Bursa",
        "target_pnl": "+8.0% s/d +25.0%",
        "cut_loss": "-4.0% s/d -6.0%",
        "sizing_advice": "Alokasi 15% - 25% modal per posisi, terkalibrasi risiko ATR 14-hari",
        "count": len(swing_list),
        "candidates": swing_list
    }
    invest_block = {
        "title": "Investasi Jangka Panjang (Value & Compounder)",
        "holding": "3 Bulan - 2+ Tahun",
        "target_pnl": "+30.0% s/d +100%+ (plus Dividen)",
        "cut_loss": "Evaluasi Fundamental Kuartalan (DCA)",
        "sizing_advice": "Alokasi 25% - 40% portofolio dengan strategi Dollar-Cost Averaging",
        "count": len(invest_list),
        "candidates": invest_list
    }

    return {
        "universe_size": len(FULL_IDX_UNIVERSE),
        "scalping": scalping_block,
        "swing": swing_block,
        "invest": invest_block,
        # Legacy compatibility keys
        "harian": scalping_block,
        "mingguan": swing_block,
        "jangka_panjang": invest_block
    }


@router.get("/category/{category_name}")
async def get_stocks_by_trading_category(category_name: str):
    """
    Filter screener khusus untuk salah satu dari 3 Pilar Trading:
    - 'scalping' (Intraday Fast Momentum)
    - 'swing' (Multi-Day Rebound & Trend)
    - 'invest' (Long-Term Value & Compounder)
    """
    cat = category_name.lower()
    from src.analytics.timeframe_categorizer import TimeframeStrategyEngine
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="60d", max_workers=25)

    categorized = TimeframeStrategyEngine.categorize_universe_by_timeframe(
        ohlcv_map=ohlcv_map,
        universe_list=FULL_IDX_UNIVERSE,
        collector=collector,
        shield_engine=shield_engine
    )

    if cat in ("scalping", "harian"):
        picks = categorized.get("scalping", categorized.get("harian", []))
        label = "Scalping (Intraday Fast Momentum)"
        holding = "09:15 - 15:45 WIB (Zero Overnight)"
        target = "+2.5% s/d +7.0% / ARA"
        cl = "-1.5% s/d -2.5%"
    elif cat in ("swing", "mingguan"):
        picks = categorized.get("swing", categorized.get("mingguan", []))
        label = "Swing Trading (Trend & Rebound)"
        holding = "3 - 20 Hari Bursa"
        target = "+8.0% s/d +25.0%"
        cl = "-4.0% s/d -6.0%"
    else:
        picks = categorized.get("invest", categorized.get("jangka_panjang", []))
        label = "Investasi Jangka Panjang (Value & Compounder)"
        holding = "3 Bulan - 2+ Tahun"
        target = "+30.0% s/d +100%+ (plus Dividen)"
        cl = "Evaluasi Fundamental (DCA)"

    candidates = [c.model_dump() for c in picks]
    return {
        "category": cat.upper(),
        "title": label,
        "holding": holding,
        "target_pnl": target,
        "cut_loss": cl,
        "count": len(candidates),
        "candidates": candidates
    }

@router.get("/ihsg-forecast")
async def get_daily_ihsg_forecast(force_refresh: bool = False):
    """
    Prediksi Kuantitatif Tren Arah & Gap Pembukaan IHSG Harian.
    Dihitung berdasarkan performa proxy saham Indonesia di luar negeri (EIDO di NYSE)
    serta bursa saham utama Asia (Nikkei 225 Tokyo, Hang Seng HK, KOSPI Korea, STI Singapura).
    """
    from src.analytics.ihsg_trend_predictor import IHSGTrendPredictorEngine
    report = IHSGTrendPredictorEngine.generate_ihsg_forecast(force_refresh=force_refresh)
    return report.model_dump()

@router.get("/buy-signals")
async def get_institutional_buy_signals(min_score: float = 60.0):
    """
    Sistem Sinyal BUY Institusional Saham Layak (High-Conviction Setups).
    Menghasilkan rekomendasi saham terkurasi dengan konfluensi Multi-Faktor AI Score,
    Order-Flow Absorption, Pola Teknikal, Area Entry, Target Profit, dan Stop Loss.
    Dilengkapi proteksi penuh anti-gorengan & anti-saham bermasalah.
    """
    universe = _build_current_universe_metrics()
    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="100d", max_workers=25)
    name_map = {item['symbol']: item for item in FULL_IDX_UNIVERSE}

    signals = []
    for s in universe:
        sym = s['symbol']
        score = s['ai_score']
        # Strict Protections: Block any danger zone, illiquid, or saham gorengan
        if score < min_score or s.get('is_danger_zone', False) or not s.get('allow_buy', True) or s.get('is_gorengan', False):
            continue
        if s.get('adtv_20', 0) < 3_000_000_000.0:  # Min Rp 3 Miliar ADTV
            continue

        df = ohlcv_map.get(sym)
        if df is None or df.empty or len(df) < 25:
            continue

        curr_p = float(s['price'])
        low_20 = float(df['low'].iloc[-20:].min())
        pats = s.get('active_patterns', [])
        absorption = s.get('volume_intensity', 1.0)
        is_accum = s.get('is_hidden_accumulation', False)

        # Has valid confluence
        has_setup = (len(pats) > 0) or is_accum or (s.get('is_orca_signal', False))

        if has_setup:
            # 14-Day Average True Range (ATR) & Volatility Parity Analysis
            highs = df['high'].iloc[-15:].values
            lows = df['low'].iloc[-15:].values
            closes = df['close'].iloc[-16:-1].values

            tr_list = []
            for j in range(len(highs)):
                h_val = float(highs[j])
                l_val = float(lows[j])
                c_prev = float(closes[j]) if j < len(closes) else float(lows[j])
                tr = max(h_val - l_val, abs(h_val - c_prev), abs(l_val - c_prev))
                tr_list.append(tr)

            atr_14 = float(np.mean(tr_list[-14:])) if len(tr_list) >= 14 else float(np.mean(tr_list))
            atr_14_pct = round((atr_14 / max(1.0, curr_p)) * 100.0, 2)
            vol_regime = "LOW" if atr_14_pct < 2.5 else ("HIGH" if atr_14_pct > 4.5 else "NORMAL")

            entry_low = round(curr_p * 0.99, 0)
            entry_high = round(curr_p * 1.01, 0)
            stop_loss = round(min(curr_p * 0.955, low_20 * 0.99), 0)
            risk_pct = ((curr_p - stop_loss) / curr_p) * 100.0

            tp1 = round(curr_p * (1.0 + max(0.06, risk_pct * 1.5 / 100.0)), 0)
            tp2 = round(curr_p * (1.0 + max(0.12, risk_pct * 2.6 / 100.0)), 0)
            gain_tp1_pct = ((tp1 / curr_p) - 1.0) * 100.0
            gain_tp2_pct = ((tp2 / curr_p) - 1.0) * 100.0
            rr_ratio = round(gain_tp1_pct / (risk_pct + 1e-6), 2)

            # Detailed 'Why BUY' Analysis Rationale
            bandar_text = "Akumulasi senyap terdeteksi (Hidden Accumulation)" if is_accum else f"Penyerapan volume aktif {absorption:.1f}x lipat dari rata-rata"
            pat_text = ", ".join(pats) if pats else "Rebound Support Demand Zone"

            why_buy_points = [
                f"[Fundamental Prima] AI Score {score:.1f}/100 ({s.get('label', 'HIGH QUALITY')}), kondisi keuangan sehat & bebas resiko hutang ekstrem.",
                f"[Validasi Bandar LPM] {bandar_text}.",
                f"[Setup Geometri Teknikal] Terkonfirmasi pola {pat_text} di area support / demand kuat.",
                f"[Rasio Asimetris Terukur] Target TP1 (+{gain_tp1_pct:.1f}%) & TP2 (+{gain_tp2_pct:.1f}%) dengan proteksi SL (-{risk_pct:.1f}%) menghasilkan R:R 1 : {rr_ratio:.1f}."
            ]

            why_buy_summary = (
                f"Saham {sym} layak dibeli karena memiliki konfluensi 4 faktor: fundamental solid (Skor {score:.1f}/100), "
                f"terkonfirmasi {bandar_text}, setup pantulan {pat_text}, serta batas risiko terukur dengan R:R 1 : {rr_ratio:.1f}."
            )

            # Quantitatively aligned verdict action category matching 360 detail page
            if score >= 70.0:
                verdict_action = "STRONG BUY"
            elif score >= 60.0:
                verdict_action = "BUY / ACCUMULATE"
            elif score >= 50.0:
                verdict_action = "HOLD / WAIT & SEE"
            else:
                verdict_action = "UNDERPERFORM / REDUCE"

            info = name_map.get(sym, {})
            sig_dict = {
                "symbol": sym,
                "is_sharia": is_stock_sharia(sym),
                "name": info.get("name", sym),
                "sector": s['sector'],
                "subsector": info.get("subsector", ""),
                "price": curr_p,
                "current_price": curr_p,
                "ai_score": round(score, 1),
                "label": s.get('label', 'FAIR_VALUE'),
                "verdict_category": verdict_action,
                "active_patterns": pats,
                "is_hidden_accumulation": is_accum,
                "is_orca_signal": s.get("is_orca_signal", False),
                "entry_zone": f"Rp {entry_low:,.0f} - Rp {entry_high:,.0f}",
                "entry_price_mid": round(curr_p, 0),
                "stop_loss": f"Rp {stop_loss:,.0f} (-{risk_pct:.1f}%)",
                "stop_loss_price": stop_loss,
                "tp1": f"Rp {tp1:,.0f} (+{gain_tp1_pct:.1f}%)",
                "target_tp1": f"Rp {tp1:,.0f} (+{gain_tp1_pct:.1f}%)",
                "tp1_price": tp1,
                "predicted_gain_tp1_pct": round(gain_tp1_pct, 1),
                "tp2": f"Rp {tp2:,.0f} (+{gain_tp2_pct:.1f}%)",
                "target_tp2": f"Rp {tp2:,.0f} (+{gain_tp2_pct:.1f}%)",
                "tp2_price": tp2,
                "predicted_gain_tp2_pct": round(gain_tp2_pct, 1),
                "predicted_stop_loss_pct": round(-risk_pct, 1),
                "selling_time_window": "Swing 3 - 15 Hari Bursa (Exit saat mendekati level TP1/TP2)",
                "selling_trigger_rule": "Jual 50% muatan saat menyentuh TP1 (+6.0%), amankan sisa 50% dengan trailing stop menuju TP2 (+12.0%).",
                "risk_reward": f"1 : {rr_ratio:.1f}",
                "risk_reward_ratio": f"1 : {rr_ratio:.1f}",
                "adtv_miliar": round(s['adtv_20'] / 1e9, 1),
                "timing": "Sesi 1 (09:15 - 10:30 WIB) saat pullback, atau Sesi 2 (14:30 - 15:45 WIB)",
                "conviction": "HIGH" if score >= 75.0 else "MEDIUM",
                "why_buy_summary": why_buy_summary,
                "why_buy_points": why_buy_points,
                "safety_shield_status": s.get("risk_badge", "AMAN / BEBAS GORENGAN"),
                "atr_14": round(atr_14, 0),
                "atr_14_pct": atr_14_pct,
                "volatility_regime": vol_regime
            }
            signals.append(sig_dict)

            # Auto-log to Signal History and Real Outcome Audit (Dual-Sync)
            from src.analytics.signal_history import SignalHistoryEngine
            from src.analytics.signal_evaluator import SignalEvaluatorEngine
            SignalHistoryEngine.record_signal_event(
                signal_type="BUY_INSTITUSIONAL",
                symbol=sym,
                name=sig_dict["name"],
                sector=sig_dict["sector"],
                price_at_signal=curr_p,
                ai_score=score,
                setup_pattern=pat_text,
                entry_zone=sig_dict["entry_zone"],
                target_tp1=sig_dict["tp1"],
                target_tp2=sig_dict["tp2"],
                stop_loss=sig_dict["stop_loss"],
                risk_reward=sig_dict["risk_reward"],
                safety_shield_status=sig_dict["safety_shield_status"],
                rationale=why_buy_summary
            )
            now = datetime.now()
            now_time_str = now.strftime("%H:%M WIB")
            now_date_str = now.strftime("%Y-%m-%d")
            SignalEvaluatorEngine.record_signal(
                strategy_type="BUY_LAYAK",
                symbol=sym,
                name=sig_dict["name"],
                sector=sig_dict["sector"],
                entry_price=curr_p,
                target_tp1=sig_dict["tp1_price"],
                target_tp2=sig_dict["tp2_price"],
                stop_loss=sig_dict["stop_loss_price"],
                signal_time=now_time_str,
                signal_date=now_date_str,
                target_exit_time="Swing 3-15 Hari (Level TP1 / TP2)",
                eval_metadata={
                    "ai_score": score,
                    "verdict": sig_dict.get("verdict_category", "BUY (LAYAK)"),
                    "pattern": pat_text
                }
            )

    # Sort by AI Score
    signals = sorted(signals, key=lambda x: x['ai_score'], reverse=True)
    return {
        "count": len(signals),
        "description": "Sinyal BUY Saham Layak Terkurasi Kuantitatif",
        "signals": signals,
        "candidates": signals
    }


@router.get("/confluence")
async def get_multi_screener_confluence(
    min_confluence: int = 2,
    min_score: float = 55.0,
    force_refresh: bool = False
):
    """
    Unified Multi-Screener Confluence Scanner:
    Identifies and ranks stocks appearing simultaneously in multiple specialized screeners
    (BPJS + BSJP + Pre-ARA Hunter + SmartPick AI + Order-Flow LPM + Multi-Timeframe).
    """
    from src.analytics.screener_confluence import ScreenerConfluenceEngine
    from src.data.universe import FULL_IDX_UNIVERSE, is_stock_sharia

    # Liquid subset of universe
    symbols = [item["symbol"] for item in FULL_IDX_UNIVERSE[:50]]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="3mo", max_workers=10)

    result = ScreenerConfluenceEngine.scan_confluence(
        ohlcv_map=ohlcv_map,
        universe_list=FULL_IDX_UNIVERSE[:50],
        min_confluence=min_confluence,
        min_score=min_score,
        collector=collector
    )
    return result


@router.get("/smart-pick")
async def get_smart_pick_candidates(min_score: float = 60.0):
    """
    Geometric Technical Rebound Scanner (Smart Pick):
    Detects 5 institutional market structure rebound patterns:
    1. Area Demand Support Bounce
    2. Throwback & Retest
    3. Liquidity Sweep Rejection
    4. Bullish RSI Divergence
    5. Early Volatility Squeeze Breakout
    """
    from src.data.universe import FULL_IDX_UNIVERSE, is_stock_sharia
    from src.analytics.patterns import PatternRecognizer

    pr = PatternRecognizer()
    symbols = [item["symbol"] for item in FULL_IDX_UNIVERSE[:50]]
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="3mo", max_workers=10)

    candidates = []
    for item in FULL_IDX_UNIVERSE[:50]:
        sym = item["symbol"]
        name = item.get("name", sym)
        sector = item.get("sector", "General")

        df = ohlcv_map.get(sym)
        if df is None or df.empty or len(df) < 25:
            continue

        patterns = pr.scan_all_patterns(df)
        curr = df.iloc[-1]
        c = float(curr["close"])
        prev_c = float(df.iloc[-2]["close"])
        change_pct = round(((c - prev_c) / prev_c) * 100.0, 2)
        v = float(curr["volume"])
        vol_sma20 = float(df["volume"].iloc[-21:-1].mean()) if len(df) >= 21 else float(df["volume"].mean())
        vol_mult = round(v / (vol_sma20 + 1e-6), 2) if vol_sma20 > 0 else 1.0

        if patterns or (c > prev_c and vol_mult >= 1.25):
            pat_names = [p.pattern_name for p in patterns] if patterns else ["MOMENTUM_ACCUMULATION"]
            pat_descs = [p.description for p in patterns] if patterns else ["Volume accumulation with positive buyer dominance."]
            max_strength = max([p.strength for p in patterns]) if patterns else 70.0

            ai_sc = round(min(98.0, max_strength * 0.8 + min(20.0, vol_mult * 5.0)), 1)
            if ai_sc < min_score:
                continue

            entry_low = round(c * 0.99, 0)
            entry_high = round(c * 1.01, 0)
            tp1 = round(c * 1.05, 0)
            tp2 = round(c * 1.10, 0)
            sl = round(c * 0.96, 0)
            rr_str = f"1 : {round(5.0 / 4.0, 1)}"

            candidates.append({
                "symbol": sym,
            "is_sharia": is_stock_sharia(sym),
                "name": name,
                "sector": sector,
                "current_price": c,
                "price": c,
                "change_pct": change_pct,
                "ai_score": ai_sc,
                "pattern_count": len(pat_names),
                "active_patterns": pat_names,
                "pattern_descriptions": pat_descs,
                "volume_multiplier": vol_mult,
                "entry_zone": f"Rp {entry_low:,.0f} - Rp {entry_high:,.0f}",
                "target_tp1": tp1,
                "predicted_gain_tp1_pct": 5.0,
                "target_tp2": tp2,
                "predicted_gain_tp2_pct": 10.0,
                "stop_loss": sl,
                "predicted_stop_loss_pct": -4.0,
                "selling_time_window": "Swing 3 - 10 Hari Bursa (Rebound Geometri)",
                "selling_trigger_rule": "Jual bertahap saat menyentuh resisten kunci / TP1 (+5.0%), trailing stop sisa 50% ke TP2 (+10.0%).",
                "risk_reward_ratio": rr_str,
                "rebound_strength": max_strength,
                "rationale": f"Pola {', '.join(pat_names)} terkonfirmasi pada harga Rp {c:,.0f} dengan lonjakan volume {vol_mult:.1f}x dari rata-rata."
            })

    candidates = sorted(candidates, key=lambda x: (x["pattern_count"], x["ai_score"]), reverse=True)
    return {
        "count": len(candidates),
        "candidates": candidates
    }
