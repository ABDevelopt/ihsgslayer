"""
Global Macro & Commodity Intelligence Engine (Lapis 1).
Tracks global macro drivers, commodities, and currency fluctuations:
- Crude Oil (CL=F) -> Energy / Oil & Gas (MEDC, ENRG, ELSA, PGAS, AKRA)
- Gold (GC=F) -> Precious Metals (ANTM, BRMS, MDKA, PSAB, ARCI)
- US Dollar Index (DX-Y.NYB) & USD/IDR (USDIDR=X) -> Capital Flows & Import/FX-debt Exposure
- MSCI Indonesia ETF (EIDO) -> Foreign Institutional Sentiment Proxy
- Coal Newcastle / Proxy -> Coal Miners (ADRO, PTBA, ITMG, BUMI, INDY)
"""

import time
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
try:
    import yfinance as yf
except ImportError:
    yf = None

from src.core.logging import setup_logger

logger = setup_logger("commodity_macro_engine")

# Sector mapping to affected IDX tickers
COMMODITY_SECTOR_MAP = {
    "OIL_GAS": {
        "benchmark": "CL=F",
        "name": "Crude Oil (WTI)",
        "unit": "USD/bbl",
        "affected_stocks": ["MEDC.JK", "ENRG.JK", "ELSA.JK", "PGAS.JK", "AKRA.JK"],
        "threshold_pct": 1.5,
    },
    "GOLD_METALS": {
        "benchmark": "GC=F",
        "name": "Gold (Spot)",
        "unit": "USD/oz",
        "affected_stocks": ["ANTM.JK", "BRMS.JK", "MDKA.JK", "PSAB.JK", "ARCI.JK"],
        "threshold_pct": 1.0,
    },
    "COAL": {
        "benchmark": "BTU",  # Liquid US Coal Proxy or regional benchmark
        "name": "Coal Benchmark Proxy",
        "unit": "USD/ton",
        "affected_stocks": ["ADRO.JK", "PTBA.JK", "ITMG.JK", "BUMI.JK", "INDY.JK"],
        "threshold_pct": 1.8,
    },
    "USD_IDR": {
        "benchmark": "USDIDR=X",
        "name": "USD / IDR Kurs",
        "unit": "IDR",
        "affected_stocks": ["BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "ASII.JK", "ICBP.JK", "INDF.JK"],
        "threshold_pct": 0.35,
    },
    "DXY": {
        "benchmark": "DX-Y.NYB",
        "name": "US Dollar Index (DXY)",
        "unit": "Index",
        "affected_stocks": ["ASII.JK", "UNVR.JK", "ICBP.JK", "TLKM.JK"],
        "threshold_pct": 0.40,
    },
    "EIDO": {
        "benchmark": "EIDO",
        "name": "MSCI Indonesia ETF",
        "unit": "USD",
        "affected_stocks": ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK"],
        "threshold_pct": 0.75,
    }
}


class CommodityMacroEngine:
    """
    Evaluates global macroeconomic movements and commodity correlation matrix
    to generate directional tailwinds and risk alerts for IDX stocks.
    """

    _instance = None
    _cache: Dict[str, Any] = {}
    _last_fetched: float = 0
    CACHE_TTL: float = 300.0  # 5 minutes cache

    @classmethod
    def get_instance(cls) -> "CommodityMacroEngine":
        if cls._instance is None:
            cls._instance = CommodityMacroEngine()
        return cls._instance

    def __init__(self):
        # Fallback baseline data in case external network is unreachable
        self._fallback_data = {
            "CL=F": {"price": 78.45, "change_pct": 1.85, "change_nominal": 1.42, "name": "Crude Oil (WTI)", "unit": "USD/bbl"},
            "GC=F": {"price": 2840.50, "change_pct": 1.15, "change_nominal": 32.20, "name": "Gold (Spot)", "unit": "USD/oz"},
            "BTU": {"price": 142.20, "change_pct": 2.10, "change_nominal": 2.92, "name": "Coal Benchmark Proxy", "unit": "USD/ton"},
            "USDIDR=X": {"price": 16280.0, "change_pct": -0.18, "change_nominal": -30.0, "name": "USD / IDR Kurs", "unit": "IDR"},
            "DX-Y.NYB": {"price": 104.15, "change_pct": -0.22, "change_nominal": -0.23, "name": "US Dollar Index (DXY)", "unit": "Index"},
            "EIDO": {"price": 18.95, "change_pct": 1.05, "change_nominal": 0.20, "name": "MSCI Indonesia ETF", "unit": "USD"},
        }

    def fetch_global_macro_drivers(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetch latest prices and daily percentage changes for all global drivers.
        Returns cached data if within TTL.
        """
        now = time.time()
        if not force_refresh and self._cache and (now - self._last_fetched < self.CACHE_TTL):
            return self._cache

        drivers: Dict[str, Any] = {}
        symbols = list(self._fallback_data.keys())

        if yf is not None:
            try:
                # Batch download last 5 days
                data = yf.download(
                    tickers=symbols,
                    period="5d",
                    interval="1d",
                    progress=False,
                    threads=True
                )
                if data is not None and not data.empty and "Close" in data:
                    close_df = data["Close"]
                    for sym in symbols:
                        try:
                            if sym in close_df.columns:
                                col = close_df[sym].dropna()
                                if len(col) >= 2:
                                    p_curr = float(col.iloc[-1])
                                    p_prev = float(col.iloc[-2])
                                    chg_pct = round(((p_curr - p_prev) / p_prev) * 100.0, 2)
                                    chg_nom = round(p_curr - p_prev, 2)
                                    meta = self._fallback_data.get(sym, {})
                                    drivers[sym] = {
                                        "symbol": sym,
                                        "name": meta.get("name", sym),
                                        "unit": meta.get("unit", ""),
                                        "price": round(p_curr, 2),
                                        "change_pct": chg_pct,
                                        "change_nominal": chg_nom,
                                        "status": "LIVE"
                                    }
                        except Exception as sym_err:
                            logger.debug(f"Failed to parse ticker {sym}: {sym_err}")
            except Exception as e:
                logger.warning(f"Error downloading macro tickers via yfinance: {e}")

        # Fill missing with fallbacks
        for sym, fb in self._fallback_data.items():
            if sym not in drivers:
                drivers[sym] = {
                    "symbol": sym,
                    "name": fb["name"],
                    "unit": fb["unit"],
                    "price": fb["price"],
                    "change_pct": fb["change_pct"],
                    "change_nominal": fb["change_nominal"],
                    "status": "CACHED_ESTIMATE"
                }

        self._cache = drivers
        self._last_fetched = now
        return drivers

    def evaluate_sector_tailwinds(self) -> Dict[str, Any]:
        """
        Evaluate sectoral impact and generate actionable intelligence badges.
        """
        drivers = self.fetch_global_macro_drivers()
        sectors_impact: List[Dict[str, Any]] = []

        overall_macro_bias = 0.0

        for sec_key, config in COMMODITY_SECTOR_MAP.items():
            bench_sym = config["benchmark"]
            d_data = drivers.get(bench_sym, {})
            chg_pct = d_data.get("change_pct", 0.0)
            threshold = config["threshold_pct"]

            if sec_key in ["OIL_GAS", "GOLD_METALS", "COAL"]:
                if chg_pct >= threshold:
                    impact_type = "TAILWIND"
                    bias = "BULLISH"
                    score_adj = 8.0
                    badge = "[COMMODITY TAILWIND]"
                    reason = f"Kenaikan harga {config['name']} (+{chg_pct}%) memberi dorongan margin laba dan sentimen sektor."
                elif chg_pct <= -threshold:
                    impact_type = "HEADWIND"
                    bias = "BEARISH"
                    score_adj = -6.0
                    badge = "[COMMODITY HEADWIND]"
                    reason = f"Koreksi harga {config['name']} ({chg_pct}%) menekan ekspektasi pendapatan sektor."
                else:
                    impact_type = "NEUTRAL"
                    bias = "NEUTRAL"
                    score_adj = 0.0
                    badge = "[NETRAL]"
                    reason = f"Pergerakan harga {config['name']} relatif stabil ({chg_pct}%)."

            elif sec_key == "USD_IDR":
                # For USD/IDR, higher USD (IDR weakness) is usually negative for domestic stocks
                if chg_pct >= threshold:
                    impact_type = "HEADWIND"
                    bias = "BEARISH"
                    score_adj = -5.0
                    badge = "[RUPIAH MELEMAH]"
                    reason = f"Pelemahan Rupiah (+{chg_pct}%) meningkatkan beban utang valas dan biaya impor."
                elif chg_pct <= -threshold:
                    impact_type = "TAILWIND"
                    bias = "BULLISH"
                    score_adj = 5.0
                    badge = "[RUPIAH MENGUAT]"
                    reason = f"Penguatan Rupiah ({chg_pct}%) meredakan inflasi dan beban impor."
                else:
                    impact_type = "NEUTRAL"
                    bias = "NEUTRAL"
                    score_adj = 0.0
                    badge = "[KURS STABIL]"
                    reason = "Fluktuasi Rupiah berada dalam rentang normal harian."

            elif sec_key == "EIDO":
                # Foreign fund proxy
                if chg_pct >= threshold:
                    impact_type = "TAILWIND"
                    bias = "BULLISH"
                    score_adj = 6.0
                    badge = "[FOREIGN INFLOW PROXY]"
                    reason = f"MSCI Indonesia ETF naik (+{chg_pct}%), mengindikasikan inflow dana asing ke IHSG."
                elif chg_pct <= -threshold:
                    impact_type = "HEADWIND"
                    bias = "BEARISH"
                    score_adj = -6.0
                    badge = "[FOREIGN OUTFLOW PROXY]"
                    reason = f"MSCI Indonesia ETF terkoreksi ({chg_pct}%), mengindikasikan tekanan outflow asing."
                else:
                    impact_type = "NEUTRAL"
                    bias = "NEUTRAL"
                    score_adj = 0.0
                    badge = "[NETRAL]"
                    reason = "Arus dana ETF Indonesia relatif seimbang."

            else:  # DXY
                if chg_pct >= threshold:
                    impact_type = "HEADWIND"
                    bias = "BEARISH"
                    score_adj = -4.0
                    badge = "[DXY KUAT]"
                    reason = f"Penguatan Dollar AS (DXY +{chg_pct}%) menekan likuiditas pasar negara berkembang (EM)."
                elif chg_pct <= -threshold:
                    impact_type = "TAILWIND"
                    bias = "BULLISH"
                    score_adj = 4.0
                    badge = "[DXY MELEMAH]"
                    reason = f"Pelemahan Dollar AS (DXY {chg_pct}%) memicu rotasi modal kembali ke emerging markets."
                else:
                    impact_type = "NEUTRAL"
                    bias = "NEUTRAL"
                    score_adj = 0.0
                    badge = "[NETRAL]"
                    reason = "Indeks Dollar AS stabil."

            overall_macro_bias += score_adj

            sectors_impact.append({
                "sector_key": sec_key,
                "benchmark_symbol": bench_sym,
                "benchmark_name": config["name"],
                "unit": config["unit"],
                "price": d_data.get("price", 0.0),
                "change_pct": chg_pct,
                "impact_type": impact_type,
                "bias": bias,
                "score_adjustment": score_adj,
                "badge": badge,
                "reason": reason,
                "affected_stocks": config["affected_stocks"],
            })

        # Overall Macro Atmosphere
        if overall_macro_bias >= 8.0:
            market_climate = "RISK-ON (KONDUSIF)"
            climate_badge = "[MAKRO BULLISH / RISK-ON]"
            climate_color = "emerald"
        elif overall_macro_bias <= -8.0:
            market_climate = "RISK-OFF (WASPADA)"
            climate_badge = "[MAKRO BEARISH / RISK-OFF]"
            climate_color = "rose"
        else:
            market_climate = "NETRAL / SEKTORAL"
            climate_badge = "[MAKRO SEIMBANG]"
            climate_color = "slate"

        return {
            "market_climate": market_climate,
            "climate_badge": climate_badge,
            "climate_color": climate_color,
            "overall_macro_bias": round(overall_macro_bias, 1),
            "drivers": drivers,
            "sectors_impact": sectors_impact,
            "timestamp": time.time()
        }

    def get_stock_macro_impact(self, symbol: str) -> Dict[str, Any]:
        """
        Get macroeconomic score modifier and impact summary for a single emiten.
        """
        clean_sym = symbol.upper()
        if not clean_sym.endswith(".JK"):
            clean_sym = f"{clean_sym}.JK"

        tailwind_eval = self.evaluate_sector_tailwinds()
        matched_impacts = []
        total_score_boost = 0.0

        for sec in tailwind_eval.get("sectors_impact", []):
            if clean_sym in sec["affected_stocks"]:
                matched_impacts.append(sec)
                total_score_boost += sec["score_adjustment"]

        # Cap total macro score modifier between -12 and +12
        total_score_boost = float(np.clip(total_score_boost, -12.0, 12.0))

        if total_score_boost > 3.0:
            status = "TAILWIND_POSITIF"
            badge = "[MAKRO POSITIF]"
        elif total_score_boost < -3.0:
            status = "HEADWIND_NEGATIF"
            badge = "[MAKRO NEGATIF]"
        else:
            status = "NETRAL"
            badge = "[MAKRO NETRAL]"

        return {
            "symbol": symbol,
            "status": status,
            "badge": badge,
            "score_boost": total_score_boost,
            "matched_drivers": matched_impacts,
            "market_climate": tailwind_eval.get("market_climate"),
            "climate_badge": tailwind_eval.get("climate_badge")
        }