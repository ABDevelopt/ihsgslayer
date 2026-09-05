"""
Unit tests for Pre-Trade Odds Maker & Mathematical Expected Value (EV) Engine.
"""

import pytest
from src.analytics.odds_maker import OddsMakerEngine


def test_odds_maker_calculation():
    odds = OddsMakerEngine.calculate_trade_odds(
        pattern="AREA_DEMAND",
        regime="BULLISH_TRENDING",
        tp_target_pct=8.0,
        sl_limit_pct=4.0,
        is_golden_entry=True,
        ai_score=82.0
    )

    assert "win_probability_pct" in odds
    assert odds["win_probability_pct"] >= 70.0
    assert "expected_value_pct" in odds
    assert odds["expected_value_pct"] > 0.0  # Positive expectancy
    assert "risk_reward_num" in odds
    assert odds["risk_reward_num"] == 2.0  # 8.0 / 4.0
    assert "half_kelly_max_allocation_pct" in odds
    assert odds["half_kelly_max_allocation_pct"] > 0
    assert odds["odds_grade"] in ["SUPERIOR_ALPHA", "STRONG_EDGE", "ACCEPTABLE"]
    assert odds["is_golden_entry_applied"] is True
