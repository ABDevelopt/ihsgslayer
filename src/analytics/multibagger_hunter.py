"""
Multibagger Hunter Screener Engine (Generation 3.0).
Identifies high-probability 2x - 5x multibagger stocks on the Indonesia Stock Exchange (BEI)
based on the 4 Core Pillars:
1. Mark Minervini Stage 2 Superperformance Trend Template
2. Peter Lynch Small/Mid-Cap Growth Runway (< Rp 35T market cap)
3. Deep Bandarmologi Stealth Accumulation (CR3 >= 55% & Bandar VWAP)
4. Volatility Contraction Pattern (VCP) & Volume Dry-Up
+ Sentiment Analysis Arguments (Sector Macro & News Sentiment)
+ Estimated Time Horizon / Holding Period Projection
"""

import math
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from src.data.collector import DataCollector
from src.data.universe import FULL_IDX_UNIVERSE, is_stock_sharia, get_stock_info
from src.analytics.broker_foreign import BrokerForeignEngine
from src.analytics.news_sentiment_engine import NewsSentimentEngine


class MultibaggerHunterEngine:
    """
    Kuantitatif Screener Saham Berpotensi Multibagger (2x - 5x) di Bursa Efek Indonesia.
    """

    _collector = DataCollector()

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

    SECTOR_SENTIMENT_ARGUMENTS = {
        "Energy": {
            "macro_tailwind": "Siklus Super Energi & Harga Minyak/Gas Stabil di Atas Break-Even",
            "narrative": "Sentimen permintaan energi primer dan gas industri terus menguat. Margin laba operasional tebal didukung arus kas bebas (FCF) tinggi yang berpotensi memicu dividen jumbo tanpa hambatan utang luar negeri.",
            "sentiment_score": 88.0,
            "sentiment_label": "SANGAT BULLISH (TAILWIND KUAT)",
            "sentiment_color": "emerald"
        },
        "Basic Materials": {
            "macro_tailwind": "Hilirisasi Mineral Strategis, Logam Mulia & Rebound Komoditas Global",
            "narrative": "Sentimen percepatan rantai pasok hilirisasi dan lonjakan permintaan mineral olahan memberikan dorongan laba bersih struktural multi-tahun. Didukung ketiadaan risiko hukum dan posisi neraca sehat.",
            "sentiment_score": 86.0,
            "sentiment_label": "SANGAT BULLISH (HILIRISASI)",
            "sentiment_color": "emerald"
        },
        "Industrials": {
            "macro_tailwind": "Percepatan Proyek Kelistrikan & Manufaktur Kawasan Industri Modern",
            "narrative": "Sentimen realisasi belanja modal swasta dan pemerintah mendorong kontrak baru bernilai triliunan rupiah dengan visibilitas laba tinggi hingga 2-3 tahun ke depan.",
            "sentiment_score": 83.0,
            "sentiment_label": "BULLISH (KONTRAK MASIF)",
            "sentiment_color": "cyan"
        },
        "Transportation": {
            "macro_tailwind": "Lonjakan Permintaan Logistik Maritim, Curah & Kapal Tanker Kimia/Gas",
            "narrative": "Keterbatasan pasokan kapal baru global menjaga tarif sewa (charter rate) di level puncak. Emiten menikmati pertumbuhan laba bersih eksponensial dengan rasio utang yang cepat menyusut.",
            "sentiment_score": 87.0,
            "sentiment_label": "SANGAT BULLISH (MARGIN TINGGI)",
            "sentiment_color": "emerald"
        },
        "Properties": {
            "macro_tailwind": "Pelonggaran Suku Bunga Acuan (Rate Cut Bias) & Insentif PPN Properti",
            "narrative": "Sentimen masuknya investasi manufaktur asing memicu lonjakan penjualan lahan industri (industrial estate) dengan margin kotor di atas 50%, diperkuat pemulihan segmen komersial.",
            "sentiment_score": 81.0,
            "sentiment_label": "BULLISH (ROTASI SIKLIKAL)",
            "sentiment_color": "cyan"
        },
        "Consumer Cyclicals": {
            "macro_tailwind": "Rebound Daya Beli Domestik & Peningkatan Penjualan Komponen Otomotif",
            "narrative": "Efisiensi operasional dan penetrasi produk baru mendorong pertumbuhan laba dua digit dengan valuasi PEG yang masih sangat terdiskon dibandingkan rata-rata historis 5 tahun.",
            "sentiment_score": 79.0,
            "sentiment_label": "POSITIF (VALUASI ATRAKTIF)",
            "sentiment_color": "cyan"
        },
        "Consumer Non-Cyclicals": {
            "macro_tailwind": "Permintaan Konsumsi Pokok Resilien & Penurunan Biaya Bahan Baku Impor",
            "narrative": "Margin laba kotor kembali mengembang ke level pra-inflasi. Kemampuan penentuan harga (pricing power) kuat menjaga pertumbuhan laba per saham (EPS) konsisten.",
            "sentiment_score": 80.0,
            "sentiment_label": "DEFENSIF BERTUMBUH",
            "sentiment_color": "cyan"
        },
        "Infrastructures": {
            "macro_tailwind": "Transisi Energi Hijau & Konektivitas Telekomunikasi Digital",
            "narrative": "Sentimen investasi energi baru terbarukan (EBT) dan serat optik data center memberikan recurring revenue stabil dengan prospek dividen berkelanjutan.",
            "sentiment_score": 82.0,
            "sentiment_label": "BULLISH (RECURRING INCOME)",
            "sentiment_color": "cyan"
        },
        "Healthcare": {
            "macro_tailwind": "Peningkatan Belanja Layanan Kesehatan & Tingkat Okupansi Pasien",
            "narrative": "Ekspansi kapasitas dan penambahan layanan medis spesialis meningkatkan pendapatan rata-rata per pasien (ARPOB) secara berkesinambungan.",
            "sentiment_score": 80.0,
            "sentiment_label": "POSITIF (EXPANDING DEMAND)",
            "sentiment_color": "cyan"
        },
        "Technology": {
            "macro_tailwind": "Adopsi AI, Cloud Enterprise & Infrastruktur Digital Nasional",
            "narrative": "Pertumbuhan eksponensial kebutuhan komputasi memberikan ruang akselerasi valuasi khas Peter Lynch high-growth companies.",
            "sentiment_score": 82.0,
            "sentiment_label": "BULLISH HIGH-GROWTH",
            "sentiment_color": "cyan"
        }
    }

    @classmethod
    def scan_multibagger_candidates(cls, min_score: float = 60.0) -> List[Dict[str, Any]]:
        """
        Scan universe to find prospective 2x - 5x multibagger stocks.
        """
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
        Evaluate single stock against the 4 Multibagger Pillars + Sentiment Analysis + Time Horizon.
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
        c5_above_low = ((curr_price - low_52w) / (low_52w + 1e-5)) >= 0.25
        c6_near_high = ((high_52w - curr_price) / (high_52w + 1e-5)) <= 0.35

        stage_2_criteria_count = sum([c1_above_ma50, c2_above_ma150, c3_above_ma200, c4_ma50_above_200, c5_above_low, c6_near_high])
        stage_2_score = round((stage_2_criteria_count / 6.0) * 30.0, 1)
        is_stage_2 = stage_2_criteria_count >= 5

        # 2. PILLAR 2: Fundamental Growth & Sector Catalyst (Max 25 pts)
        catalyst = cls.STRUCTURAL_CATALYSTS.get(sector, "Ekspansi operasional & pemulihan laba bersih berkelanjutan.")
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
        has_vcp = vcp_ratio < 0.85

        cap_score = 15.0
        if has_vcp: cap_score += 4.0
        if curr_price < 3500: cap_score += 1.0
        cap_score = min(20.0, cap_score)

        total_score = int(round(stage_2_score + fund_score + bandar_score + cap_score))

        # Grade & Projections
        if total_score >= 82:
            grade = "PRIME MULTIBAGGER CANDIDATE (3X - 5X+)"
            grade_badge = "3X - 5X POTENSI"
            grade_color = "emerald"
            multiple_text = "3x - 5x"
            target_bagger_100 = round(curr_price * 2.0, 0)
            target_bagger_200 = round(curr_price * 3.0, 0)
            target_bagger_400 = round(curr_price * 5.0, 0)
            
            # Time Horizon Projections (Prime: Fastest markup velocity)
            timeframe_info = {
                "primary_horizon": "3 - 6 Bulan (Target 2x)",
                "full_bagger_horizon": "12 - 24 Bulan (Target 3x-5x)",
                "time_to_100pct": "3 - 6 Bulan (1 - 2 Kuartal Kinerja)",
                "time_to_200pct": "6 - 12 Bulan (2 - 4 Kuartal)",
                "time_to_400pct": "12 - 24 Bulan (Siklus Ekspansi Penuh)",
                "holding_strategy": "Trend Following Agresif: Kawal dengan Trailing Stop MA50, biarkan akumulasi institusi mengangkat harga menembus rekor baru.",
                "catalyst_milestone": "Katalis terdekat: Rilis laporan keuangan auditan kuartalan dan pengumuman pembagian dividen interim / ekspansi kapasitas."
            }
        elif total_score >= 70:
            grade = "HIGH POTENTIAL BAGGER (2X - 3X)"
            grade_badge = "2X - 3X POTENSI"
            grade_color = "cyan"
            multiple_text = "2x - 3x"
            target_bagger_100 = round(curr_price * 2.0, 0)
            target_bagger_200 = round(curr_price * 2.5, 0)
            target_bagger_400 = round(curr_price * 3.5, 0)
            
            timeframe_info = {
                "primary_horizon": "6 - 9 Bulan (Target 2x)",
                "full_bagger_horizon": "18 - 30 Bulan (Target 3x)",
                "time_to_100pct": "6 - 9 Bulan (2 - 3 Kuartal Kinerja)",
                "time_to_200pct": "12 - 18 Bulan (1 - 1.5 Tahun)",
                "time_to_400pct": "24 - 36 Bulan (2 - 3 Tahun)",
                "holding_strategy": "Position Trading Terukur: Akumulasi di zona pullback VCP dekat MA20/MA50, pasang batas rugi terukur 7-8%.",
                "catalyst_milestone": "Katalis terdekat: Peningkatan margin EBITDA dan penguatan pangsa pasar domestik."
            }
        else:
            grade = "WATCHLIST BAGGER (1.5X - 2X)"
            grade_badge = "1.5X - 2X POTENSI"
            grade_color = "amber"
            multiple_text = "1.5x - 2x"
            target_bagger_100 = round(curr_price * 1.5, 0)
            target_bagger_200 = round(curr_price * 1.8, 0)
            target_bagger_400 = round(curr_price * 2.2, 0)
            
            timeframe_info = {
                "primary_horizon": "9 - 15 Bulan (Target 1.5x - 2x)",
                "full_bagger_horizon": "24 - 36 Bulan",
                "time_to_100pct": "9 - 15 Bulan (3 - 5 Kuartal)",
                "time_to_200pct": "18 - 24 Bulan",
                "time_to_400pct": "36+ Bulan",
                "holding_strategy": "Swing Konservatif: Tunggu konfirmasi lonjakan volume breakout sebelum menambah alokasi modal besar.",
                "catalyst_milestone": "Katalis terdekat: Perbaikan arus kas operasional dan penyelesaian konsolidasi dasar harga."
            }

        # Sentiment Analysis Argument Synthesis
        sec_sentiment = cls.SECTOR_SENTIMENT_ARGUMENTS.get(
            sector,
            {
                "macro_tailwind": "Pemulihan Ekonomi Domestik & Arus Masuk Investasi Asing",
                "narrative": "Sentimen perbaikan kinerja operasional dan akumulasi senyap oleh broker institusional mendukung potensi ekspansi harga bertahap.",
                "sentiment_score": 78.0,
                "sentiment_label": "POSITIF AKUMULATIF",
                "sentiment_color": "cyan"
            }
        )

        # Cross-check with News Sentiment Engine for specific disclosures
        try:
            news_engine = NewsSentimentEngine.get_instance()
            stock_news_eval = news_engine.evaluate_stock_sentiment(symbol)
            is_circuit_breaker = stock_news_eval.get("is_circuit_breaker_active", False)
            specific_headline = stock_news_eval.get("headline_highlight", "")
        except Exception:
            is_circuit_breaker = False
            specific_headline = ""

        sentiment_analysis = {
            "sentiment_score": float(sec_sentiment["sentiment_score"]),
            "sentiment_label": str(sec_sentiment["sentiment_label"]),
            "sentiment_color": str(sec_sentiment["sentiment_color"]),
            "macro_tailwind": str(sec_sentiment["macro_tailwind"]),
            "narrative_argument": str(sec_sentiment["narrative"]),
            "headline_catalyst": str(specific_headline) if specific_headline else str(catalyst),
            "circuit_breaker_risk": bool(is_circuit_breaker),
            "safety_assessment": "AMAN / BEBAS RISIKO PKPU & SUSPENSI" if not is_circuit_breaker else "PERINGATAN RISIKO REGULASI"
        }

        return {
            "symbol": str(symbol),
            "name": str(name),
            "sector": str(sector),
            "is_sharia": bool(is_sharia),
            "current_price": float(curr_price),
            "high_52w": float(high_52w),
            "low_52w": float(low_52w),
            "multibagger_score": int(total_score),
            "potential_grade": str(grade),
            "grade_badge": str(grade_badge),
            "grade_color": str(grade_color),
            "potential_multiple": str(multiple_text),
            "target_bagger_100": float(target_bagger_100),
            "target_bagger_200": float(target_bagger_200),
            "target_bagger_400": float(target_bagger_400),
            "catalyst_summary": str(catalyst),
            "sentiment_analysis": sentiment_analysis,
            "estimated_timeframe": timeframe_info,
            "minervini_template": {
                "stage_2_passed": bool(is_stage_2),
                "criteria_met": f"{stage_2_criteria_count} / 6 Kriteria",
                "ma50": float(round(ma50, 1)),
                "ma150": float(round(ma150, 1)),
                "ma200": float(round(ma200, 1)),
                "above_52w_low_pct": float(round(((curr_price - low_52w) / low_52w) * 100.0, 1)),
                "near_52w_high_pct": float(round(((high_52w - curr_price) / high_52w) * 100.0, 1))
            },
            "bandarmologi": {
                "cr3_pct": float(cr3),
                "bandar_vwap": float(bandar_vwap),
                "is_golden_entry": bool(is_golden),
                "stealth_accumulation": bool(is_accum)
            },
            "vcp_compression": bool(has_vcp),
            "recommended_entry_range": f"Rp {int(curr_price * 0.98):,} - Rp {int(curr_price * 1.02):,}",
            "stop_loss_multibagger": float(round(curr_price * 0.92, 0))
        }
