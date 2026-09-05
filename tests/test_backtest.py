import pytest
from datetime import date, timedelta
import pandas as pd
import numpy as np
from src.backtest.engine import BacktestEngine, BacktestConfig
from src.backtest.metrics import PerformanceMetrics

def test_performance_metrics_calculation():
    # Synthetic equity curve: Rp 100M -> Rp 125M over 250 days
    dates = [date(2026, 1, 1) + timedelta(days=i) for i in range(250)]
    growth = np.linspace(100_000_000.0, 125_000_000.0, 250)
    # Add slight fluctuations
    fluctuations = np.sin(np.linspace(0, 10, 250)) * 1_000_000.0
    equity_series = pd.Series(growth + fluctuations, index=dates)

    metrics = PerformanceMetrics.calculate_equity_metrics(equity_series)
    assert metrics["total_return_pct"] > 20.0
    assert metrics["cagr_pct"] > 20.0
    assert metrics["sharpe_ratio"] > 0.5
    assert metrics["max_drawdown_pct"] < 10.0

def test_rank_ic_and_decile_spread():
    np.random.seed(42)
    # 50 stocks with strong positive correlation between score and future return
    scores = pd.Series(np.random.uniform(20, 95, 50))
    forward_returns = (scores * 0.002) + np.random.normal(0, 0.02, 50)

    rank_ic = PerformanceMetrics.calculate_rank_information_coefficient(scores, forward_returns)
    assert rank_ic > 0.3  # Positive predictive power

    deciles = PerformanceMetrics.calculate_decile_spread(scores, forward_returns, n_deciles=5)
    assert deciles["decile_spread_pct"] > 0.0

def test_backtest_engine_execution():
    dates = [date(2026, 1, 1) + timedelta(days=i) for i in range(100)]
    
    # Stock A rallies strongly
    stock_a = pd.DataFrame({
        "symbol": ["A.JK"] * 100,
        "date": dates,
        "open": np.linspace(1000, 1400, 100),
        "high": np.linspace(1010, 1420, 100),
        "low": np.linspace(990, 1390, 100),
        "close": np.linspace(1005, 1410, 100),
        "volume": [100_000] * 100,
        "ai_score": [85.0] * 100,
        "active_patterns": [["AREA_DEMAND"] if i == 0 else [] for i in range(100)]
    })

    universe = {"A.JK": stock_a}
    config = BacktestConfig(
        initial_capital=100_000_000.0,
        min_ai_score=75.0,
        take_profit_pct=0.15,
        stop_loss_pct=0.05,
        max_holding_days=60
    )

    engine = BacktestEngine(config)
    res = engine.run_backtest(universe)

    assert "trade_metrics" in res
    assert "equity_metrics" in res
    assert len(res["closed_trades"]) >= 1
    # Trade should hit take profit because price rallied 40%
    first_trade = res["closed_trades"][0]
    assert first_trade["pnl_pct"] > 10.0
    assert first_trade["exit_reason"] == "TAKE_PROFIT"
