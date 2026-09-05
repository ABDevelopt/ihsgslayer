import pytest
from datetime import date, timedelta
import pandas as pd
import numpy as np
from src.analytics.patterns import PatternRecognizer

@pytest.fixture
def recognizer():
    return PatternRecognizer()

def _create_base_ohlcv(n: int = 40, base_price: float = 1000.0) -> pd.DataFrame:
    dates = [date(2026, 1, 1) + timedelta(days=i) for i in range(n)]
    records = []
    for i, dt in enumerate(dates):
        p = base_price + i * 2.0
        records.append({
            "symbol": "TEST.JK",
            "date": dt,
            "open": p,
            "high": p + 10.0,
            "low": p - 10.0,
            "close": p + 2.0,
            "adj_close": p + 2.0,
            "volume": 100_000,
            "value": p * 100_000
        })
    return pd.DataFrame(records)

def test_detect_area_demand(recognizer):
    df = _create_base_ohlcv(n=45, base_price=1000.0)
    # Set structural support around low=980
    df.loc[10, 'low'] = 980.0
    
    # Last candle: bounces at 982 with long lower shadow (hammer) and high volume
    df.loc[44, 'open'] = 1000.0
    df.loc[44, 'high'] = 1005.0
    df.loc[44, 'low'] = 982.0
    df.loc[44, 'close'] = 1002.0
    df.loc[44, 'volume'] = 250_000

    sig = recognizer.detect_area_demand(df)
    assert sig is not None
    assert sig.pattern_name == "AREA_DEMAND"
    assert sig.is_detected is True
    assert sig.strength >= 50.0

def test_detect_liquidity_sweep(recognizer):
    df = _create_base_ohlcv(n=35, base_price=2000.0)
    # Set 20-day swing low at 1950
    df.loc[20, 'low'] = 1950.0
    
    # Last candle: dips to 1930 (sweep below 1950), but closes back at 1965 on big volume
    df.loc[34, 'open'] = 1955.0
    df.loc[34, 'high'] = 1970.0
    df.loc[34, 'low'] = 1930.0
    df.loc[34, 'close'] = 1965.0
    df.loc[34, 'volume'] = 300_000

    sig = recognizer.detect_liquidity_sweep(df)
    assert sig is not None
    assert sig.pattern_name == "LIQUIDITY_SWEEP"
    assert sig.is_detected is True

def test_detect_early_breakout(recognizer):
    df = _create_base_ohlcv(n=50, base_price=5000.0)
    # Consolidate very tightly in bars 20-48 (low volatility squeeze)
    for i in range(20, 49):
        df.loc[i, 'open'] = 5000.0
        df.loc[i, 'high'] = 5005.0
        df.loc[i, 'low'] = 4995.0
        df.loc[i, 'close'] = 5000.0
        df.loc[i, 'volume'] = 50_000

    # Breakout bar at index 49 with massive volume expansion
    df.loc[49, 'open'] = 5005.0
    df.loc[49, 'high'] = 5120.0
    df.loc[49, 'low'] = 5000.0
    df.loc[49, 'close'] = 5110.0
    df.loc[49, 'volume'] = 350_000

    sig = recognizer.detect_early_breakout(df)
    assert sig is not None
    assert sig.pattern_name == "EARLY_BREAKOUT"
    assert sig.is_detected is True
