"""
Friday Risk Shield and Weekend De-Risking Protection Engine.
Addresses the empirical 'Friday Effect / Weekend Bleed' in IDX:
1. Weekend Macro Uncertainty: US macro data (NFP, CPI) released Friday night when IDX is closed.
2. Margin Financing Liquidation: Forced de-leveraging before weekend interest kicks in.
3. Friday Sesi 2 Thin Liquidity: Prolonged Friday prayer break (11:30 - 14:00) leaving Session 2 vulnerable.
4. BSJP Weekend Exposure: Holding 65 hours over weekend vs 17 hours on weekdays.
"""

from datetime import datetime, time as dtime
from typing import Dict, Any, List, Optional
from src.core.logging import setup_logger

logger = setup_logger("friday_shield")

FRIDAY_SIZING_MULTIPLIER = 0.50  # 50% allocation cap on Fridays
FRIDAY_MIN_CASH_RESERVE_PCT = 70.0  # Require >= 70% cash by Friday close
FRIDAY_BSJP_MIN_SCORE = 70.0  # Heightened threshold for holding over weekend


class FridayShieldEngine:
    """
    Shields portfolio and quantitative execution against Friday selloffs and weekend gap-down risk.
    """

    _instance = None

    @classmethod
    def get_instance(cls) -> "FridayShieldEngine":
        if cls._instance is None:
            cls._instance = FridayShieldEngine()
        return cls._instance

    @staticmethod
    def is_friday(dt: Optional[datetime] = None) -> bool:
        if dt is None:
            dt = datetime.now()
        return dt.weekday() == 4

    @classmethod
    def get_friday_risk_profile(cls, dt: Optional[datetime] = None) -> Dict[str, Any]:
        if dt is None:
            dt = datetime.now()

        is_fri = cls.is_friday(dt)
        day_name = dt.strftime("%A")
        time_str = dt.strftime("%H:%M:%S WIB")

        if is_fri:
            return {
                "is_friday": True,
                "day_name": "Jumat (Friday)",
                "current_time": time_str,
                "risk_level": "ELEVATED",
                "risk_badge": "[FRIDAY DE-RISKING: WASPADA AKHIR PEKAN]",
                "badge_color": "amber",
                "position_size_multiplier": FRIDAY_SIZING_MULTIPLIER,
                "recommended_cash_reserve_pct": FRIDAY_MIN_CASH_RESERVE_PCT,
                "max_recommended_positions": 2,
                "weekend_exposure_hours": 65.0,
                "rules": [
                    "Pangkas batas pembelian baru maksimal 50% dari ukuran normal untuk membatasi risiko modal.",
                    "Wajib sisakan kas minimal 70% s/d 100% menjelang penutupan Jumat 15:45 WIB.",
                    "Likuidasi 100% posisi scalping / intraday (Zero Overnight Weekend Enforcement).",
                    "Hanya loloskan saham BSJP dengan skor >= 70.0 dan terdapat konfirmasi akumulasi asing."
                ],
                "directive": "PROTOKOL JUMAT AKTIF: Pasar rentan aksi de-risking akhir pekan dan rilis data makro AS malam ini. Utamakan memegang kas dan disiplin batasi posisi baru.",
                "allow_aggressive_buy": False
            }
        else:
            return {
                "is_friday": False,
                "day_name": day_name,
                "current_time": time_str,
                "risk_level": "NORMAL",
                "risk_badge": "[STANDAR TRADING HARIAN]",
                "badge_color": "slate",
                "position_size_multiplier": 1.0,
                "recommended_cash_reserve_pct": 20.0,
                "max_recommended_positions": 5,
                "weekend_exposure_hours": 17.0,
                "rules": [
                    "Gunakan alokasi modal standar (100% alokasi per posisi normal).",
                    "Siklus overnight normal (17 jam dari penutupan sore ke pembukaan esok)."
                ],
                "directive": "Kondisi hari kerja normal. Jalankan strategi scalping, swing, dan BSJP sesuai sinyal standar.",
                "allow_aggressive_buy": True
            }

    @classmethod
    def filter_weekend_bsjp_candidates(
        cls,
        candidates: List[Any],
        dt: Optional[datetime] = None,
        min_score: float = FRIDAY_BSJP_MIN_SCORE
    ) -> List[Dict[str, Any]]:
        """
        Enforces heightened scrutiny for BSJP candidates on Friday.
        On Friday:
        - Filters out candidates with score < 70.0
        - Marks candidates with explicit weekend exposure indicators
        """
        is_fri = cls.is_friday(dt)
        filtered_results = []

        for c in candidates:
            item = c.model_dump() if hasattr(c, "model_dump") else dict(c)
            score = float(item.get("bsjp_score", item.get("ai_score", 50.0)))
            
            if is_fri:
                is_safe_for_weekend = score >= min_score
                item["is_weekend_qualified"] = is_safe_for_weekend
                item["weekend_exposure_hours"] = 65.0
                item["weekend_risk_badge"] = (
                    "[LOLOS FILTER WEEKEND (SKOR TINGGI)]"
                    if is_safe_for_weekend
                    else "[RISIKO TINGGI OVERNIGHT 65 JAM]"
                )
                if is_safe_for_weekend:
                    filtered_results.append(item)
            else:
                item["is_weekend_qualified"] = True
                item["weekend_exposure_hours"] = 17.0
                item["weekend_risk_badge"] = "[OVERNIGHT NORMAL (17 JAM)]"
                filtered_results.append(item)

        return filtered_results

    @classmethod
    def calculate_adjusted_sizing(
        cls,
        base_amount: float,
        dt: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Discounts sizing by 50% on Fridays.
        """
        is_fri = cls.is_friday(dt)
        mult = FRIDAY_SIZING_MULTIPLIER if is_fri else 1.0
        adjusted_amount = round(base_amount * mult, 0)
        return {
            "is_friday": is_fri,
            "multiplier": mult,
            "original_amount": base_amount,
            "adjusted_amount": adjusted_amount,
            "discount_applied_pct": (1.0 - mult) * 100.0,
            "reason": (
                "Diskon alokasi risiko Jumat 50% aktif (Protokol De-Risking Akhir Pekan)."
                if is_fri
                else "Alokasi normal 100% berlaku."
            )
        }
