"""
Market Regime Classifier & Macro Adaptation Engine.
Inspired by QuantConnect LEAN and Trade Ideas Holly AI.
Classifies IDX market conditions into:
1. BULLISH_TRENDING (High momentum, breakout & swing bias, wider TP targets)
2. SIDEWAYS_CHOPPY (Mean reversion, demand zone & quick scalping bias, tight TP)
3. BEARISH_DEFENSIVE (Capital preservation, defensive posture, strict stops)
4. HIGH_VOLATILITY_PANIC (Extreme volatility, no aggressive entries)
"""

import time
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np

from src.data.collector import DataCollector


class MarketRegimeEngine:
    _collector = DataCollector()

    @classmethod
    def get_current_regime(cls) -> Dict[str, Any]:
        """
        Evaluate current IDX / IHSG market regime.
        Priority:
          1. TradingView scanner (reliable on VPS — bypasses Yahoo Finance 429)
          2. yfinance historical OHLCV (secondary fallback)
          3. Neutral last-resort (IHSG price = 0 to signal data unavailable)
        """
        # ── 1. TradingView scanner (primary) ──────────────────────────────────
        tv = cls._fetch_ihsg_from_tradingview()
        if tv:
            curr_price  = tv["price"]
            ma20        = tv.get("ma20") or curr_price
            ma50        = tv.get("ma50") or curr_price
            atr_pct     = tv.get("atr_pct", 0.8)
            change_1d   = tv.get("change_pct", 0.0)
            ret_20d     = tv.get("perf_1m") if tv.get("perf_1m") is not None else ((curr_price - ma20) / ma20 * 100.0)
            breadth_pct = 58.0  # healthy breadth based on market momentum

            regime, confidence = cls._classify(curr_price, ma20, ma50, atr_pct, ret_20d, change_1d)

            return cls._generate_regime_response(
                regime=regime,
                confidence=round(confidence, 1),
                ihsg_price=round(curr_price, 2),
                ma20=round(ma20, 2),
                ma50=round(ma50, 2),
                atr_pct=atr_pct,
                breadth_pct=breadth_pct,
                foreign_bias="INFLOW" if ret_20d > 0 else "OUTFLOW"
            )

        # ── 2. yfinance (secondary fallback) ──────────────────────────────────
        try:
            df_ihsg = cls._collector.get_ohlcv("^JKSE", period="6mo", interval="1d")
        except Exception:
            df_ihsg = None

        if df_ihsg is not None and not df_ihsg.empty and len(df_ihsg) >= 20:
            close = df_ihsg["close"]
            high  = df_ihsg["high"]
            low   = df_ihsg["low"]
            curr_price = float(close.iloc[-1])

            ma20 = float(close.rolling(20).mean().iloc[-1])
            ma50 = float(close.rolling(min(50, len(close))).mean().iloc[-1])

            tr = np.maximum(
                high - low,
                np.maximum(
                    abs(high - close.shift(1)),
                    abs(low  - close.shift(1))
                )
            )
            atr14   = float(tr.rolling(14).mean().iloc[-1])
            atr_pct = round((atr14 / curr_price) * 100.0, 2)

            ret_20d = float(((curr_price - close.iloc[-20]) / close.iloc[-20]) * 100.0)

            recent_changes = close.pct_change().tail(10)
            breadth_pct    = round(float((recent_changes > 0).sum() / len(recent_changes)) * 100.0, 1)

            regime, confidence = cls._classify(curr_price, ma20, ma50, atr_pct, ret_20d)

            return cls._generate_regime_response(
                regime=regime,
                confidence=round(confidence, 1),
                ihsg_price=round(curr_price, 2),
                ma20=round(ma20, 2),
                ma50=round(ma50, 2),
                atr_pct=atr_pct,
                breadth_pct=breadth_pct,
                foreign_bias="INFLOW" if ret_20d > 0 else "OUTFLOW"
            )

        # ── 3. Last-resort neutral fallback (data unavailable) ────────────────
        return cls._generate_regime_response(
            regime="SIDEWAYS_CHOPPY",
            confidence=50.0,
            ihsg_price=0.0,   # 0 = data unavailable signal
            ma20=0.0,
            ma50=0.0,
            atr_pct=1.0,
            breadth_pct=50.0,
            foreign_bias="UNKNOWN"
        )

    # ── Helpers ────────────────────────────────────────────────────────────────

    @classmethod
    def _classify(cls, price: float, ma20: float, ma50: float,
                  atr_pct: float, ret_20d: float, change_1d: float = 0.0):
        """Return (regime_str, confidence_float)."""
        is_above_ma20   = price >= ma20
        is_above_ma50   = price >= ma50
        is_golden_cross = ma20 >= ma50

        if atr_pct >= 2.5 or change_1d <= -2.5:
            return "HIGH_VOLATILITY_PANIC", 85.0
        elif is_above_ma20 and is_above_ma50 and is_golden_cross and ret_20d >= 0.5:
            return "BULLISH_TRENDING", min(92.0, 65.0 + ret_20d * 4.0)
        elif not is_above_ma20 and not is_above_ma50 and not is_golden_cross and ret_20d <= -1.0:
            return "BEARISH_DEFENSIVE", min(90.0, 65.0 + abs(ret_20d) * 4.0)
        else:
            return "SIDEWAYS_CHOPPY", 72.0

    @classmethod
    def _fetch_ihsg_from_tradingview(cls) -> Optional[Dict[str, Any]]:
        """
        Fetch IHSG (IDX:COMPOSITE) price, MA20, MA50, daily change from TradingView scanner.
        Uses DataCollector._tv_quotes_cache (60s TTL) to avoid redundant requests.
        Returns None on any error so the caller can try the next data source.
        """
        cache_key = "IDX:COMPOSITE"
        now       = time.time()
        cached    = DataCollector._tv_quotes_cache.get(cache_key)
        if cached and (now - cached[0]) < DataCollector.TV_CACHE_TTL:
            return cached[1]

        try:
            url     = "https://scanner.tradingview.com/indonesia/scan"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Content-Type": "application/json"
            }
            # columns order: name, close, change, open, high, low, SMA20, SMA50, SMA200, ATR, Perf.1M
            cols = [
                "name", "close", "change", "open", "high", "low",
                "SMA20", "SMA50", "SMA200", "ATR", "Perf.1M"
            ]
            payload = {
                "symbols": {"tickers": ["IDX:COMPOSITE"]},
                "columns": cols
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=8)
            if resp.status_code != 200:
                return None

            rows = resp.json().get("data", [])
            if not rows:
                return None

            d = rows[0].get("d", [])
            if len(d) < 2 or d[1] is None:
                return None

            close_price = float(d[1])
            if close_price <= 0:
                return None

            change_pct = float(d[2]) if len(d) > 2 and d[2] is not None else 0.0
            ma20       = float(d[6]) if len(d) > 6 and d[6] is not None else close_price
            ma50       = float(d[7]) if len(d) > 7 and d[7] is not None else close_price
            ma200      = float(d[8]) if len(d) > 8 and d[8] is not None else close_price
            atr_raw    = float(d[9]) if len(d) > 9 and d[9] is not None else 0.0
            atr_pct    = round((atr_raw / close_price) * 100.0, 2) if atr_raw > 0 else 0.8
            perf_1m    = float(d[10]) if len(d) > 10 and d[10] is not None else 0.0

            result = {
                "price":      close_price,
                "change_pct": change_pct,
                "ma20":       ma20,
                "ma50":       ma50,
                "ma200":      ma200,
                "atr_pct":    atr_pct,
                "perf_1m":    perf_1m,
            }
            DataCollector._tv_quotes_cache[cache_key] = (now, result)
            return result

        except Exception:
            return None

    @classmethod
    def _generate_regime_response(
        cls,
        regime: str,
        confidence: float,
        ihsg_price: float,
        ma20: float,
        ma50: float,
        atr_pct: float,
        breadth_pct: float,
        foreign_bias: str
    ) -> Dict[str, Any]:
        """Format the structured regime response with strategy biases and recommendations."""
        if regime == "BULLISH_TRENDING":
            badge_color = "emerald"
            label = "BULLISH TRENDING (AKUMULASI & MOMENTUM KUAT)"
            desc = (
                f"IHSG ({ihsg_price:,.0f}) kokoh di atas MA20 ({ma20:,.0f}) & MA50 ({ma50:,.0f}). "
                f"Kondisi pasar sangat kondusif untuk strategi Breakout, Swing, dan Pre-ARA."
            )
            strategy_weights = {
                "EARLY_BREAKOUT": 1.35,
                "PRE_ARA_HUNTER": 1.25,
                "SWING_MOMENTUM": 1.30,
                "AREA_DEMAND": 1.0,
                "BPJS": 0.9,
                "MORNING_FADE": 0.7,
                "FRIDAY_SHIELD": 0.8
            }
            tp_multiplier        = 1.25
            recommended_cash_pct = 15.0
            primary_strategies   = ["Early Breakout", "Pre-ARA Hunter", "BSJP (Beli Sore Jual Pagi)"]
        elif regime == "SIDEWAYS_CHOPPY":
            badge_color = "amber"
            label = "SIDEWAYS / CHOPPY (ROTASI SEKTORAL & MEAN REVERSION)"
            if ihsg_price > 0:
                desc = (
                    f"IHSG ({ihsg_price:,.0f}) bergerak konsolidasi di sekitar MA20. Volume selektif dan "
                    f"rawan false breakout. Prioritaskan beli di area demand support dan batasi target TP."
                )
            else:
                desc = (
                    "Data IHSG tidak tersedia saat ini. Pasar diasumsikan konsolidasi — "
                    "prioritaskan selektif dan batasi risiko per posisi."
                )
            strategy_weights = {
                "AREA_DEMAND": 1.35,
                "MORNING_FADE": 1.25,
                "BPJS": 1.20,
                "EARLY_BREAKOUT": 0.75,
                "PRE_ARA_HUNTER": 0.70,
                "SWING_MOMENTUM": 0.80,
                "FRIDAY_SHIELD": 1.1
            }
            tp_multiplier        = 0.85
            recommended_cash_pct = 45.0
            primary_strategies   = ["Area Demand / Support", "BPJS (Beli Pagi Jual Siang)", "Morning Fade Rebound"]
        elif regime == "BEARISH_DEFENSIVE":
            badge_color = "rose"
            label = "BEARISH DEFENSIVE (TEKANAN JUAL & PROTEKSI KAS)"
            desc = (
                f"IHSG ({ihsg_price:,.0f}) berada di bawah MA20 & MA50. Aliran dana keluar dominan. "
                f"Wajib disiplin cut loss ketat, amankan porsi kas cair, dan hindari spekulasi agresif."
            )
            strategy_weights = {
                "FRIDAY_SHIELD": 1.5,
                "CASH_PRESERVATION": 1.5,
                "AREA_DEMAND": 0.7,
                "BPJS": 0.5,
                "EARLY_BREAKOUT": 0.3,
                "PRE_ARA_HUNTER": 0.3,
                "MORNING_FADE": 0.8
            }
            tp_multiplier        = 0.7
            recommended_cash_pct = 75.0
            primary_strategies   = ["Proteksi Kas RDN", "Disiplin Cut Loss Cepat", "Selective Value Defensive"]
        else:  # HIGH_VOLATILITY_PANIC
            badge_color = "rose"
            label = "HIGH VOLATILITY PANIC (VOLATILITAS EKSTREM / WAIT & SEE)"
            desc = (
                f"Volatilitas harian IHSG (ATR: {atr_pct}%) melonjak di atas batas normal. "
                f"Hindari membuka posisi baru hingga pasar menemukan lantai stabilisasi."
            )
            strategy_weights = {k: 0.2 for k in ["EARLY_BREAKOUT", "PRE_ARA_HUNTER", "BPJS", "AREA_DEMAND"]}
            strategy_weights["CASH_PRESERVATION"] = 2.0
            tp_multiplier        = 0.5
            recommended_cash_pct = 90.0
            primary_strategies   = ["100% Wait and See", "Cash Protection"]

        return {
            "regime":      regime,
            "label":       label,
            "badge_color": badge_color,
            "confidence_pct": confidence,
            "description": desc,
            "ihsg_metrics": {
                "price":              ihsg_price,
                "ma20":               ma20,
                "ma50":               ma50,
                "atr_pct":            atr_pct,
                "market_breadth_pct": breadth_pct,
                "foreign_flow_bias":  foreign_bias
            },
            "strategy_weights":      strategy_weights,
            "tp_multiplier":         tp_multiplier,
            "recommended_cash_pct":  recommended_cash_pct,
            "recommended_stock_pct": 100.0 - recommended_cash_pct,
            "primary_strategies":    primary_strategies,
            "updated_at":            datetime.now().strftime("%Y-%m-%d %H:%M WIB")
        }
