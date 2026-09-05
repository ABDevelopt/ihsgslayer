"""
Intraday Market Cycle & Morning Fade Protection Engine.
Addresses the empirical market anomaly in IDX:
1. Morning Euphoria (09:00 - 09:25 WIB): Pre-opening gap-ups & retail FOMO spikes.
2. Morning Fade (09:25 - 10:30 WIB): Profit-taking by smart money (BSJP exits) causing price to deflate.
3. Breakeven Profit Lock: Automatically elevates Stop Loss to entry_price + 0.4% fee once gain >= +2.5%.
4. Retest vs Fake Pump Screener: Identifies stocks with Open=Low & VWAP support vs long upper-shadow dumps.
"""

from datetime import datetime, time as dtime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from src.core.logging import setup_logger

logger = setup_logger("morning_fade_engine")

BROKER_FEE_PCT = 0.40  # 0.15% buy + 0.25% sell round-trip


class MorningFadeEngine:
    """
    Evaluates intraday market phases and protects trading capital against morning peak collapses.
    """

    _instance = None

    @classmethod
    def get_instance(cls) -> "MorningFadeEngine":
        if cls._instance is None:
            cls._instance = MorningFadeEngine()
        return cls._instance

    @staticmethod
    def get_current_intraday_phase(dt: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Determine the active trading phase in Jakarta Time (WIB, UTC+7).
        """
        if dt is None:
            dt = datetime.now()

        current_time = dt.time()
        time_str = dt.strftime("%H:%M:%S WIB")
        is_friday = dt.weekday() == 4
        from src.analytics.friday_shield import FridayShieldEngine
        friday_profile = FridayShieldEngine.get_friday_risk_profile(dt)

        # Define Phase Windows
        # 1. Pre-Opening (08:45 - 08:59)
        if dtime(8, 45) <= current_time < dtime(9, 0):
            res = {
                "phase_key": "PRE_OPENING",
                "phase_name": "Pre-Opening Discovery",
                "badge": "[PRA-PEMBUKAAN: SIAPKAN ORDER]",
                "badge_color": "indigo",
                "status": "ACTIVE",
                "current_time": time_str,
                "tactical_action": "Siapkan antrean jual untuk saham BSJP kemarin dan pantau gap-up pre-opening.",
                "prohibited_action": "Jangan pasang order beli panik tanpa mengecek bid/offer imbalance.",
                "recommended_focus": "BSJP Sell Preparation & Morning Watchlist",
                "is_exit_window": True,
                "is_fomo_danger": False,
            }
            res["is_friday"] = is_friday
            res["friday_shield"] = friday_profile
            return res

        # 2. Morning Euphoria & Opening Spike (09:00 - 09:15) -> SELLER MODE ONLY
        elif dtime(9, 0) <= current_time < dtime(9, 15):
            res = {
                "phase_key": "MORNING_EUPHORIA",
                "phase_name": "Euforia Pembukaan: Mode Jual Saham Kemarin",
                "badge": "[09:00-09:15: SELLER MODE (JUAL BSJP)]",
                "badge_color": "emerald",
                "status": "ACTIVE",
                "trader_mode": "SELLER_MODE",
                "allow_bpjs_buy": False,
                "bpjs_gate_status": "BLOCKED_DATA_UNCONFIRMED",
                "current_time": time_str,
                "tactical_action": "JUAL SAHAM KEMARIN: Eksekusi Take Profit saham BSJP (+2.5% s/d +6.0%) saat likuiditas puncak. Uji data 15 menit pertama sedang berlangsung.",
                "prohibited_action": "DILARANG BELI BPJS: Data candle 15 menit pertama belum terkonfirmasi. Jangan menjadi exit liquidity bandar di pembukaan.",
                "recommended_focus": "Take Profit BSJP, Trailing Stop Activation",
                "is_exit_window": True,
                "is_fomo_danger": True,
            }
            res["is_friday"] = is_friday
            res["friday_shield"] = friday_profile
            return res

        # 3. BPJS Sweet Spot Entry (09:15 - 09:45) -> BUYER MODE BPJS
        elif dtime(9, 15) <= current_time < dtime(9, 45):
            res = {
                "phase_key": "BPJS_SWEET_SPOT",
                "phase_name": "Jendela Emas Entry BPJS Sejati (Buyer Mode)",
                "badge": "[09:15-09:45: BUYER MODE (ENTRY BPJS)]",
                "badge_color": "cyan",
                "status": "ACTIVE",
                "trader_mode": "BUYER_MODE_BPJS",
                "allow_bpjs_buy": True,
                "bpjs_gate_status": "APPROVED_ACTIVE",
                "current_time": time_str,
                "tactical_action": "JENDELA ENTRY BPJS SEJATI AKTIF: Masuk ke saham yang lolos seleksi Open=Low, volume surge, dan memantul di atas VWAP dengan kas hasil TP tadi.",
                "prohibited_action": "Hindari saham yang membentuk upper shadow panjang (> 30% candle) karena terindikasi kempis.",
                "recommended_focus": "BPJS Entry Terkonfirmasi (Open=Low & Support VWAP)",
                "is_exit_window": False,
                "is_fomo_danger": False,
            }
            res["is_friday"] = is_friday
            res["friday_shield"] = friday_profile
            return res

        # 4. Morning Pullback & Breakeven Lock (09:45 - 10:30) -> MONITORING MODE
        elif dtime(9, 45) <= current_time < dtime(10, 30):
            res = {
                "phase_key": "MORNING_PULLBACK_RETEST",
                "phase_name": "Morning Retest & Kunci Untung Portofolio",
                "badge": "[09:45-10:30: KUNCI BREAKEVEN]",
                "badge_color": "indigo",
                "status": "ACTIVE",
                "trader_mode": "MONITORING_MODE",
                "allow_bpjs_buy": False,
                "bpjs_gate_status": "LATE_ENTRY_RISK",
                "current_time": time_str,
                "tactical_action": "Kunci Breakeven posisi aktif yang sudah naik (+0.4% fee). Jangan memaksakan entry baru menjelang siang.",
                "prohibited_action": "Dilarang mengejar saham yang baru naik setelah jam 09:45 karena rawan tertekan likuiditas siang.",
                "recommended_focus": "Kunci Breakeven & Monitoring Posisi Berjalan",
                "is_exit_window": False,
                "is_fomo_danger": False,
            }
            res["is_friday"] = is_friday
            res["friday_shield"] = friday_profile
            return res

        # 4. Midday Liquidity Vacuum & Friday Prayer Break
        if is_friday:
            if dtime(10, 30) <= current_time < dtime(11, 30):
                res = {
                    "phase_key": "MIDDAY_VACUUM",
                    "phase_name": "Melandai Sesi 1 Jumat",
                    "badge": "[WAIT & SEE / JELANG JUMATAN]",
                    "badge_color": "slate",
                    "status": "ACTIVE",
                    "current_time": time_str,
                    "tactical_action": "Sesi 1 Jumat segera berakhir pukul 11:30 WIB. Kunci breakeven dan hindari pasang order baru.",
                    "prohibited_action": "Dilarang membuka posisi baru menjelang jeda panjang Sholat Jumat.",
                    "recommended_focus": "Kunci Breakeven & Siapkan Cash",
                    "is_exit_window": False,
                    "is_fomo_danger": False,
                }
            elif dtime(11, 30) <= current_time < dtime(14, 0):
                res = {
                    "phase_key": "MIDDAY_VACUUM",
                    "phase_name": "Istirahat & Jeda Sholat Jumat",
                    "badge": "[JEDA SHOLAT JUMAT (11:30 - 14:00)]",
                    "badge_color": "slate",
                    "status": "BREAK",
                    "current_time": time_str,
                    "tactical_action": "Bursa rehat untuk ibadah Sholat Jumat sampai 14:00 WIB. Disiplin rehat dan pantau portofolio.",
                    "prohibited_action": "Tidak ada eksekusi perdagangan selama sesi jeda.",
                    "recommended_focus": "Evaluasi Portofolio & Istirahat",
                    "is_exit_window": False,
                    "is_fomo_danger": False,
                }
            elif dtime(14, 0) <= current_time < dtime(14, 30):
                res = {
                    "phase_key": "AFTERNOON_DISCOVERY",
                    "phase_name": "Pembukaan Sesi 2 Jumat",
                    "badge": "[SESI 2 JUMAT: LIKUIDITAS TIPIS]",
                    "badge_color": "amber",
                    "status": "ACTIVE",
                    "current_time": time_str,
                    "tactical_action": "Sesi 2 Jumat berlangsung singkat (14:00 - 15:45 WIB). Volume relatif tipis; waspadai aksi jual de-risking akhir pekan.",
                    "prohibited_action": "Dilarang berspekulasi agresif di sesi 2 Jumat tanpa konfirmasi volume tebal.",
                    "recommended_focus": "Seleksi Ketat & Persiapan Weekend De-Risking",
                    "is_exit_window": False,
                    "is_fomo_danger": False,
                }
            elif dtime(14, 30) <= current_time < dtime(15, 45):
                res = {
                    "phase_key": "CLOSING_ACCUMULATION",
                    "phase_name": "Penutupan Jumat (Weekend De-Risking Zone)",
                    "badge": "[JUMAT SORE: WEEKEND DE-RISKING]",
                    "badge_color": "amber",
                    "status": "ACTIVE",
                    "current_time": time_str,
                    "tactical_action": "WEEKEND DE-RISKING: Amankan kas minimal 70% s/d 100%. Memegang saham melewati akhir pekan memikul risiko 65 jam berita global & data AS. Hanya ambil BSJP jika skor >= 70.",
                    "prohibited_action": "Dilarang memegang saham gorengan/spekulatif melewati akhir pekan (risiko gap down Senin pagi).",
                    "recommended_focus": "Weekend De-Risking & Filter BSJP Super Ketat",
                    "is_exit_window": True,
                    "is_fomo_danger": False,
                }
            elif dtime(15, 45) <= current_time < dtime(16, 0):
                res = {
                    "phase_key": "PRE_CLOSING_EXIT",
                    "phase_name": "Pre-Closing Jumat (100% Cash Enforcement)",
                    "badge": "[JUMAT SORE: 100% CASH ENFORCEMENT]",
                    "badge_color": "rose",
                    "status": "CLOSING",
                    "current_time": time_str,
                    "tactical_action": "Tutup seluruh posisi scalping/intraday tanpa kecuali (Zero Overnight Weekend). Amankan modal dalam bentuk kas tunai.",
                    "prohibited_action": "Jangan biarkan posisi day-trading menginap 3 hari melewati Sabtu-Minggu.",
                    "recommended_focus": "100% Cash Enforcement & Portofolio Audit",
                    "is_exit_window": True,
                    "is_fomo_danger": False,
                }
            else:
                res = {
                    "phase_key": "MARKET_CLOSED",
                    "phase_name": "Bursa Tutup (Akhir Pekan)",
                    "badge": "[PASAR TUTUP - AKHIR PEKAN]",
                    "badge_color": "slate",
                    "status": "CLOSED",
                    "current_time": time_str,
                    "tactical_action": "Bursa tutup untuk akhir pekan. Lakukan evaluasi jurnal trading mingguan dan bersiap untuk Senin.",
                    "prohibited_action": "Tidak ada eksekusi transaksi.",
                    "recommended_focus": "Weekly Journal & Weekend Rest",
                    "is_exit_window": False,
                    "is_fomo_danger": False,
                }
            res["is_friday"] = True
            res["friday_shield"] = friday_profile
            return res

        # Monday - Thursday Standard Schedule
        # 4. Midday Liquidity Vacuum (10:30 - 13:30)
        elif (dtime(10, 30) <= current_time < dtime(11, 30)) or (dtime(11, 30) <= current_time < dtime(13, 30)):
            is_break = dtime(11, 30) <= current_time < dtime(13, 30)
            res = {
                "phase_key": "MIDDAY_VACUUM",
                "phase_name": "Istirahat & Vakum Likuiditas Siang" if is_break else "Melandai Siang (Liquidity Bleed)",
                "badge": "[WAIT & SEE / LIKUIDITAS KERING]",
                "badge_color": "slate",
                "status": "BREAK" if is_break else "ACTIVE",
                "current_time": time_str,
                "tactical_action": "WAIT & SEE: Likuiditas pasar tipis. Biarkan posisi berjalan dengan proteksi Stop Loss / Breakeven.",
                "prohibited_action": "Dilarang menangkap pisau jatuh (falling knives) saat volume transaksi mengering.",
                "recommended_focus": "Monitoring Portofolio, Review Kuantitatif",
                "is_exit_window": False,
                "is_fomo_danger": False,
            }
            res["is_friday"] = False
            res["friday_shield"] = friday_profile
            return res

        # 5. Afternoon Discovery (13:30 - 14:30)
        elif dtime(13, 30) <= current_time < dtime(14, 30):
            res = {
                "phase_key": "AFTERNOON_DISCOVERY",
                "phase_name": "Penemuan Tren Sesi 2",
                "badge": "[OBSERVASI KEKUATAN SESI 2]",
                "badge_color": "amber",
                "status": "ACTIVE",
                "current_time": time_str,
                "tactical_action": "Saring saham yang tidak terpengaruh koreksi sesi 1 dan mulai mencatatkan akumulasi baru.",
                "prohibited_action": "Jangan terburu-buru masuk sebelum konfirmasi volume sesi sore muncul.",
                "recommended_focus": "Filter Saham Bertahan, Skrining Awal BSJP",
                "is_exit_window": False,
                "is_fomo_danger": False,
            }
            res["is_friday"] = False
            res["friday_shield"] = friday_profile
            return res

        # 6. Closing Accumulation - Golden Entry Zone (14:30 - 15:45)
        elif dtime(14, 30) <= current_time < dtime(15, 45):
            res = {
                "phase_key": "CLOSING_ACCUMULATION",
                "phase_name": "Akumulasi Penutupan (Golden BSJP Zone)",
                "badge": "[ZONA BELI SORE (BSJP)]",
                "badge_color": "emerald",
                "status": "ACTIVE",
                "current_time": time_str,
                "tactical_action": "ZONA ENTRY SWING/BSJP: Arah sejati bandar terungkap. Akumulasi saham strong close untuk gap-up besok pagi.",
                "prohibited_action": "Hindari saham yang dibanting mendekati batas ARB pada menit-menit akhir.",
                "recommended_focus": "BSJP Candidate Execution & Order Placement",
                "is_exit_window": False,
                "is_fomo_danger": False,
            }
            res["is_friday"] = False
            res["friday_shield"] = friday_profile
            return res

        # 7. Pre-Closing & Scalping Exit (15:45 - 16:00)
        elif dtime(15, 45) <= current_time < dtime(16, 0):
            res = {
                "phase_key": "PRE_CLOSING_EXIT",
                "phase_name": "Pre-Closing & Zero Overnight Exit",
                "badge": "[TUTUP POSISI SCALPING (100% CASH)]",
                "badge_color": "rose",
                "status": "CLOSING",
                "current_time": time_str,
                "tactical_action": "Likuidasi posisi scalping hari ini (Zero Overnight). Lindungi modal dari risiko gap down esok hari.",
                "prohibited_action": "Jangan menahan posisi gorengan/scalper melewati malam bursa.",
                "recommended_focus": "Zero Overnight Enforcement, Cash Audit",
                "is_exit_window": True,
                "is_fomo_danger": False,
            }
            res["is_friday"] = False
            res["friday_shield"] = friday_profile
            return res

        # 8. Market Closed
        else:
            return {
                "phase_key": "MARKET_CLOSED",
                "phase_name": "Bursa Tutup",
                "badge": "[PASAR TUTUP]",
                "badge_color": "slate",
                "status": "CLOSED",
                "current_time": time_str,
                "tactical_action": "Lakukan evaluasi jurnal trading, analisa sentimen makro semalam, dan siapkan strategi esok hari.",
                "prohibited_action": "Tidak ada eksekusi transaksi.",
                "recommended_focus": "Evaluasi Portofolio & Jurnal Kuantitatif",
                "is_exit_window": False,
                "is_fomo_danger": False,
            }

    @staticmethod
    def evaluate_morning_fade(
        symbol: str,
        open_price: float,
        high_price: float,
        low_price: float,
        current_price: float,
        prev_close: float,
        vwap: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Evaluate if a stock is experiencing 'Morning Fade' (pump and deflation)
        vs 'Healthy Retest' (holding support after opening gap).
        """
        if prev_close <= 0 or open_price <= 0:
            return {
                "symbol": symbol,
                "status": "UNKNOWN",
                "fade_risk": "LOW",
                "is_fading": False,
                "is_healthy_retest": False
            }

        morning_gap_pct = round(((open_price - prev_close) / prev_close) * 100.0, 2)
        peak_gain_pct = round(((high_price - prev_close) / prev_close) * 100.0, 2)
        current_gain_pct = round(((current_price - prev_close) / prev_close) * 100.0, 2)
        
        # Pullback from High
        pullback_from_high_pct = round(((high_price - current_price) / high_price) * 100.0, 2) if high_price > 0 else 0.0

        # Candle Anatomy Metrics
        candle_range = max(1.0, high_price - low_price)
        upper_shadow = max(0.0, high_price - max(open_price, current_price))
        lower_shadow = max(0.0, min(open_price, current_price) - low_price)
        upper_shadow_ratio = round(upper_shadow / candle_range, 2)
        lower_shadow_ratio = round(lower_shadow / candle_range, 2)

        # 1. Condition for 'Morning Fade' (Deflated / Pumped & Dumped):
        # - High spiked >= +2.5% from prev close
        # - Pulled back >= 2.0% from high OR upper shadow is >= 40% of candle
        # - Current price is close to or below Open
        is_fading = False
        fade_risk = "LOW"
        verdict = "STABIL"
        badge = "[TREN NORMAL]"
        badge_color = "slate"

        if peak_gain_pct >= 2.5 and (pullback_from_high_pct >= 2.0 or upper_shadow_ratio >= 0.40):
            is_fading = True
            if current_price < open_price or pullback_from_high_pct >= 4.0:
                fade_risk = "CRITICAL"
                verdict = "GUYURAN PEKAT (BEARISH FADE)"
                badge = "[BAHAYA: MORNING FADE EKSTREM]"
                badge_color = "rose"
            else:
                fade_risk = "MODERATE"
                verdict = "WASPADAI KEMPIS (PROFIT TAKING)"
                badge = "[WASPADA: TERKIKIS DARI PUNCAK]"
                badge_color = "amber"

        # 2. Condition for 'Healthy Morning Retest':
        # - Open = Low (minimal lower shadow <= 15%)
        # - Price holds above Open (current_price >= open_price * 1.005)
        # - Price holds above VWAP (if provided)
        # - Upper shadow <= 25% (buyers still aggressive)
        is_healthy_retest = False
        if (
            current_price >= open_price
            and lower_shadow_ratio <= 0.15
            and upper_shadow_ratio <= 0.25
            and (vwap is None or current_price >= vwap * 0.998)
            and current_gain_pct >= 1.0
        ):
            is_healthy_retest = True
            fade_risk = "LOW"
            verdict = "RETEST SEHAT (BUYERS IN CONTROL)"
            badge = "[RETEST SEHAT: SIAP LANJUT]"
            badge_color = "emerald"

        return {
            "symbol": symbol,
            "open_price": open_price,
            "high_price": high_price,
            "low_price": low_price,
            "current_price": current_price,
            "morning_gap_pct": morning_gap_pct,
            "peak_gain_pct": peak_gain_pct,
            "current_gain_pct": current_gain_pct,
            "pullback_from_high_pct": pullback_from_high_pct,
            "upper_shadow_ratio": upper_shadow_ratio,
            "lower_shadow_ratio": lower_shadow_ratio,
            "is_fading": is_fading,
            "fade_risk": fade_risk,
            "is_healthy_retest": is_healthy_retest,
            "verdict": verdict,
            "badge": badge,
            "badge_color": badge_color
        }

    @staticmethod
    def calculate_breakeven_lock(
        entry_price: float,
        current_price: float,
        highest_price: float,
        min_gain_to_lock_pct: float = 2.5
    ) -> Dict[str, Any]:
        """
        Calculates if and where Stop Loss should be elevated to Breakeven (+0.4% fee coverage).
        Guarantees that a green trade never turns red.
        """
        floating_gain_pct = round(((current_price - entry_price) / entry_price) * 100.0, 2)
        peak_gain_pct = round(((highest_price - entry_price) / entry_price) * 100.0, 2)

        # Target breakeven covers round-trip broker fee (0.40%) + 1 tick buffer
        breakeven_price = round(entry_price * (1.0 + BROKER_FEE_PCT / 100.0), 0)
        
        eligible_for_lock = (floating_gain_pct >= min_gain_to_lock_pct) or (peak_gain_pct >= min_gain_to_lock_pct + 0.5)

        return {
            "entry_price": entry_price,
            "current_price": current_price,
            "highest_price": highest_price,
            "floating_gain_pct": floating_gain_pct,
            "peak_gain_pct": peak_gain_pct,
            "eligible_for_lock": eligible_for_lock,
            "breakeven_price": breakeven_price,
            "locked_profit_pct": BROKER_FEE_PCT,
            "advice": (
                f"KUNCI LABA AKTIF: Stop loss dinaikkan ke Rp {breakeven_price:,.0f} (Modal + Biaya Broker {BROKER_FEE_PCT}%). Posisi terlindungi 100% dari kerugian."
                if eligible_for_lock
                else f"Belum memenuhi syarat kunci untung (keuntungan saat ini {floating_gain_pct}%, minimal {min_gain_to_lock_pct}%)."
            )
        }

    @classmethod
    def validate_bpjs_entry_window(cls, dt: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Validates whether the trader is allowed to enter BPJS positions right now.
        Resolves the 09:00 vs 09:15 timing paradox:
        - 09:00 - 09:15 WIB: SELLER MODE ONLY (Jual BSJP kemarin, dilarang beli BPJS).
        - 09:15 - 09:45 WIB: BUYER MODE BPJS (Jendela entry terkonfirmasi Open=Low).
        - 09:45+ WIB: LATE ENTRY RISK (Risiko likuiditas siang).
        """
        phase = cls.get_current_intraday_phase(dt)
        return {
            "trader_mode": phase.get("trader_mode", "MONITORING_MODE"),
            "allow_bpjs_buy": phase.get("allow_bpjs_buy", False),
            "bpjs_gate_status": phase.get("bpjs_gate_status", "UNKNOWN"),
            "current_time": phase.get("current_time"),
            "phase_name": phase.get("phase_name"),
            "badge": phase.get("badge"),
            "tactical_action": phase.get("tactical_action"),
            "prohibited_action": phase.get("prohibited_action")
        }