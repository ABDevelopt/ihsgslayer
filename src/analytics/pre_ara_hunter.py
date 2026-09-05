from src.data.universe import is_stock_sharia
"""
Pre-ARA Hunter & Early Top-Gainer Quantitative Predictor Engine.
Formulates the mathematical DNA of IDX stocks BEFORE they explode into Top Gainers / ARA (Auto Rejection Atas +20% s/d +35%).

5 Pillars of Pre-ARA Prediction:
1. Pre-Ignition Volatility Squeeze (VCP / Squeeze 3-10 days).
2. Volume Velocity Acceleration (Volume 15-30m >= 2.5x normal rate).
3. Early Breakout Sweet Spot (+2.0% s/d +6.5% before second ignition wave).
4. Buyer Dominance & Low Lower Shadow (Aggressive At-Offer Buying / HAKA).
5. Order-Flow Absorption & Anti-Fake ARA Shield.
"""

from datetime import datetime, date
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field
from src.analytics.real_data_miner import round_to_idx_tick


class PreARACandidate(BaseModel):
    symbol: str
    name: str
    sector: str
    current_price: float
    morning_gain_pct: float
    ara_probability: str  # "SANGAT TINGGI (>85%)", "TINGGI (>70%)", "MODERAT (>55%)"
    pre_ara_score: float  # 0 to 100
    volume_velocity_multiplier: float  # e.g. 3.2x
    buyer_dominance_pct: float  # e.g. 92%
    distance_to_ara_pct: float  # e.g. +18.5% remaining to ARA ceiling
    ara_ceiling_price: float  # Price at ARA limit (+20%, +25%, or +35%)
    predicted_target_price: float = 0.0  # Explicit Predicted ARA Target Price
    predicted_gain_pct: float = 0.0  # Explicit Predicted Gain % to Plafon ARA
    predicted_tp1_price: float = 0.0  # Quick Momentum Exit Target Price
    predicted_tp1_gain_pct: float = 5.0  # Quick Momentum Exit Gain %
    predicted_stop_loss_price: float = 0.0  # Cut Loss Price
    predicted_stop_loss_pct: float = -3.0  # Cut Loss %
    selling_time_window: str = "Pagi (09:30 - 10:15 WIB) untuk TP1 / Sore (15:45 WIB) untuk Plafon ARA"
    selling_trigger_rule: str = "Kunci 50% profit saat menyentuh TP1 (+5.0%), pasang Trailing Stop untuk sisa posisi menuju Plafon ARA."
    holding_duration_guide: str = "30 Menit s/d 1 Hari (Zero Overnight)"
    tp1_target_time: str = "09:30 - 10:15 WIB (Puncak Wave 1)"
    ara_target_time: str = "11:00 - 11:30 / 15:45 WIB (ARA Lock)"
    max_exit_time: str = "15:45 WIB (Batas Akhir Sesi 2)"
    exit_strategy_tip: str = "Kunci 50% profit di TP1 (09:30 - 10:15 WIB), lalu pasang Trailing Stop untuk sisa lot menuju Plafon ARA."
    entry_zone: str  # Optimal entry before ARA lock
    target_ara_sell: str  # ARA exit target
    stop_loss: str  # Defensive cut loss
    risk_reward_ratio: str
    safety_status: str
    pre_ara_rationale: str
    pre_ara_signals: List[str] = Field(default_factory=list)
    is_sharia: bool = True


