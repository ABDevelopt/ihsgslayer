"""
Unit tests for Deep Bandarmologi Engine: CR3, CR5, Bandar VWAP, and Golden Entry.
"""

import pytest
import pandas as pd
import numpy as np
from src.analytics.broker_foreign import BrokerForeignEngine


def test_calculate_concentration_ratio():
    trades = [
        {"broker": "AK", "buy_val": 50e9, "sell_val": 5e9},
        {"broker": "BK", "buy_val": 30e9, "sell_val": 2e9},
        {"broker": "ZP", "buy_val": 20e9, "sell_val": 3e9},
        {"broker": "YP", "buy_val": 10e9, "sell_val": 40e9},
        {"broker": "PD", "buy_val": 5e9, "sell_val": 30e9},
    ]
    res = BrokerForeignEngine.calculate_concentration_ratio(trades, top_n=3)
    assert "top3_buy_cr" in res
    assert res["top3_buy_cr"] > 0.70  # (50+30+20)/115 ~ 0.869
    assert res["top_buyers"] == ["AK", "BK", "ZP"]


def test_calculate_deep_bandarmologi():
    dates = pd.date_range("2026-08-01", periods=25, freq="D")
    df = pd.DataFrame({
        "open": np.linspace(1000, 1100, 25),
        "high": np.linspace(1020, 1120, 25),
        "low": np.linspace(990, 1090, 25),
        "close": np.linspace(1010, 1105, 25),
        "volume": [1_000_000] * 20 + [5_000_000] * 5
    }, index=dates)

    res = BrokerForeignEngine.calculate_deep_bandarmologi(df, window=10)
    assert "cr3_pct" in res
    assert "cr5_pct" in res
    assert "bandar_vwap" in res
    assert res["bandar_vwap"] > 0
    assert "distance_to_bandar_pct" in res
    assert "is_golden_entry" in res
    assert res["cr3_pct"] >= 20.0
    assert res["grade"] in ["BIG_ACCUMULATION", "NORMAL_ACCUMULATION", "NEUTRAL", "DISTRIBUTION"]
