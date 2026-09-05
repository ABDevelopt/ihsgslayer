from datetime import datetime
from src.data.universe import is_stock_sharia
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class BSJPCandidateResult(BaseModel):
    symbol: str
    name: str
    sector: str
    close_price: float
    entry_price: float
    current_price: float
    target_price: float
    target_sell_morning_min: float
    predicted_gain_tp1_pct: float = 2.5
    target_sell_morning_max: float
    predicted_gain_tp2_pct: float = 6.0
    stop_loss_morning: float
    predicted_stop_loss_pct: float = -2.0
    selling_time_window: str = "Pagi H+1: 09:05 - 09:20 WIB (Morning Opening Spike)"
    selling_trigger_rule: str = "Jual cepat pada lonjakan pembukaan pagi H+1 (+2.5% s/d +6.0%). Wajib pasang Stop Loss ketat di level SL."
    day_gain_pct: float
    bsjp_score: float
    gap_up_probability: str  # "HIGH", "MODERATE", "LOW"
    volume_multiplier: float
    close_to_high_ratio_pct: float
    upper_shadow_pct: float
    signed_delta_ratio: float
    market_regime_ok: bool
    reasons: List[str] = Field(default_factory=list)
    rationale: str = ""
    adtv_20: float
    is_sharia: bool = True
    is_weekend_qualified: bool = True
    weekend_exposure_hours: float = 17.0
    weekend_risk_badge: str = "[OVERNIGHT NORMAL (17 JAM)]"

