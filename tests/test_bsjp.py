import pytest
from datetime import date, timedelta
import pandas as pd
import numpy as np
from src.analytics.bsjp import BSJPEngine

def _create_bsjp_test_df(
    gain_pct: float = 6.0,
    close_at_high: bool = True,
    vol_mult: float = 2.5
) -> pd.DataFrame:
    dates = [date(2026, 1, 1) + timedelta(days=i) for i in range(30)]
    records = []
    base_p = 1000.0
    for i, dt in enumerate(dates[:-1]):
        records.append({
            "symbol": "TEST.JK",
            "date": dt,
            "open": base_p,
            "high": base_p + 10.0,
            "low": base_p - 10.0,
            "close": base_p,
            "volume": 3_000_000,
            "value": base_p * 3_000_000
        })

    # Last bar (Today's late session)
    prev_close = base_p
    today_close = prev_close * (1.0 + (gain_pct / 100.0))
    today_open = prev_close * 1.01
    today_low = prev_close * 0.995
    today_high = today_close if close_at_high else today_close * 1.08  # if false, long upper shadow

    records.append({
        "symbol": "TEST.JK",
        "date": dates[-1],
        "open": today_open,
        "high": today_high,
        "low": today_low,
        "close": today_close,
        "volume": int(3_000_000 * vol_mult),
        "value": today_close * int(3_000_000 * vol_mult)
    })

    return pd.DataFrame(records)

def test_bsjp_ideal_candidate():
    df = _create_bsjp_test_df(gain_pct=5.5, close_at_high=True, vol_mult=2.8)
    cand = BSJPEngine.evaluate_bsjp_candidate(df, symbol="TEST.JK", name="Test Tbk", sector="Financials")

    assert cand is not None
    assert cand.bsjp_score >= 60.0
    assert cand.gap_up_probability in ["HIGH", "MODERATE"]
    assert cand.target_sell_morning_min > cand.close_price
    assert cand.stop_loss_morning < cand.close_price
    assert len(cand.reasons) > 0

def test_bsjp_reject_upper_shadow_rejection():
    # Large upper shadow (closed far below high) -> Should be rejected
    df = _create_bsjp_test_df(gain_pct=4.0, close_at_high=False, vol_mult=2.0)
    cand = BSJPEngine.evaluate_bsjp_candidate(df, symbol="TEST.JK", name="Test Tbk", sector="Financials")

    # Rejected due to low close-to-high ratio (<70%)
    assert cand is None

def test_bsjp_reject_low_volume():
    # Volume multiplier only 0.8x -> Rejected
    df = _create_bsjp_test_df(gain_pct=5.0, close_at_high=True, vol_mult=0.8)
    cand = BSJPEngine.evaluate_bsjp_candidate(df, symbol="TEST.JK", name="Test Tbk", sector="Financials")

    assert cand is None
