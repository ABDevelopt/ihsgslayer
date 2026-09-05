"""
Institutional Safety & Risk Protection Engine (IDX Shield v2).
Comprehensive quantitative filter protecting investors & traders against:
1. SUSPENSION HAZARD: UMA (Unusual Market Activity) escalations, extreme pump anomalies, regulatory trading halts.
2. FCA HAZARD: Full Call Auction / Papan Pemantauan Khusus (PPK Criteria 1, 3, 5, 7, 8, 10).
3. ARB HAZARD: Auto Rejection Bawah lock traps, whale distribution waterfalls, and severe bid vacuum breakdowns.
"""

from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np


class StockShieldEngine:
    """
    Multi-dimensional safety validator and risk gatekeeper for the Indonesia Stock Exchange (IDX).
    """

    MIN_SAFE_ADTV_IDR = 500_000_000.0   # Min Rp 500 Juta / hari
    CRITICAL_FCA_PRICE = 51.0           # Kriteria 1 FCA: Harga rata-rata <= Rp 51
    PENNY_STOCK_THRESHOLD = 65.0        # Saham rawan gocap (<= Rp 65)
    MAX_SAFE_DER = 3.5                  # Batas aman DER
    CRITICAL_FCA_DER = 5.0              # Kriteria 5 FCA: Utang ekstrem tak berimbang
    ABSURD_PBV_THRESHOLD = 25.0         # PBV bubble tanpa profitabilitas
    ABSURD_PER_THRESHOLD = 120.0        # PER bubble

    @classmethod
    def get_arb_limit_pct(cls, price: float) -> float:
        """Official BEI asymmetric/symmetric ARB limit percentage."""
        if price < 200.0:
            return 35.0
        elif price <= 5000.0:
            return 25.0
        else:
            return 20.0

    def evaluate_stock_safety(
        self,
        symbol: str,
        price: float,
        fundamentals: Optional[Dict[str, Any]] = None,
        adtv_20: float = 1_000_000_000.0,
        df_ohlcv: Optional[pd.DataFrame] = None,
        return_1m: Optional[float] = None,
        return_3m: Optional[float] = None,
        volume_intensity: Optional[float] = 1.0,
        atr_pct: Optional[float] = 0.0,
        sentiment_risk: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate full multi-layer safety metrics for an IDX stock.
        Identifies specific hazards: Suspension (UMA), FCA (Papan Pemantauan Khusus), ARB, and Critical Sentiment (PKPU/Gagal Bayar).
        """
        fund = fundamentals or {}
        roe = fund.get("roe")
        npm = fund.get("npm")
        der = fund.get("der")
        pbv = fund.get("pbv")
        per = fund.get("per")
        bvps = fund.get("bvps")
        net_profit_growth = fund.get("net_profit_growth", 0.0)

        warning_flags: List[str] = []
        fca_reasons: List[str] = []
        suspension_reasons: List[str] = []
        arb_reasons: List[str] = []

        is_fca_hazard = False
        is_suspension_hazard = False
        is_arb_hazard = False
        is_illiquid = False
        is_insolvent = False

        risk_score = 0  # 0 to 100 (where 0 = clean, 100 = critical hazard)

        # -------------------------------------------------------------
        # 1. FCA DETECTION (Full Call Auction / Papan Pemantauan Khusus)
        # -------------------------------------------------------------
        # Kriteria 1: Harga mendekati atau <= Rp 51
        if price <= self.CRITICAL_FCA_PRICE:
            is_fca_hazard = True
            risk_score += 55
            reason = f"Kriteria 1 FCA: Harga Rp {int(price)} berada di batas gocap (<= Rp 51), rawan masuk Papan Pemantauan Khusus periodik."
            fca_reasons.append(reason)
            warning_flags.append(reason)
        elif price <= self.PENNY_STOCK_THRESHOLD:
            risk_score += 25
            reason = f"Zona Rawan Gocap: Harga Rp {int(price)} <= Rp 65, berisiko tergelincir ke FCA jika terjadi aksi jual beruntun."
            fca_reasons.append(reason)
            warning_flags.append(reason)

        # Kriteria 5: Ekuitas Negatif / Insolvensi Parah
        if (bvps is not None and bvps <= 0) or (der is not None and der > self.CRITICAL_FCA_DER and npm is not None and npm < 0):
            is_fca_hazard = True
            is_insolvent = True
            risk_score += 50
            reason = f"Kriteria 5 FCA: Ekuitas negatif atau beban hutang kronis (DER {der:.1f}x dengan Net Loss), terancam masuk PPK kriteria insolvensi."
            fca_reasons.append(reason)
            warning_flags.append(reason)

        # Kriteria 7: Likuiditas Mati / Transaksi Sangat Sepi
        if adtv_20 < 100_000_000.0 and adtv_20 > 0:
            is_fca_hazard = True
            is_illiquid = True
            risk_score += 45
            adtv_jt = round(adtv_20 / 1_000_000, 1)
            reason = f"Kriteria 7 FCA: Transaksi mati (ADTV hanya Rp {adtv_jt} Jt/hari < Rp 100 Jt), rawan terkunci dan masuk FCA likuiditas rendah."
            fca_reasons.append(reason)
            warning_flags.append(reason)
        elif adtv_20 < self.MIN_SAFE_ADTV_IDR and adtv_20 > 0:
            is_illiquid = True
            risk_score += 20
            adtv_jt = round(adtv_20 / 1_000_000, 1)
            warning_flags.append(f"Likuiditas Rendah: Rata-rata transaksi harian Rp {adtv_jt} Jt/hari (< Rp 500 Jt).")

        # -------------------------------------------------------------
        # 2. SUSPENSION DETECTION (Unusual Market Activity / UMA Escalation)
        # -------------------------------------------------------------
        # Kenaikan Harga Liar tanpa Dasar Laba (Hyper-Spike Pump)
        if return_1m is not None and return_1m > 60.0 and (npm is not None and npm < 0 or roe is not None and roe < -5.0):
            is_suspension_hazard = True
            risk_score += 45
            reason = f"Peringatan UMA/Suspensi: Kenaikan liar +{return_1m:.1f}% dalam 1 bulan tanpa didukung fundamental laba. Sangat rawan suspensi pendinginan (cooling-down halt) oleh BEI."
            suspension_reasons.append(reason)
            warning_flags.append(reason)
        elif return_3m is not None and return_3m > 120.0 and (npm is not None and npm < 0):
            is_suspension_hazard = True
            risk_score += 40
            reason = f"Peringatan UMA/Suspensi: Lonjakan +{return_3m:.1f}% dalam 3 bulan dengan status rugi kronis, masuk radar pengawasan ketat bursa."
            suspension_reasons.append(reason)
            warning_flags.append(reason)

        # Volatilitas Ekstrem & Anomali Turnover
        if atr_pct is not None and atr_pct > 12.0 and volume_intensity is not None and volume_intensity > 6.0:
            is_suspension_hazard = True
            risk_score += 35
            reason = f"Peringatan Fluktuasi Ekstrem: Volatilitas harian ATR {atr_pct:.1f}% dengan lonjakan turnover {volume_intensity:.1f}x, mengindikasikan transaksi spekulatif berisiko suspensi."
            suspension_reasons.append(reason)
            warning_flags.append(reason)

        # -------------------------------------------------------------
        # 3. ARB DETECTION (Auto Rejection Bawah & Waterfall Distribution)
        # -------------------------------------------------------------
        if df_ohlcv is not None and not df_ohlcv.empty and len(df_ohlcv) >= 5:
            curr = df_ohlcv.iloc[-1]
            prev = df_ohlcv.iloc[-2]
            c = float(curr["close"])
            o = float(curr["open"])
            h = float(curr["high"])
            l = float(curr["low"])
            v = float(curr["volume"])
            v_ma = float(df_ohlcv["volume"].iloc[-10:-1].mean()) if len(df_ohlcv) >= 10 else v
            prev_c = float(prev["close"])

            candle_range = max(h - l, 1.0)
            upper_shadow = (h - max(o, c)) / candle_range
            lower_shadow = (min(o, c) - l) / candle_range
            day_chg = ((c - prev_c) / prev_c) * 100.0 if prev_c > 0 else 0.0
            arb_limit = self.get_arb_limit_pct(prev_c)

            # A. Distribusi Pucuk (Shooting Star / Upper Shadow panjang dengan Volume Masif)
            if upper_shadow > 0.45 and (v / (v_ma + 1e-6)) > 2.2 and c < h * 0.94:
                is_arb_hazard = True
                risk_score += 40
                reason = f"Peringatan ARB: Terdeteksi aksi distribusi masif di pucuk (Upper Shadow {upper_shadow*100:.0f}% dengan Volume {v/(v_ma+1e-6):.1f}x). Tekanan jual sangat berat menuju ARB."
                arb_reasons.append(reason)
                warning_flags.append(reason)

            # B. Breakdown Bearish Waterfall (Patah Support tanpa Ekor Bawah)
            ma20 = float(df_ohlcv["close"].iloc[-20:].mean()) if len(df_ohlcv) >= 20 else c
            if c < ma20 * 0.97 and lower_shadow < 0.08 and day_chg < -4.0:
                is_arb_hazard = True
                risk_score += 35
                reason = f"Peringatan ARB: Breakdown support kunci MA20 dengan candle merah pekat (Lower Shadow {lower_shadow*100:.0f}%), berpotensi memicu panic selling berlanjut ke ARB."
                arb_reasons.append(reason)
                warning_flags.append(reason)

            # C. Jarak Terlalu Dekat ke Batas ARB
            distance_to_arb = round(day_chg - (-arb_limit), 1)
            if distance_to_arb <= 3.0 and day_chg < -10.0:
                is_arb_hazard = True
                risk_score += 45
                reason = f"Peringatan ARB: Harga saat ini ({day_chg:.1f}%) berada sangat dekat dengan batas gembok ARB (-{arb_limit:.0f}%), hanya berjarak {distance_to_arb}%."
                arb_reasons.append(reason)
                warning_flags.append(reason)

        # -------------------------------------------------------------
        # D. Critical Sentiment Risk (PKPU / Suspensi / Gagal Bayar)
        # -------------------------------------------------------------
        is_sentiment_hazard = False
        sentiment_reasons: List[str] = []
        if sentiment_risk is None:
            try:
                from src.analytics.news_sentiment_engine import NewsSentimentEngine
                sentiment_risk = NewsSentimentEngine.get_instance().evaluate_stock_sentiment(symbol)
            except Exception:
                sentiment_risk = None

        if sentiment_risk and sentiment_risk.get("is_circuit_breaker_active"):
            is_sentiment_hazard = True
            risk_score += 55
            s_msg = f"Bahaya Sentimen Kritis: {sentiment_risk.get('summary', 'Terdeteksi risiko hukum, PKPU, atau gagal bayar.')}"
            sentiment_reasons.append(s_msg)
            warning_flags.append(s_msg)

        # -------------------------------------------------------------
        # Aggregate Risk Level & Verdict
        # -------------------------------------------------------------
        risk_score = min(100, max(0, risk_score))
        safety_score = round(100.0 - risk_score, 1)

        if is_sentiment_hazard:
            risk_level = "CRITICAL_HAZARD"
            shield_verdict = "BAHAYA KRITIS: RESTRUKTURISASI / HUKUM"
            risk_badge = "BAHAYA SENTIMEN KRITIS (PKPU/DEFAULT)"
            risk_color = "rose"
            is_safe_to_buy = False
            human_advice = "BLOKIR TOTAL: Terdeteksi pemberitaan/keterbukaan berisiko hukum atau gagal bayar (PKPU/Suspensi). Dilarang untuk transaksi sampai status bersih."
        elif is_fca_hazard and (is_suspension_hazard or is_arb_hazard):
            risk_level = "CRITICAL_HAZARD"
            shield_verdict = "BAHAYA TINGGI: BLOKIR TOTAL"
            risk_badge = "BAHAYA KRITIS (FCA / SUSPENSI / ARB)"
            risk_color = "rose"
            is_safe_to_buy = False
            human_advice = "HINDARI TOTAL: Saham ini memiliki anomali risiko tingkat tinggi (kombinasi FCA, rawan suspensi bursa, atau guyuran ARB). Dilarang untuk transaksi demi perlindungan modal."
        elif is_fca_hazard:
            risk_level = "FCA_HAZARD"
            shield_verdict = "WASPADA TINGGI: RAWAN MASUK FCA"
            risk_badge = "RISIKO PAPAN PEMANTAUAN KHUSUS (FCA)"
            risk_color = "rose"
            is_safe_to_buy = False
            human_advice = "WASPADA FCA: Saham terindikasi memenuhi kriteria Papan Pemantauan Khusus (harga dekat gocap / ekuitas negatif / likuiditas mati). Berisiko likuiditas terkunci."
        elif is_suspension_hazard:
            risk_level = "SUSPENSION_HAZARD"
            shield_verdict = "WASPADA: RAWAN SUSPENSI BEI / UMA"
            risk_badge = "POTENSI GEMBOK SUSPENSI / UMA"
            risk_color = "amber"
            is_safe_to_buy = False
            human_advice = "WASPADA SUSPENSI: Pergerakan harga liar tanpa dukungan laba atau turnover anomali yang sangat rawan terkena suspensi pendinginan oleh regulator BEI."
        elif is_arb_hazard:
            risk_level = "ARB_HAZARD"
            shield_verdict = "WASPADA: RAWAN TERKUNCI ARB"
            risk_badge = "RAWAN GUYURAN ARB"
            risk_color = "amber"
            is_safe_to_buy = False
            human_advice = "WASPADA ARB: Terdeteksi tekanan distribusi masif atau breakdown struktur harga yang mengarah pada gembok Auto Rejection Bawah (ARB)."
        elif is_illiquid or (der is not None and der > self.MAX_SAFE_DER):
            risk_level = "MODERATE_RISK"
            shield_verdict = "PERHATIAN: RISIKO MODERAT"
            risk_badge = "RISIKO LIKUIDITAS / UTANG"
            risk_color = "amber"
            is_safe_to_buy = True
            human_advice = "PERHATIAN: Saham memiliki likuiditas terbatas atau beban hutang di atas rata-rata. Gunakan alokasi posisi kecil jika ingin bertransaksi."
        else:
            risk_level = "SAFE_TIER_ALPHA"
            shield_verdict = "AMAN / BEBAS RISIKO SUSPENSI & FCA"
            risk_badge = "PERISAI AMAN (BEBAS FCA / SUSPENSI / ARB)"
            risk_color = "emerald"
            is_safe_to_buy = True
            human_advice = "STATUS AMAN: Lolos seluruh filter perisai risiko. Bebas dari jeratan gocap/FCA, tidak terindikasi UMA/suspensi, dan struktur teknikal jauh dari batas ARB."

        return {
            "symbol": symbol,
            "safety_score": safety_score,
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "shield_verdict": shield_verdict,
            "risk_badge": risk_badge,
            "risk_color": risk_color,
            "is_safe_to_buy": is_safe_to_buy,
            "is_fca_hazard": is_fca_hazard,
            "fca_reasons": fca_reasons,
            "is_suspension_hazard": is_suspension_hazard,
            "suspension_reasons": suspension_reasons,
            "is_arb_hazard": is_arb_hazard,
            "arb_reasons": arb_reasons,
            "is_sentiment_hazard": is_sentiment_hazard,
            "sentiment_reasons": sentiment_reasons,
            "warning_flags": warning_flags,
            "flags_count": len(warning_flags),
            "human_advice": human_advice,
            # Backward compatibility aliases
            "is_danger": not is_safe_to_buy,
            "is_gorengan": is_suspension_hazard,
            "is_illiquid": is_illiquid,
            "is_bubble": False,
            "allow_buy": is_safe_to_buy,
            "plain_summary": human_advice
        }
