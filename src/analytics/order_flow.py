from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

class OrderFlowEngine:
    """
    Deep Order-Flow & Microstructure Analytics Engine.
    Computes:
    - Signed Volume Delta
    - Cumulative Liquidity Pressure Model (LPM)
    - Volume Intensity Spike Detector
    - Volume Rotation / Absorption Efficiency
    - Hidden Accumulation & Distribution Divergence
    """

    @staticmethod
    def calculate_signed_volume_delta(df: pd.DataFrame) -> pd.Series:
        """
        Calculate estimated Signed Volume Delta for each bar using intraday price location.
        Formula: Delta_V = Volume * [ 2 * (Close - Low) / (High - Low + eps) - 1 ]
        """
        candle_range = df['high'] - df['low']
        eps = 1e-6
        # Ratio of Close relative to bar range [-1, +1]
        cl_ratio = (2.0 * (df['close'] - df['low']) / (candle_range + eps)) - 1.0
        signed_delta = df['volume'] * cl_ratio
        return signed_delta

    @classmethod
    def calculate_liquidity_pressure(
        cls,
        df: pd.DataFrame,
        decay: float = 0.95
    ) -> pd.Series:
        """
        Calculate Cumulative Liquidity Pressure Curve (LPM) with exponential time-decay.
        LPM_t = decay * LPM_{t-1} + Delta_V_t
        """
        delta = cls.calculate_signed_volume_delta(df)
        lpm = np.zeros(len(df))
        
        running = 0.0
        for i, val in enumerate(delta):
            running = running * decay + val
            lpm[i] = running

        return pd.Series(lpm, index=df.index, name="liquidity_pressure")

    @staticmethod
    def calculate_volume_intensity(df: pd.DataFrame, period: int = 20) -> pd.Series:
        """
        Calculate Volume Intensity Spike Ratio:
        Intensity = (Volume / SMA(Volume, 20)) * (Range / ATR(14))
        """
        vol_sma = df['volume'].rolling(period).mean().replace(0, np.nan)
        vol_ratio = df['volume'] / vol_sma

        # ATR 14
        tr = pd.concat([
            df['high'] - df['low'],
            (df['high'] - df['close'].shift(1)).abs(),
            (df['low'] - df['close'].shift(1)).abs()
        ], axis=1).max(axis=1)
        atr = tr.rolling(14).mean().bfill()
        
        range_ratio = (df['high'] - df['low']) / (atr.replace(0, np.nan) + 1e-6)
        intensity = vol_ratio * range_ratio
        return intensity.fillna(1.0).rename("volume_intensity")

    @staticmethod
    def calculate_volume_rotation_absorption(df: pd.DataFrame, period: int = 20) -> pd.Series:
        """
        Calculate Volume Rotation / Absorption Efficiency:
        High volume with tight range indicates institutional absorption.
        Absorption = (Volume / SMA(Volume, 20)) / ( (Range / ATR(14)) + 0.01 )
        """
        vol_sma = df['volume'].rolling(period).mean().replace(0, np.nan)
        vol_ratio = df['volume'] / vol_sma

        tr = pd.concat([
            df['high'] - df['low'],
            (df['high'] - df['close'].shift(1)).abs(),
            (df['low'] - df['close'].shift(1)).abs()
        ], axis=1).max(axis=1)
        atr = tr.rolling(14).mean().bfill()

        range_ratio = (df['high'] - df['low']) / (atr.replace(0, np.nan) + 1e-6)
        absorption = vol_ratio / (range_ratio + 0.05)
        return absorption.fillna(1.0).rename("volume_absorption")

    @classmethod
    def detect_orderflow_signals(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze full order flow metrics and extract actionable alerts."""
        if len(df) < 25:
            return {
                "liquidity_pressure": 0.0,
                "volume_intensity": 1.0,
                "absorption_efficiency": 1.0,
                "is_hidden_accumulation": False,
                "is_distribution_warning": False,
                "intensity_spike": False
            }

        df_calc = df.copy()
        df_calc['lpm'] = cls.calculate_liquidity_pressure(df_calc)
        df_calc['intensity'] = cls.calculate_volume_intensity(df_calc)
        df_calc['absorption'] = cls.calculate_volume_rotation_absorption(df_calc)

        curr = df_calc.iloc[-1]
        lookback_10 = df_calc.iloc[-10:]

        # Divergence: Price flat/down in last 10 bars while LPM is surging up
        price_change_10 = (curr['close'] - lookback_10['close'].iloc[0]) / (lookback_10['close'].iloc[0] + 1e-6)
        lpm_change_10 = curr['lpm'] - lookback_10['lpm'].iloc[0]

        is_hidden_accumulation = (price_change_10 <= 0.015) and (lpm_change_10 > 0) and (curr['absorption'] > 1.4)
        is_distribution_warning = (price_change_10 >= 0.05) and (lpm_change_10 < 0) and (curr['intensity'] > 2.0)
        intensity_spike = curr['intensity'] >= 2.2

        return {
            "liquidity_pressure": round(float(curr['lpm']), 2),
            "volume_intensity": round(float(curr['intensity']), 2),
            "absorption_efficiency": round(float(curr['absorption']), 2),
            "is_hidden_accumulation": bool(is_hidden_accumulation),
            "is_distribution_warning": bool(is_distribution_warning),
            "intensity_spike": bool(intensity_spike),
            "lpm_series": df_calc['lpm'].tail(30).tolist()
        }
