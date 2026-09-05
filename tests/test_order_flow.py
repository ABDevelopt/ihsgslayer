import pytest
import pandas as pd
import numpy as np
from src.analytics.order_flow import OrderFlowEngine

def test_signed_volume_delta_mechanics():
    df = pd.DataFrame({
        "open": [1000.0, 1000.0],
        "high": [1050.0, 1050.0],
        "low": [950.0, 950.0],
        "close": [1050.0, 950.0],  # Bar 0 closed at high, Bar 1 closed at low
        "volume": [100_000, 100_000]
    })

    deltas = OrderFlowEngine.calculate_signed_volume_delta(df)
    assert len(deltas) == 2
    # Bar 0 close at high -> Delta should be +100_000
    assert pytest.approx(deltas.iloc[0], rel=1e-2) == 100_000.0
    # Bar 1 close at low -> Delta should be -100_000
    assert pytest.approx(deltas.iloc[1], rel=1e-2) == -100_000.0

def test_liquidity_pressure_decay():
    df = pd.DataFrame({
        "open": [100.0] * 5,
        "high": [110.0] * 5,
        "low": [90.0] * 5,
        "close": [110.0] * 5, # All closed at high (+delta)
        "volume": [10_000] * 5
    })

    lpm = OrderFlowEngine.calculate_liquidity_pressure(df, decay=0.9)
    assert len(lpm) == 5
    assert pytest.approx(lpm.iloc[0], rel=1e-3) == 10_000.0
    # LPM_1 = 0.9 * 10000 + 10000 = 19000
    assert pytest.approx(lpm.iloc[1], rel=1e-2) == 19_000.0
    # Monotonically increasing with continuous buy volume
    assert lpm.iloc[4] > lpm.iloc[0]

def test_volume_intensity_and_absorption():
    records = []
    for i in range(25):
        records.append({
            "open": 1000.0,
            "high": 1020.0,
            "low": 980.0,
            "close": 1010.0,
            "volume": 50_000
        })
    # Last bar: massive volume spike (5x) with large range
    records.append({
        "open": 1000.0,
        "high": 1100.0,
        "low": 980.0,
        "close": 1090.0,
        "volume": 250_000
    })

    df = pd.DataFrame(records)
    intensity = OrderFlowEngine.calculate_volume_intensity(df)
    assert intensity.iloc[-1] > 2.0  # Intensity spike detected
