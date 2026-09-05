import pytest
import pandas as pd
import numpy as np
from src.analytics.bpjs import BPJSEngine

def create_sample_ohlcv(
    curr_close: float = 1050.0,
    curr_open: float = 1010.0,
    curr_high: float = 1060.0,
    curr_low: float = 1005.0,
    curr_vol: float = 5_000_000.0,
    prev_close: float = 1000.0,
    prev_high: float = 1020.0,
    avg_vol: float = 2_000_000.0
) -> pd.DataFrame:
    """Helper to create 30-day realistic OHLCV dataframe for testing."""
    dates = pd.date_range(end="2026-08-27", periods=30)
    df = pd.DataFrame({
        "open": np.linspace(950, prev_close, 30),
        "high": np.linspace(960, prev_high, 30),
        "low": np.linspace(940, prev_close * 0.98, 30),
        "close": np.linspace(950, prev_close, 30),
        "volume": np.full(30, avg_vol),
        "value": np.full(30, avg_vol * 1000.0)
    }, index=dates)

    # Set current candle (last row)
    df.iloc[-1, df.columns.get_loc('open')] = curr_open
    df.iloc[-1, df.columns.get_loc('high')] = curr_high
    df.iloc[-1, df.columns.get_loc('low')] = curr_low
    df.iloc[-1, df.columns.get_loc('close')] = curr_close
    df.iloc[-1, df.columns.get_loc('volume')] = curr_vol
    df.iloc[-1, df.columns.get_loc('value')] = curr_vol * curr_close

    return df

def test_bpjs_ideal_candidate():
    df = create_sample_ohlcv(
        curr_close=1050.0,  # +5.0% gain from 1000
        curr_open=1010.0,
        curr_high=1060.0,
        curr_low=1008.0,    # Low very close to Open (minimal lower shadow)
        curr_vol=5_000_000.0,  # 2.5x volume spike
        prev_close=1000.0,
        prev_high=1020.0
    )
    fund = {"roe": 16.5, "npm": 18.0, "der": 0.4}
    safety = {"risk_badge": "AMAN / BEBAS GORENGAN", "allow_buy": True, "is_gorengan": False, "is_danger": False}

    res = BPJSEngine.evaluate_bpjs_candidate(
        df=df,
        symbol="TLKM.JK",
        name="Telkom Indonesia",
        sector="Infrastructure",
        min_adtv=2_000_000_000.0,
        fund_data=fund,
        safety_data=safety
    )

    assert res is not None
    assert res.symbol == "TLKM.JK"
    assert res.morning_gain_pct >= 4.0
    assert res.volume_multiplier >= 2.0
    assert res.bpjs_score >= 70.0
    assert "HIGH" in res.win_probability or "MODERATE" in res.win_probability
    assert "Rp" in res.target_tp1_intraday
    assert len(res.why_bpjs_points) >= 3

def test_bpjs_reject_deep_lower_shadow():
    # Price dropped heavily before recovering (lower shadow too big > 35%)
    df = create_sample_ohlcv(
        curr_close=1030.0,
        curr_open=1010.0,
        curr_high=1050.0,
        curr_low=950.0,     # Deep drop to 950 (range 100, open-low = 60, ratio = 0.60)
        curr_vol=4_000_000.0,
        prev_close=1000.0
    )
    res = BPJSEngine.evaluate_bpjs_candidate(df=df, symbol="TEST.JK")
    assert res is None

def test_bpjs_reject_low_volume():
    # No volume explosion (volume multiplier only 0.8x)
    df = create_sample_ohlcv(
        curr_close=1030.0,
        curr_open=1010.0,
        curr_high=1035.0,
        curr_low=1008.0,
        curr_vol=1_200_000.0,  # Below 2_000_000 average
        prev_close=1000.0
    )
    res = BPJSEngine.evaluate_bpjs_candidate(df=df, symbol="TEST.JK")
    assert res is None

def test_bpjs_reject_gorengan_and_danger():
    df = create_sample_ohlcv(
        curr_close=1050.0,
        curr_open=1010.0,
        curr_high=1060.0,
        curr_low=1008.0,
        curr_vol=5_000_000.0
    )
    safety = {"is_gorengan": True, "allow_buy": False, "is_danger": True}
    res = BPJSEngine.evaluate_bpjs_candidate(
        df=df,
        symbol="GORG.JK",
        safety_data=safety
    )
    assert res is None