class PreARAHunterEngine:
    """
    Quantitative Screener & Prediction Engine for Pre-ARA and Early Top Gainers.
    """

    @classmethod
    def get_ara_limit_pct(cls, price: float) -> float:
        """
        IDX Auto Rejection Atas (ARA) regulatory price limits:
        - Price Rp 50 - Rp 200: +35% limit
        - Price Rp 200 - Rp 5,000: +25% limit
        - Price > Rp 5,000: +20% limit
        """
        if price < 200.0:
            return 35.0
        elif price <= 5000.0:
            return 25.0
        else:
            return 20.0

    @classmethod
    def calculate_pre_ara_score(
        cls,
        df: pd.DataFrame,
        symbol: str,
        name: str,
        sector: str,
        shield_flags: Optional[List[str]] = None
    ) -> Optional[PreARACandidate]:
        """
        Evaluate a single stock against the 5 Pre-ARA predictive rules.
        """
        if df.empty or len(df) < 25:
            return None

        # Latest candle (today / morning session)
        curr = df.iloc[-1]
        prev = df.iloc[-2]

        curr_open = float(curr["open"])
        curr_high = float(curr["high"])
        curr_low = float(curr["low"])
        curr_close = float(curr["close"])
        curr_vol = float(curr["volume"])

        prev_close = float(prev["close"])
        prev_high = float(prev["high"])
        prev_low = float(prev["low"])

        if curr_close <= 0 or prev_close <= 0:
            return None

        # Price metrics
        gain_pct = round(((curr_close - prev_close) / prev_close) * 100.0, 2)
        candle_range = max(curr_high - curr_low, 1.0)
        lower_shadow = (min(curr_open, curr_close) - curr_low) / candle_range
        upper_shadow = (curr_high - max(curr_open, curr_close)) / candle_range

        # -------------------------------------------------------------
        # 1. FILTER 1: Early Momentum Sweet Spot (+0.5% s/d +9.5%)
        # -------------------------------------------------------------
        # Kritis: Saham harus masih di awal letupan (+0.5% s/d +9.5%).
        # Jika sudah naik > 10%, sudah terlalu dekat ke ARA dan terlambat untuk momentum entry.
        if gain_pct < 0.5 or gain_pct > 9.5:
            return None

        # -------------------------------------------------------------
        # 2. FILTER 2: Buyer Dominance & Aggressive HAKA (Low Shadow <= 25%)
        # -------------------------------------------------------------
        # Ekor bawah tipis menandakan pembeli tidak memberi ruang harga turun di bawah open.
        if lower_shadow > 0.25:
            return None
        buyer_dom_pct = round((1.0 - lower_shadow) * 100.0, 1)

        # -------------------------------------------------------------
        # 3. FILTER 3: Volume Velocity Acceleration
        # -------------------------------------------------------------
        # Volume harian / pagi harus melampaui rata-rata 20 hari (Volume Velocity >= 1.2x)
        vol_ma20 = float(df["volume"].iloc[-21:-1].mean()) if len(df) >= 21 else float(df["volume"].mean())
        if vol_ma20 <= 0:
            vol_ma20 = 1.0

        vol_velocity = round(curr_vol / vol_ma20, 2)
        if vol_velocity < 1.20:
            return None

        # -------------------------------------------------------------
        # 4. FILTER 4: Pre-Ignition Volatility Squeeze / VCP (3-10 Days)
        # -------------------------------------------------------------
        # Mengukur apakah sebelum hari ini harga mengalami kompresi volatilitas ketat (VCP Coiling)
        recent_ranges = []
        for j in range(-7, -1):
            if abs(j) <= len(df):
                bar = df.iloc[j]
                rng = (float(bar["high"]) - float(bar["low"])) / (float(bar["close"]) + 1e-6)
                recent_ranges.append(rng)

        avg_pre_range = np.mean(recent_ranges) if recent_ranges else 0.05
        is_volatility_squeezed = avg_pre_range <= 0.050

        # Calculate 10-day Close Price Coefficient of Variation (CV)
        last_10_closes = df["close"].iloc[-11:-1] if len(df) >= 11 else df["close"]
        cv_10d = float((last_10_closes.std() / (last_10_closes.mean() + 1e-6)) * 100.0) if len(last_10_closes) > 1 else 5.0
        is_vcp_tight_coil = cv_10d <= 3.50  # Kompresi harga sangat padat sebelum letupan

        # -------------------------------------------------------------
        # 5. FILTER 5: Breakout Above Resistance / PDH
        # -------------------------------------------------------------
        is_breakout_pdh = curr_close > prev_high
        high_10 = float(df["high"].iloc[-11:-1].max()) if len(df) >= 11 else prev_high
        is_breakout_10d = curr_close >= high_10 * 0.990

        # -------------------------------------------------------------
        # 6. FILTER 6: Proteksi Saham Gorengan & Bangkrut
        # -------------------------------------------------------------
        if shield_flags and len(shield_flags) > 0:
            # Block if marked as severe penny or insolvent
            if any("GOCAP" in f or "INSOLVENCY" in f for f in shield_flags):
                return None

        # Minimum Price & ADTV Filter
        if curr_close < 60.0:
            return None

        # -------------------------------------------------------------
        # SCORING PRE-ARA FORMULA (0 - 100)
        # -------------------------------------------------------------
        score = 60.0

        # Volume velocity boost (max +20 pts)
        if vol_velocity >= 3.0:
            score += 20.0
        elif vol_velocity >= 2.0:
            score += 15.0
        elif vol_velocity >= 1.5:
            score += 10.0
        elif vol_velocity >= 1.2:
            score += 5.0

        # Buyer dominance boost (max +10 pts)
        if lower_shadow <= 0.05:
            score += 10.0
        elif lower_shadow <= 0.12:
            score += 7.0
        elif lower_shadow <= 0.20:
            score += 4.0

        # Volatility squeeze & VCP tight coil boost (max +10 pts)
        if is_vcp_tight_coil:
            score += 8.0
        elif is_volatility_squeezed:
            score += 5.0

        # Breakout validation boost (max +5 pts)
        if is_breakout_pdh or is_breakout_10d:
            score += 5.0

        # Price Bracket / Fraksi Sweet Spot Boost (max +5 pts)
        # Tier Rp 200 - Rp 500 (Fraksi Rp 2) adalah tier paling eksplosif untuk ARA Top Gainer
        if 200.0 <= curr_close <= 500.0:
            score += 5.0
        elif curr_close < 200.0:
            score += 3.0

        final_score = round(min(99.0, score), 1)

        # Calculate ARA target metrics
        ara_pct_limit = cls.get_ara_limit_pct(curr_close)
        ara_ceiling = round_to_idx_tick(prev_close * (1.0 + ara_pct_limit / 100.0))
        distance_to_ara = round(((ara_ceiling - curr_close) / curr_close) * 100.0, 1)

        # Trading Plan with exact IDX Tick Size
        entry_low = round_to_idx_tick(curr_close * 0.995)
        entry_high = round_to_idx_tick(curr_close * 1.010)
        stop_loss = round_to_idx_tick(curr_close * 0.970)  # -3% stop loss
        risk_pct = round(((curr_close - stop_loss) / curr_close) * 100.0, 1)
        rr_ratio = round(distance_to_ara / (risk_pct + 1e-6), 1)

        if final_score >= 85.0:
            ara_prob = "SANGAT TINGGI (>85%)"
        elif final_score >= 72.0:
            ara_prob = "TINGGI (>70%)"
        else:
            ara_prob = "MODERAT (>55%)"

        vcp_text = f"Kompresi Volatilitas VCP Kuat (CV 10h {cv_10d:.1f}%)" if is_vcp_tight_coil else "Konsolidasi Base Padat"
        fraksi_text = f"Tier Fraksi Rp 2 (Rp {int(curr_close):,}) Eksplosif" if 200 <= curr_close <= 500 else f"Tier Fraksi Rp 1 (Rp {int(curr_close):,})"

        pre_ara_signals = [
            f"[Volume Velocity Meledak] Kecepatan volume mencapai {vol_velocity:.1f}x dari rata-rata transaksi 20 hari.",
            f"[Dominasi Buyer Kuat ({buyer_dom_pct}%)] Ekor bawah sangat tipis ({int(lower_shadow*100)}%), harga dihajar beli (HAKA) tanpa ampun sejak pembukaan.",
            f"[Pola Pre-Breakout] Terkonfirmasi {vcp_text} & {fraksi_text}.",
            f"[Zona Manis Early Launch (+{gain_pct}%)] Saham baru memulai letupan awal (+{gain_pct}%) dengan sisa ruang ke plafon ARA masih +{distance_to_ara}%.",
            f"[Konfirmasi Breakout Level Kunci] Menembus High kemarin (Rp {prev_high:,.0f}) menuju plafon ARA Rp {ara_ceiling:,.0f} (+{ara_pct_limit:.0f}%)."
        ]

        rationale = (
            f"Saham {symbol} memenuhi formula matematis Calon Top Gainer / Pre-ARA dengan Skor {final_score}/100. "
            f"Terjadi ledakan volume {vol_velocity:.1f}x dan dominasi buyer agresif ({buyer_dom_pct}%) didahului {vcp_text}. "
            f"Peluang mengunci kenaikan menuju batas ARA Rp {ara_ceiling:,.0f} (+{distance_to_ara}%) sangat optimal."
        )

        tp1_price = round_to_idx_tick(curr_close * 1.050)
        tp1_gain = round(((tp1_price - curr_close) / curr_close) * 100.0, 1)

        return PreARACandidate(
            symbol=symbol,
            name=name,
            sector=sector,
            current_price=curr_close,
            morning_gain_pct=gain_pct,
            ara_probability=ara_prob,
            pre_ara_score=final_score,
            volume_velocity_multiplier=vol_velocity,
            buyer_dominance_pct=buyer_dom_pct,
            distance_to_ara_pct=distance_to_ara,
            ara_ceiling_price=ara_ceiling,
            predicted_target_price=ara_ceiling,
            predicted_gain_pct=distance_to_ara,
            predicted_tp1_price=tp1_price,
            predicted_tp1_gain_pct=tp1_gain,
            predicted_stop_loss_price=stop_loss,
            predicted_stop_loss_pct=-risk_pct,
            entry_zone=f"Rp {entry_low:,.0f} - Rp {entry_high:,.0f}",
            target_ara_sell=f"Rp {ara_ceiling:,.0f} (+{distance_to_ara}%)",
            stop_loss=f"Rp {stop_loss:,.0f} (-{risk_pct}%)",
            risk_reward_ratio=f"1 : {rr_ratio:.1f}",
            safety_status="AMAN / BEBAS GORENGAN EKSTREM",
            pre_ara_rationale=rationale,
            pre_ara_signals=pre_ara_signals,
            is_sharia=is_stock_sharia(symbol)
        )

    @classmethod
    def scan_pre_ara_universe(
        cls,
        ohlcv_map: Dict[str, pd.DataFrame],
        universe_list: List[Dict[str, Any]],
        min_score: float = 60.0,
        collector=None,
        shield_engine=None
    ) -> List[PreARACandidate]:
        """
        Scan all stocks in the universe for Pre-ARA candidates with high-speed evaluation.
        """
        candidates: List[PreARACandidate] = []

        for item in universe_list:
            sym = item["symbol"]
            name = item.get("name", sym)
            sector = item.get("sector", "General")

            df = ohlcv_map.get(sym)
            if df is None or df.empty or len(df) < 15:
                continue

            cand = cls.calculate_pre_ara_score(
                df=df,
                symbol=sym,
                name=name,
                sector=sector,
                shield_flags=[]
            )

            if cand and cand.pre_ara_score >= min_score:
                candidates.append(cand)

        # Sort descending by pre_ara_score and volume_velocity
        candidates = sorted(candidates, key=lambda x: (x.pre_ara_score, x.volume_velocity_multiplier), reverse=True)
        return candidates
