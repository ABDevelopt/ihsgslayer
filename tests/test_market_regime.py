"""
Unit tests for Market Regime Classifier & Macro Adaptation Engine.
"""

import pytest
from src.analytics.market_regime import MarketRegimeEngine


def test_market_regime_classification():
    regime_data = MarketRegimeEngine.get_current_regime()
    assert "regime" in regime_data
    assert regime_data["regime"] in [
        "BULLISH_TRENDING",
        "SIDEWAYS_CHOPPY",
        "BEARISH_DEFENSIVE",
        "HIGH_VOLATILITY_PANIC"
    ]
    assert "confidence_pct" in regime_data
    assert regime_data["confidence_pct"] >= 50.0
    assert "ihsg_metrics" in regime_data
    metrics = regime_data["ihsg_metrics"]
    assert "price" in metrics
    assert "ma20" in metrics
    assert "ma50" in metrics
    assert "atr_pct" in metrics
    assert "strategy_weights" in regime_data
    assert "recommended_cash_pct" in regime_data
    assert "primary_strategies" in regime_data
    assert len(regime_data["primary_strategies"]) >= 2
