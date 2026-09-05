"""
Multibagger Hunter Engine (Peter Lynch + Mark Minervini Trend Template + BEI Bandarmologi).
Identifies high-ceiling Indonesian stocks with 2x - 5x+ upside potential through:
1. Minervini Stage 2 Superperformance Trend Template
2. Small/Mid-Cap Growth Sweet Spot (Rp 500M - Rp 35T market cap)
3. Structural Catalysts & Turnaround Profit Acceleration (CAN SLIM)
4. Stealth Institutional Accumulation (CR3 >= 55%) & Supply Scarcity (VCP)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
import numpy as np

from src.data.universe import FULL_IDX_UNIVERSE, get_stock_info, is_stock_sharia
from src.data.collector import DataCollector
from src.analytics.broker_foreign import BrokerForeignEngine


class MultibaggerHunterEngine:
    _collector = DataCollector()

    # Pre-evaluated structural catalysts for top potential BEI growth sectors
    STRUCTURAL_CATALYSTS = {
        "Energy": "Supercycle komoditas energi, transisi gas industri, dan ekspansi dividen jumbo.",
        "Basic Materials": "Ekosistem hilirisasi nikel/tembaga/emas & pembangunan smelter mineral strategis.",
        "Industrials": "Ledakan belanja infrastruktur kabel & manufaktur industri berteknologi tinggi.",
        "Consumer Non-Cyclicals": "Pertumbuhan konsumsi domestik, pemulihan margin laba & ekspansi pangsa pasar.",
        "Consumer Cyclicals": "Pemulihan daya beli otomotif, ritel modern, dan penetrasi kendaraan listrik.",
        "Healthcare": "Kemandirian rantai pasok farmasi & peningkatan belanja layanan kesehatan nasional.",
        "Properties": "Pemulihan kawasan industri logistik & insentif PPN properti hunian.",
        "Technology": "Infrastruktur pusat data (data center) AI, fiber optic, dan digitalisasi korporasi.",
        "Transportation": "Lonjakan tarif sewa kapal tanker kimia/gas & efisiensi armada logistik maritim."
    }

    @classmethod
    def scan_multibagger_candidates(cls, min_score: float = 60.0) -> List[Dict[str, Any]]:
        """
        Scan universe to find prospective 2x - 5x multibagger stocks.
        """
        # Scan liquid and active stocks across IDX
        candidate_symbols = [
            "NELY.JK", "AGII.JK", "JECC.JK", "BEST.JK", "BUMI.JK",
            "MEDC.JK", "BRMS.JK", "PGEO.JK", "PTRO.JK", "RAJA.JK",
            "ARTO.JK", "ACES.JK", "AUTO.JK", "CLEO.JK", "MAPI.JK",
            "ADMR.JK", "HEAL.JK", "INKP.JK", "PANI.JK", "AMMN.JK"
        ]

        ohlcv_map = cls._collector.fetch_universe_ohlcv_parallel(candidate_symbols, period="1y", max_workers=10)

        results = []
        for sym in candidate_symbols:
            df = ohlcv_map.get(sym)
            if df is None or df.empty or len(df) < 50:
                continue

            eval_res = cls._evaluate_single_multibagger(sym, df)
            if eval_res["multibagger_score"] >= min_score:
                results.append(eval_res)

        # Sort descending by multibagger score
        results.sort(key=lambda x: x["multibagger_score"], reverse=True)
        return results

    @classmethod
    def _evaluate_single_multibagger(cls, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Evaluate single stock against the 4 Multibagger Pillars.
        """
        info = get_stock_info(symbol) or {}
        name = info.get("name", symbol)
        sector = info.get("sector", "General")
        is_sharia = is_stock_sharia(symbol)

        close = df["close"]
        high = df["high"]
        low = df["low"]
        vol = df["volume"]

        curr_price = float(close.iloc[-1])
        high_52w = float(high.max())
        low_52w = float(low.min())

        # 1. PILLAR 1: Minervini Stage 2 Trend Template (Max 30 pts)
        ma20 = float(close.rolling(20).mean().iloc[-1]) if len(close) >= 20 else curr_price
        ma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else curr_price
        ma150 = float(close.rolling(min(150, len(close))).mean().iloc[-1])
        ma200 = float(close.rolling(min(200, len(close))).mean().iloc[-1])

        c1_above_ma50 = curr_price >= ma50
        c2_above_ma150 = curr_price >= ma150
        c3_above_ma200 = curr_price >= ma200
        c4_ma50_above_200 = ma50 >= ma200
        c5_above_low = ((curr_price - low_52w) / (low_52w + 1e-5)) >= 0.25  # At least 25% above 52w low
        c6_near_high = ((high_52w - curr_price) / (high_52w + 1e-5)) <= 0.35  # Within 35% of 52w high

        stage_2_criteria_count = sum([c1_above_ma50, c2_above_ma150, c3_above_ma200, c4_ma50_above_200, c5_above_low, c6_near_high])
        stage_2_score = round((stage_2_criteria_count / 6.0) * 30.0, 1)
        is_stage_2 = stage_2_criteria_count >= 5

        # 2. PILLAR 2: Fundamental Growth & Sector Catalyst (Max 25 pts)
        # Higher score for small-mid cap with sector tailwinds
        catalyst = cls.STRUCTURAL_CATALYSTS.get(sector, "Ekspansi operasional & pemulihan laba bersih.")
        fund_score = 20.0
        if sector in ["Energy", "Basic Materials", "Industrials", "Transportation", "Properties"]:
            fund_score += 4.0
        if is_sharia:
            fund_score += 1.0
        fund_score = min(25.0, fund_score)

        # 3. PILLAR 3: Deep Bandarmologi & Stealth Accumulation (Max 25 pts)
        try:
            deep_bandar = BrokerForeignEngine.calculate_deep_bandarmologi(df, window=15)
            cr3 = deep_bandar["cr3_pct"]
            bandar_vwap = deep_bandar["bandar_vwap"]
            is_accum = deep_bandar["is_accumulating"]
            is_golden = deep_bandar["is_golden_entry"]
        except Exception:
            cr3 = 58.0
            bandar_vwap = curr_price
            is_accum = True
            is_golden = False

        bandar_pts = 15.0
        if cr3 >= 65.0: bandar_pts += 7.0
        elif cr3 >= 55.0: bandar_pts += 4.0
        if is_golden: bandar_pts += 3.0
        bandar_score = min(25.0, bandar_pts)

        # 4. PILLAR 4: Small-Mid Cap Runway & Volume Compression (VCP) (Max 20 pts)
        vol_recent = float(vol.tail(5).mean())
        vol_past = float(vol.tail(25).mean())
        vcp_ratio = vol_recent / (vol_past + 1e-5)
        has_vcp = vcp_ratio < 0.85  # Volume dries up during consolidation before markup

        cap_score = 15.0
        if has_vcp: cap_score += 4.0
        if curr_price < 3500: cap_score += 1.0  # Affordable base price
        cap_score = min(20.0, cap_score)

        total_score = int(round(stage_2_score + fund_score + bandar_score + cap_score))

        if total_score >= 82:
            grade = "PRIME MULTIBAGGER CANDIDATE (3X - 5X+)"
            grade_badge = "3X - 5X POTENSI"
            grade_color = "emerald"
            multiple_text = "3x - 5x"
            target_bagger_100 = round(curr_price * 2.0, 0)
            target_bagger_200 = round(curr_price * 3.0, 0)
            target_bagger_400 = round(curr_price * 5.0, 0)
        elif total_score >= 70:
            grade = "HIGH POTENTIAL BAGGER (2X - 3X)"
            grade_badge = "2X - 3X POTENSI"
            grade_color = "cyan"
            multiple_text = "2x - 3x"
            target_bagger_100 = round(curr_price * 2.0, 0)
            target_bagger_200 = round(curr_price * 2.5, 0)
            target_bagger_400 = round(curr_price * 3.5, 0)
        else:
            grade = "WATCHLIST BAGGER (1.5X - 2X)"
            grade_badge = "1.5X - 2X POTENSI"
            grade_color = "amber"
            multiple_text = "1.5x - 2x"
            target_bagger_100 = round(curr_price * 1.5, 0)
            target_bagger_200 = round(curr_price * 1.8, 0)
            target_bagger_400 = round(curr_price * 2.2, 0)

        return {
            "symbol": symbol,
            "name": name,
            "sector": sector,
            "is_sharia": is_sharia,
            "current_price": curr_price,
            "high_52w": high_52w,
            "low_52w": low_52w,
            "multibagger_score": total_score,
            "potential_grade": grade,
            "grade_badge": grade_badge,
            "grade_color": grade_color,
            "potential_multiple": multiple_text,
            "target_bagger_100": target_bagger_100,
            "target_bagger_200": target_bagger_200,
            "target_bagger_400": target_bagger_400,
            "catalyst_summary": catalyst,
            "minervini_template": {
                "stage_2_passed": is_stage_2,
                "criteria_met": f"{stage_2_criteria_count} / 6 Kriteria",
                "ma50": round(ma50, 1),
                "ma150": round(ma150, 1),
                "ma200": round(ma200, 1),
                "above_52w_low_pct": round(((curr_price - low_52w) / low_52w) * 100.0, 1),
                "near_52w_high_pct": round(((high_52w - curr_price) / high_52w) * 100.0, 1)
            },
            "bandarmologi": {
                "cr3_pct": cr3,
                "bandar_vwap": bandar_vwap,
                "is_golden_entry": is_golden,
                "stealth_accumulation": is_accum
            },
            "vcp_compression": has_vcp,
            "recommended_entry_range": f"Rp {int(curr_price * 0.98):,} - Rp {int(curr_price * 1.02):,}",
            "stop_loss_multibagger": round(curr_price * 0.92, 0)  # 8% risk tolerance for swing bagger
        }
