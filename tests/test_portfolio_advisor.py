"""
Unit tests for PortfolioAdvisorEngine & Multi-Analysis Daily Recommendations.
"""

import pytest
from src.portfolio.portfolio_advisor import PortfolioAdvisorEngine
from src.data.universe import get_stock_info, is_stock_sharia


def test_seed_and_load_holdings():
    seeds = PortfolioAdvisorEngine.seed_default_holdings()
    assert len(seeds) >= 1
    holdings = PortfolioAdvisorEngine.load_holdings()
    assert len(holdings) == len(seeds)
    symbols = [h["symbol"] for h in holdings]
    assert any("JK" in s for s in symbols)


def test_full_portfolio_analysis():
    # Make sure we have holdings
    PortfolioAdvisorEngine.seed_default_holdings()
    result = PortfolioAdvisorEngine.get_full_portfolio_analysis()
    
    assert "summary" in result
    assert "holdings" in result
    assert "recommendation_summary" in result
    assert "sector_allocation" in result
    
    summary = result["summary"]
    assert summary["total_nav"] > 0
    assert summary["portfolio_health_score"] >= 0
    assert summary["portfolio_health_score"] <= 100
    assert len(result["holdings"]) >= 1

    for h in result["holdings"]:
        assert "symbol" in h
        assert "current_price" in h
        assert "floating_pnl_pct" in h
        assert "recommendation" in h
        rec = h["recommendation"]
        assert rec["action"] in ["HOLD", "TAKE_PROFIT", "TAKE_PROFIT_SOON", "ADD_LOT", "CUT_LOSS", "REDUCE"]
        assert len(rec["rationale"]) > 10
        assert "technical_indicators" in h
        assert "bandarmologi" in h
        assert "ai_score" in h


def test_add_and_sell_holding():
    # Test top-up modal first
    top_up_rec = PortfolioAdvisorEngine.execute_top_up(amount=15_000_000, notes="Test Top Up")
    assert top_up_rec["amount"] == 15_000_000

    # Test adding a temporary holding
    new_holding = PortfolioAdvisorEngine.add_holding(
        symbol="ASII.JK",
        entry_price=5000.0,
        shares_lot=20,
        target_tp1=5500.0,
        stop_loss=4750.0,
        notes="Test position"
    )
    assert new_holding["symbol"] == "ASII.JK"
    assert new_holding["shares_lot"] >= 20

    # Test selling partial
    closed = PortfolioAdvisorEngine.execute_sell(
        holding_id=new_holding["id"],
        exit_price=5200.0,
        shares_lot=10,
        reason="Partial profit take"
    )
    assert closed["symbol"] == "ASII.JK"
    assert closed["shares_lot"] == 10
    assert closed["realized_pnl_rp"] > 0

    # Clean up test holding
    PortfolioAdvisorEngine.delete_holding(new_holding["id"])