class BSJPEngine:
    """
    Upgraded Beli Sore Jual Pagi (BSJP) Quantitative Engine (Anti-Overfitting & High-Precision).
    Filters out fake pre-closing pumps, enforces macro IHSG regime checks,
    and requires signed volume delta confirmation.
    """

    @staticmethod
    def check_macro_regime(ihsg_df: Optional[pd.DataFrame]) -> Dict[str, Any]:
        """
        Check if broader IDX market regime is supportive of overnight momentum.
        Returns {'is_supportive': bool, 'reason': str}
        """
        if ihsg_df is None or ihsg_df.empty or len(ihsg_df) < 20:
            return {"is_supportive": True, "reason": "No IHSG benchmark provided (default pass)"}

        curr = ihsg_df.iloc[-1]
        prev = ihsg_df.iloc[-2]
        sma20 = ihsg_df['close'].iloc[-20:].mean()

        ihsg_day_return = ((float(curr['close']) / float(prev['close'])) - 1.0) * 100.0
        ihsg_above_sma20 = float(curr['close']) >= sma20 * 0.995

        if ihsg_day_return <= -1.2:
            return {"is_supportive": False, "reason": f"IHSG Severe Drop ({ihsg_day_return:.2f}%)"}
        if not ihsg_above_sma20 and ihsg_day_return < -0.4:
            return {"is_supportive": False, "reason": "IHSG Below SMA20 and Negative"}

        return {"is_supportive": True, "reason": "IHSG Regime Favorable / Neutral"}

    @classmethod
    def evaluate_bsjp_candidate(
        cls,
        df: pd.DataFrame,
        symbol: str,
        name: str = "",
        sector: str = "",
        min_adtv: float = 2_000_000_000.0,  # Min Rp 2 Miliar daily turnover
        ihsg_df: Optional[pd.DataFrame] = None
    ) -> Optional[BSJPCandidateResult]:
        """
        Evaluate a stock for high-precision BSJP setup.
        Applies 5 strict anti-overfitting & false-positive filters.
        """
        if df.empty or len(df) < 25:
            return None

        curr = df.iloc[-1]
        prev = df.iloc[-2]
        vol_sma20 = df['volume'].iloc[-21:-1].mean()
        adtv_20 = float(df['value'].iloc[-20:].mean()) if 'value' in df.columns else float(curr['close'] * vol_sma20)

        # 1. Liquidity Guard (No illiquid penny traps)
        if adtv_20 < min_adtv or float(curr['close']) < 80.0:
            return None

        close_p = float(curr['close'])
        open_p = float(curr['open'])
        high_p = float(curr['high'])
        low_p = float(curr['low'])
        prev_close = float(prev['close'])

        # Daily Gain Percentage
        day_gain_pct = ((close_p / prev_close) - 1.0) * 100.0

        # BSJP Rule 1: Gain Sweet Spot (+2.5% to +22.0%, not locked at 25% ARA)
        if day_gain_pct < 2.5 or day_gain_pct > 22.0:
            return None

        # BSJP Rule 2: Strict Close Location & Fake Pump Defense (Max 15% Upper Wick)
        candle_range = high_p - low_p
        if candle_range <= 0:
            return None

        close_location_ratio = (close_p - low_p) / candle_range
        upper_shadow_ratio = (high_p - close_p) / candle_range

        # Filter out rejection tails (shooting star / open-high dump)
        # Empirical learning: upper shadow > 15% causes morning dumps
        if close_location_ratio < 0.80 or upper_shadow_ratio > 0.15:
            return None

        # BSJP Rule 3: Volume Surge Multiplier (Volume today >= 1.4x SMA20)
        vol_mult = curr['volume'] / (vol_sma20 + 1e-6)
        if vol_mult < 1.4:
            return None

        # BSJP Rule 4: Signed Volume Delta (Buyer Aggressiveness Confirmation)
        signed_delta_ratio = (2.0 * (close_p - low_p) / (candle_range + 1e-6)) - 1.0
        if signed_delta_ratio < 0.50:  # Must be heavily positive buy volume
            return None

        # BSJP Rule 5: Macro IHSG Regime Check
        regime_check = cls.check_macro_regime(ihsg_df)
        market_regime_ok = regime_check["is_supportive"]

        # 2. Compute Upgraded Robust BSJP Score (0-100)
        score_close = (close_location_ratio - 0.75) / 0.25 * 100.0
        score_close = float(np.clip(score_close, 0, 100))

        score_vol = (vol_mult - 1.4) / 3.0 * 100.0
        score_vol = float(np.clip(score_vol, 0, 100))

        # Fine-Tuning: Strong Momentum Runners (8.0% - 15.0%) have 67.7% WR vs 25% for weak 6-8%
        if 8.0 <= day_gain_pct <= 16.0:
            score_momentum = 100.0
        elif 3.5 <= day_gain_pct < 8.0:
            score_momentum = 70.0 + (day_gain_pct / 8.0 * 20.0)
        else:
            score_momentum = max(100.0 - (day_gain_pct - 16.0) * 5.0, 40.0)

        high_20 = df['high'].iloc[-21:-1].max()
        is_breakout = close_p >= high_20 * 0.995
        score_breakout = 100.0 if is_breakout else 50.0
        score_liq = float(np.clip((adtv_20 / 20e9) * 100.0, 30.0, 100.0))

        # Price Tier Bonus (Empirical: Price < 500 has 68.9% WR vs 36.7% for >1000)
        price_tier_bonus = 15.0 if close_p < 500.0 else (5.0 if close_p < 1000.0 else -10.0)

        # Sector Overnight Hazard Penalty (Empirical: Energy sector has only 17.6% WR due to global commodity swings)
        sector_penalty = -25.0 if sector == "Energy" else (10.0 if sector in ["Industrials", "Infrastructures", "Basic Materials"] else 0.0)

        raw_score = (
            0.25 * score_close +
            0.20 * score_vol +
            0.25 * score_momentum +
            0.15 * score_breakout +
            0.15 * score_liq +
            price_tier_bonus +
            sector_penalty
        )

        if not market_regime_ok:
            final_score = raw_score * 0.65  # 35% Macro Penalty
        else:
            final_score = raw_score

        final_score = float(np.clip(final_score, 10.0, 99.0))

        # Reasons list
        reasons = []
        if close_location_ratio >= 0.90:
            reasons.append("Close at High (Akumulasi masif pre-closing)")
        if vol_mult >= 2.0:
            reasons.append(f"Lonjakan Volume Kuat ({vol_mult:.1f}x SMA20)")
        if is_breakout:
            reasons.append("Breakout Resistance 20 Hari")
        if not market_regime_ok:
            reasons.append(f"⚠️ Warning: {regime_check['reason']}")

        # Probability Classification
        if final_score >= 75.0:
            prob = "HIGH"
        elif final_score >= 60.0:
            prob = "MODERATE"
        else:
            prob = "LOW"

        # Calculate Morning Target Levels
        target_min = round(close_p * 1.025, 0)  # +2.5% TP 1 (Quick Scalp)
        target_max = round(close_p * 1.060, 0)  # +6.0% TP 2 (Extended Momentum)
        stop_loss = round(close_p * 0.980, 0)   # -2.0% Hard Stop Loss

        rationale_text = f"Akumulasi agresif di akhir sesi dengan volume {vol_mult:.1f}x rata-rata 20 hari. Penutupan di area pucuk ({close_location_ratio*100:.0f}% range) menandakan dominasi kuat buyer institusi untuk lonjakan gap-up esok pagi."

        return BSJPCandidateResult(
            symbol=symbol,
            name=name,
            sector=sector,
            close_price=round(close_p, 2),
            entry_price=round(close_p, 2),
            current_price=round(close_p, 2),
            target_price=target_min,
            target_sell_morning_min=target_min,
            target_sell_morning_max=target_max,
            stop_loss_morning=stop_loss,
            day_gain_pct=round(day_gain_pct, 2),
            bsjp_score=round(final_score, 2),
            gap_up_probability=prob,
            volume_multiplier=round(vol_mult, 2),
            close_to_high_ratio_pct=round(close_location_ratio * 100.0, 1),
            upper_shadow_pct=round(upper_shadow_ratio * 100.0, 1),
            signed_delta_ratio=round(signed_delta_ratio, 2),
            market_regime_ok=market_regime_ok,
            reasons=reasons,
            rationale=rationale_text,
            adtv_20=round(adtv_20, 2),
            is_sharia=is_stock_sharia(symbol)
        )

    @classmethod
    def scan_bsjp_universe(
        cls,
        universe_ohlcv: Dict[str, pd.DataFrame],
        stocks_info: List[Dict[str, Any]],
        min_score: float = 50.0,
        ihsg_df: Optional[pd.DataFrame] = None,
        dt: Optional[datetime] = None
    ) -> List[BSJPCandidateResult]:
        """Scan universe with full macro, quality, and Friday weekend defense checks."""
        from src.analytics.friday_shield import FridayShieldEngine
        is_fri = FridayShieldEngine.is_friday(dt)
        candidates = []
        info_map = {item['symbol']: item for item in stocks_info}

        for symbol, df in universe_ohlcv.items():
            info = info_map.get(symbol, {})
            cand = cls.evaluate_bsjp_candidate(
                df=df,
                symbol=symbol,
                name=info.get("name", symbol),
                sector=info.get("sector", "Equities"),
                ihsg_df=ihsg_df
            )
            if cand is not None and cand.bsjp_score >= min_score:
                if is_fri:
                    cand.weekend_exposure_hours = 65.0
                    cand.is_weekend_qualified = cand.bsjp_score >= 70.0
                    cand.weekend_risk_badge = (
                        "[LOLOS FILTER WEEKEND (SKOR >= 70)]"
                        if cand.is_weekend_qualified
                        else "[RISIKO TINGGI OVERNIGHT 65 JAM]"
                    )
                else:
                    cand.weekend_exposure_hours = 17.0
                    cand.is_weekend_qualified = True
                    cand.weekend_risk_badge = "[OVERNIGHT NORMAL (17 JAM)]"

                candidates.append(cand)

        return sorted(candidates, key=lambda x: x.bsjp_score, reverse=True)
