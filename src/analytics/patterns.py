from datetime import date
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from src.data.schema import PatternSignalResult

class PatternRecognizer:
    """
    Algorithmic Smart Pick Pattern Detector.
    Detects 5 institutional market structure patterns:
    1. Area Demand
    2. Throwback / Retest
    3. Liquidity Sweep
    4. Bull Divergence
    5. Early Breakout
    """

    @staticmethod
    def _calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index (RSI)."""
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / (loss.replace(0, np.nan))
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50.0)

    @staticmethod
    def _calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Average True Range (ATR)."""
        high = df['high']
        low = df['low']
        close_prev = df['close'].shift(1)
        tr = pd.concat([
            high - low,
            (high - close_prev).abs(),
            (low - close_prev).abs()
        ], axis=1).max(axis=1)
        return tr.rolling(window=period).mean().bfill()

    def detect_area_demand(self, df: pd.DataFrame) -> Optional[PatternSignalResult]:
        """
        Pattern 1: Area Demand
        Price testing a 20-50 day support with a buying tail (lower shadow >= 50% candle range)
        and volume dry-up or rejection spike.
        """
        if len(df) < 25:
            return None

        curr = df.iloc[-1]
        vol_sma20 = df['volume'].iloc[-21:-1].mean()
        swing_support = df['low'].iloc[-50:-1].min()

        candle_range = curr['high'] - curr['low']
        if candle_range <= 0:
            return None

        body_top = max(curr['open'], curr['close'])
        body_bottom = min(curr['open'], curr['close'])
        lower_shadow = body_bottom - curr['low']
        lower_shadow_ratio = lower_shadow / candle_range

        # Condition 1: Near structural support (within 3%)
        near_support = (curr['low'] <= swing_support * 1.03) and (curr['close'] >= swing_support * 0.98)
        # Condition 2: Strong rejection tail (lower shadow >= 45%)
        has_rejection_tail = lower_shadow_ratio >= 0.45
        # Condition 3: Volume confirmation
        vol_dryup = df['volume'].iloc[-4:-1].mean() < 0.85 * vol_sma20
        vol_spike = curr['volume'] >= 1.15 * vol_sma20

        if near_support and has_rejection_tail and (vol_dryup or vol_spike):
            strength = float(np.clip(50.0 + (lower_shadow_ratio * 40.0) + (10.0 if vol_spike else 5.0), 0, 100))
            return PatternSignalResult(
                symbol=curr['symbol'],
                date=curr['date'],
                pattern_name="AREA_DEMAND",
                is_detected=True,
                strength=round(strength, 2),
                description="Price bounced from strong demand support area with bullish rejection tail.",
                metadata={
                    "support_level": round(swing_support, 2),
                    "lower_shadow_ratio": round(lower_shadow_ratio, 2),
                    "volume_ratio": round(curr['volume'] / (vol_sma20 + 1), 2)
                }
            )
        return None

    def detect_throwback_retest(self, df: pd.DataFrame) -> Optional[PatternSignalResult]:
        """
        Pattern 2: Throwback / Retest
        Breakout of resistance within last 3-10 days, followed by a light-volume pullback
        holding above the breakout level.
        """
        if len(df) < 30:
            return None

        curr = df.iloc[-1]
        prior_window = df.iloc[-30:-5]
        resistance = prior_window['high'].max()
        vol_sma20 = df['volume'].iloc[-21:-1].mean()

        # Did price break out recently?
        recent_bars = df.iloc[-5:-1]
        had_breakout = (recent_bars['close'] > resistance).any()
        
        # Is current price retesting near resistance level (within 2%)?
        is_retesting = abs(curr['low'] - resistance) / (resistance + 1e-6) <= 0.025 and curr['close'] >= resistance * 0.99
        # Is volume shrinking on pullback?
        low_pullback_vol = curr['volume'] <= 1.25 * vol_sma20

        if had_breakout and is_retesting and low_pullback_vol:
            strength = 75.0 if curr['close'] > curr['open'] else 65.0
            return PatternSignalResult(
                symbol=curr['symbol'],
                date=curr['date'],
                pattern_name="THROWBACK_RETEST",
                is_detected=True,
                strength=strength,
                description="Successful throwback retest of former resistance acting as new support.",
                metadata={
                    "breakout_level": round(resistance, 2),
                    "current_price": round(curr['close'], 2)
                }
            )
        return None

    def detect_liquidity_sweep(self, df: pd.DataFrame) -> Optional[PatternSignalResult]:
        """
        Pattern 3: Liquidity Sweep (Spring / Stop-Hunt)
        Price dips below previous swing low, triggers stops, and aggressively closes back inside range on volume.
        """
        if len(df) < 25:
            return None

        curr = df.iloc[-1]
        vol_sma20 = df['volume'].iloc[-21:-1].mean()
        prev_low = df['low'].iloc[-21:-1].min()

        # Dipped below swing low intraday, but closed above swing low
        swept_low = curr['low'] < prev_low
        closed_above = curr['close'] > prev_low
        high_volume = curr['volume'] >= 1.2 * vol_sma20

        if swept_low and closed_above and high_volume:
            sweep_depth = (prev_low - curr['low']) / (prev_low + 1e-6)
            strength = float(np.clip(60.0 + (curr['volume'] / (vol_sma20 + 1) * 15.0), 0, 100))
            return PatternSignalResult(
                symbol=curr['symbol'],
                date=curr['date'],
                pattern_name="LIQUIDITY_SWEEP",
                is_detected=True,
                strength=round(strength, 2),
                description="Market maker liquidity sweep / stop hunt below support with strong reversal close.",
                metadata={
                    "swept_low_level": round(prev_low, 2),
                    "intraday_low": round(curr['low'], 2),
                    "sweep_depth_pct": round(sweep_depth * 100, 2)
                }
            )
        return None

    def detect_bull_divergence(self, df: pd.DataFrame) -> Optional[PatternSignalResult]:
        """
        Pattern 4: Bullish Momentum Divergence
        Price makes Lower Low (LL) over 10-25 bars while RSI makes Higher Low (HL).
        """
        if len(df) < 30:
            return None

        df_calc = df.copy()
        df_calc['rsi'] = self._calculate_rsi(df_calc['close'], 14)

        curr = df_calc.iloc[-1]
        lookback = df_calc.iloc[-25:-1]

        # Find prior swing low in lookback
        prior_low_idx = lookback['low'].idxmin()
        prior_low = lookback.loc[prior_low_idx, 'low']
        prior_rsi = lookback.loc[prior_low_idx, 'rsi']

        curr_low = curr['low']
        curr_rsi = curr['rsi']

        # Price lower low or equal, but RSI higher low
        price_lower = curr_low <= prior_low * 1.01
        rsi_higher = curr_rsi > (prior_rsi + 3.0) and curr_rsi < 60.0

        if price_lower and rsi_higher:
            strength = float(np.clip(65.0 + (curr_rsi - prior_rsi) * 1.5, 0, 100))
            return PatternSignalResult(
                symbol=curr['symbol'],
                date=curr['date'],
                pattern_name="BULL_DIVERGENCE",
                is_detected=True,
                strength=round(strength, 2),
                description="Bullish RSI divergence: price made lower low while momentum RSI made higher low.",
                metadata={
                    "prior_low": round(prior_low, 2),
                    "prior_rsi": round(prior_rsi, 2),
                    "curr_rsi": round(curr_rsi, 2)
                }
            )
        return None

    def detect_early_breakout(self, df: pd.DataFrame) -> Optional[PatternSignalResult]:
        """
        Pattern 5: Early Breakout (Volatility Squeeze Expansion)
        Bollinger Band Squeeze followed by Upper Band breakout with volume > 1.8x SMA20.
        """
        if len(df) < 30:
            return None

        df_calc = df.copy()
        sma20 = df_calc['close'].rolling(20).mean()
        std20 = df_calc['close'].rolling(20).std()
        upper_bb = sma20 + (2 * std20)
        lower_bb = sma20 - (2 * std20)
        bandwidth = (upper_bb - lower_bb) / sma20

        curr = df_calc.iloc[-1]
        curr_upper = upper_bb.iloc[-1]
        curr_bandwidth = bandwidth.iloc[-1]
        prior_bandwidth = bandwidth.iloc[-2]
        hist_bandwidth_20pct = bandwidth.iloc[-40:-2].quantile(0.35)
        vol_sma20 = df_calc['volume'].iloc[-21:-1].mean()

        # Was bandwidth squeezed prior to breakout?
        was_squeezed = prior_bandwidth <= hist_bandwidth_20pct * 1.5 or prior_bandwidth < 0.05
        is_breaking_out = curr['close'] >= curr_upper * 0.995
        high_volume = curr['volume'] >= 1.7 * vol_sma20

        if was_squeezed and is_breaking_out and high_volume:
            vol_mult = curr['volume'] / (vol_sma20 + 1)
            strength = float(np.clip(70.0 + (vol_mult * 10.0), 0, 100))
            return PatternSignalResult(
                symbol=curr['symbol'],
                date=curr['date'],
                pattern_name="EARLY_BREAKOUT",
                is_detected=True,
                strength=round(strength, 2),
                description="Explosive early breakout from tight volatility squeeze with heavy volume expansion.",
                metadata={
                    "upper_bb": round(curr_upper, 2),
                    "volume_multiplier": round(vol_mult, 2),
                    "bandwidth": round(curr_bandwidth, 4)
                }
            )
        return None

    def scan_all_patterns(self, df: pd.DataFrame) -> List[PatternSignalResult]:
        """Scan a stock's OHLCV dataframe for all 5 Smart Pick patterns."""
        if df.empty or len(df) < 25:
            return []

        detectors = [
            self.detect_area_demand,
            self.detect_throwback_retest,
            self.detect_liquidity_sweep,
            self.detect_bull_divergence,
            self.detect_early_breakout
        ]

        active_signals = []
        for det in detectors:
            sig = det(df)
            if sig is not None and sig.is_detected:
                active_signals.append(sig)

        return active_signals
