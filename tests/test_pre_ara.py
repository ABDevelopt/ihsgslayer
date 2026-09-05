import pytest
import pandas as pd
import numpy as np
from src.analytics.pre_ara_hunter import PreARAHunterEngine, PreARACandidate

def create_mock_pre_ara_ohlcv(
    gain_pct: float = 3.5,
    vol_multiplier: float = 3.0,
    lower_shadow_pct: float = 0.05,
    days: int = 30
) -> pd.DataFrame:
    """Generate realistic OHLCV dataframe for testing Pre-ARA engine."""
    rows = []
    base_p = 1000.0
    base_v = 1000000

    # Past 29 days consolidation
    for i in range(days - 1):
        rows.append({
            "open": base_p,
            "high": base_p + 15.0,
            "low": base_p - 15.0,
            "close": base_p + (5.0 if i % 2 == 0 else -5.0),
            "volume": base_v
        })

    # Day 30: Pre-ARA ignition day
    curr_open = base_p + 10.0
    curr_close = round(base_p * (1.0 + gain_pct / 100.0), 0)
    curr_high = curr_close + 10.0
    candle_range = max(curr_high - (curr_open - 5.0), 10.0)
    curr_low = curr_open - (candle_range * lower_shadow_pct)

    rows.append({
        "open": curr_open,
        "high": curr_high,
        "low": curr_low,
        "close": curr_close,
        "volume": int(base_v * vol_multiplier)
    })

    return pd.DataFrame(rows)

def test_pre_ara_ideal_candidate():
    df = create_mock_pre_ara_ohlcv(gain_pct=3.5, vol_multiplier=3.2, lower_shadow_pct=0.04)
    cand = PreARAHunterEngine.calculate_pre_ara_score(
        df=df,
        symbol="BRIS.JK",
        name="Bank Syariah Indonesia Tbk",
        sector="Financials"
    )
    assert cand is not None
    assert cand.symbol == "BRIS.JK"
    assert cand.pre_ara_score >= 85.0
    assert "SANGAT TINGGI" in cand.ara_probability
    assert cand.volume_velocity_multiplier >= 3.0
    assert cand.distance_to_ara_pct > 15.0
    assert len(cand.pre_ara_signals) >= 4

def test_pre_ara_reject_late_explosion():
    # Gain +15.0% is already too late (second wave already passed)
    df = create_mock_pre_ara_ohlcv(gain_pct=15.0, vol_multiplier=3.0, lower_shadow_pct=0.05)
    cand = PreARAHunterEngine.calculate_pre_ara_score(
        df=df,
        symbol="LATE.JK",
        name="Late Stock Tbk",
        sector="Energy"
    )
    assert cand is None

def test_pre_ara_reject_deep_lower_shadow():
    # Deep lower shadow (35%) means seller fought back heavily
    df = create_mock_pre_ara_ohlcv(gain_pct=3.0, vol_multiplier=3.0, lower_shadow_pct=0.35)
    cand = PreARAHunterEngine.calculate_pre_ara_score(
        df=df,
        symbol="WEAK.JK",
        name="Weak Buyer Tbk",
        sector="Consumer"
    )
    assert cand is None

def test_pre_ara_reject_low_volume():
    # Volume multiplier 1.0x (no big money acceleration)
    df = create_mock_pre_ara_ohlcv(gain_pct=3.0, vol_multiplier=1.0, lower_shadow_pct=0.05)
    cand = PreARAHunterEngine.calculate_pre_ara_score(
        df=df,
        symbol="NOVOL.JK",
        name="No Volume Tbk",
        sector="Basic Materials"
    )
    assert cand is None

def test_pre_ara_reject_gocap_trap():
    df = create_mock_pre_ara_ohlcv(gain_pct=3.0, vol_multiplier=3.0, lower_shadow_pct=0.05)
    cand = PreARAHunterEngine.calculate_pre_ara_score(
        df=df,
        symbol="TRAP.JK",
        name="Gocap Trap Tbk",
        sector="Penny",
        shield_flags=["SAHAM GOCAP TRAP", "EXTREME DEBT"]
    )
    assert cand is None
