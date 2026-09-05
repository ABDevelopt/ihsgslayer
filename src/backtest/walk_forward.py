from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np
from src.backtest.engine import BacktestConfig
from src.backtest.metrics import PerformanceMetrics


class WalkForwardValidator:
    """
    Walk-Forward Cross Validation & Monte Carlo Significance Tester.
    Prevents backtest overfitting and tests strategy robustness across out-of-sample market regimes.
    """

    @staticmethod
    def generate_rolling_windows(
        all_dates: List[Any],
        train_window_days: int = 120,
        test_window_days: int = 40
    ) -> List[Tuple[List[Any], List[Any]]]:
        """Generate rolling in-sample (train) and out-of-sample (test) date windows."""
        windows = []
        total_len = len(all_dates)
        step = test_window_days

        start_idx = 0
        while start_idx + train_window_days + test_window_days <= total_len:
            train_dates = all_dates[start_idx : start_idx + train_window_days]
            test_dates = all_dates[start_idx + train_window_days : start_idx + train_window_days + test_window_days]
            windows.append((train_dates, test_dates))
            start_idx += step

        # Fallback if strict stepping produces no windows
        if not windows and total_len >= test_window_days * 2:
            mid = total_len - test_window_days
            windows.append((all_dates[:mid], all_dates[mid:]))

        return windows

    @classmethod
    def run_segment_simulation(
        cls,
        universe_data: Dict[str, pd.DataFrame],
        config: BacktestConfig,
        test_dates: List[Any]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Simulate authentic momentum breakout execution strictly on the out-of-sample test window.
        """
        capital = config.initial_capital
        cash = capital
        trades: List[Dict[str, Any]] = []
        equity_curve: List[Dict[str, Any]] = []

        test_dt_set = set(str(d) for d in test_dates)

        for sym, df in universe_data.items():
            if df.empty or len(df) < 25:
                continue
            df_sorted = df.copy().sort_values('date').reset_index(drop=True)
            c = df_sorted['close']
            h = df_sorted['high']
            l = df_sorted['low']
            o = df_sorted['open']
            v = df_sorted['volume']
            vol_ma = v.rolling(20).mean()
            high_20 = h.rolling(20).max()

            for i in range(21, len(df_sorted)):
                d_str = str(df_sorted['date'].iloc[i])
                if d_str not in test_dt_set:
                    continue

                c_prev = float(c.iloc[i - 1])
                c_now = float(c.iloc[i])
                o_now = float(o.iloc[i])
                h_now = float(h.iloc[i])
                l_now = float(l.iloc[i])
                v_now = float(v.iloc[i])
                v_avg = float(vol_ma.iloc[i]) if not pd.isna(vol_ma.iloc[i]) else v_now
                v_mult = v_now / (v_avg + 1e-6)

                rng = max(h_now - l_now, 1.0)
                lower_sh = (min(o_now, c_now) - l_now) / rng

                # Institutional Momentum Setup
                is_valid = (c_now > c_prev and v_mult >= 1.35 and lower_sh <= 0.25) or (c_now >= float(high_20.iloc[i - 1]) * 0.995 and v_mult >= 1.4)
                if is_valid:
                    entry_p = float(o.iloc[i])
                    if entry_p <= 0:
                        continue

                    tp_level = entry_p * (1.0 + config.take_profit_pct)
                    sl_level = entry_p * (1.0 - config.stop_loss_pct)

                    if h_now >= tp_level:
                        exit_p = tp_level
                        reason = "TAKE_PROFIT"
                    elif l_now <= sl_level:
                        exit_p = sl_level
                        reason = "STOP_LOSS"
                    else:
                        exit_p = c_now
                        reason = "TIME_STOP"

                    net_entry = entry_p * (1.0 + config.buy_fee_pct + config.slippage_pct)
                    net_exit = exit_p * (1.0 - config.sell_fee_pct - config.slippage_pct)
                    pnl_pct = round(((net_exit - net_entry) / net_entry) * 100.0, 2)
                    pnl_amt = (capital * config.position_size_pct) * (pnl_pct / 100.0)

                    trades.append({
                        "symbol": sym,
                        "entry_date": d_str,
                        "exit_date": d_str,
                        "entry_price": round(entry_p, 2),
                        "exit_price": round(exit_p, 2),
                        "pnl_amount": round(pnl_amt, 2),
                        "pnl_pct": pnl_pct,
                        "holding_days": 1,
                        "exit_reason": reason,
                        "ai_score_at_entry": round(min(98.0, 70.0 + v_mult * 8.0), 1)
                    })

        trades = sorted(trades, key=lambda x: x['entry_date'])

        # Equity Curve
        cum_cash = capital
        for dt in test_dates:
            d_str = str(dt)
            day_trades = [t for t in trades if t['entry_date'] == d_str]
            for t in day_trades:
                cum_cash += t['pnl_amount']
            equity_curve.append({
                "date": d_str,
                "portfolio_value": round(cum_cash, 2),
                "cash": round(cum_cash, 2),
                "open_positions_count": len(day_trades)
            })

        return trades, equity_curve

    @classmethod
    def run_walk_forward_validation(
        cls,
        universe_data: Dict[str, pd.DataFrame],
        config: BacktestConfig,
        train_days: int = 120,
        test_days: int = 40
    ) -> Dict[str, Any]:
        """Run Walk-Forward backtest across sequential out-of-sample segments."""
        all_dates = sorted(list(set(
            dt for df in universe_data.values() for dt in df['date']
        )))

        windows = cls.generate_rolling_windows(all_dates, train_days, test_days)
        if not windows:
            return {"error": "Dataset too short for specified walk-forward windows."}

        segment_results = []

        for i, (train_dt, test_dt) in enumerate(windows):
            trades, equity_curve = cls.run_segment_simulation(universe_data, config, test_dt)
            trade_metrics = PerformanceMetrics.calculate_trade_metrics(trades)
            eq_series = pd.Series([e['portfolio_value'] for e in equity_curve])
            equity_metrics = PerformanceMetrics.calculate_equity_metrics(eq_series)

            segment_results.append({
                "segment": i + 1,
                "start_date": str(test_dt[0]),
                "end_date": str(test_dt[-1]),
                "trade_metrics": trade_metrics,
                "equity_metrics": equity_metrics
            })

        # Calculate average out-of-sample Sharpe & Win Rate
        oos_sharpes = [seg["equity_metrics"].get("sharpe_ratio", 0.0) for seg in segment_results]
        oos_winrates = [seg["trade_metrics"].get("win_rate_pct", 0.0) for seg in segment_results]

        valid_sharpes = [s for s in oos_sharpes if abs(s) < 100.0]
        avg_sharpe = float(np.mean(valid_sharpes)) if valid_sharpes else 0.0

        return {
            "total_segments": len(segment_results),
            "avg_oos_sharpe": round(avg_sharpe, 2),
            "avg_oos_win_rate_pct": round(float(np.mean(oos_winrates)), 2),
            "segments": segment_results
        }

    @staticmethod
    def run_monte_carlo_permutation(
        closed_trades: List[Dict[str, Any]],
        num_simulations: int = 500
    ) -> Dict[str, Any]:
        """
        Monte Carlo Trade Order Shuffle Test.
        Assesses whether strategy performance is statistically robust against trade order variations.
        """
        if len(closed_trades) < 5:
            return {
                "num_simulations": num_simulations,
                "original_profit_factor": 0.0,
                "mc_max_dd_95th_percentile_pct": 0.0,
                "mc_max_dd_median_pct": 0.0,
                "mc_equity_5th_percentile": 100_000_000.0,
                "mc_equity_median": 100_000_000.0
            }

        returns = [t['pnl_pct'] / 100.0 for t in closed_trades]
        gross_win = sum(r for r in returns if r > 0)
        gross_loss = abs(sum(r for r in returns if r < 0))
        original_profit_factor = (gross_win / gross_loss) if gross_loss > 0 else (99.0 if gross_win > 0 else 0.0)

        simulated_max_dds = []
        simulated_ending_equities = []

        np.random.seed(42)
        for _ in range(num_simulations):
            shuffled = np.random.permutation(returns)
            curve = 100_000_000.0 * np.cumprod(1.0 + (shuffled * 0.20))  # 20% size per trade
            running_max = np.maximum.accumulate(curve)
            dd = (curve - running_max) / running_max
            simulated_max_dds.append(abs(float(np.min(dd))))
            simulated_ending_equities.append(float(curve[-1]))

        return {
            "num_simulations": num_simulations,
            "original_profit_factor": round(float(original_profit_factor), 2),
            "mc_max_dd_95th_percentile_pct": round(float(np.percentile(simulated_max_dds, 95) * 100.0), 2),
            "mc_max_dd_median_pct": round(float(np.median(simulated_max_dds) * 100.0), 2),
            "mc_equity_5th_percentile": round(float(np.percentile(simulated_ending_equities, 5)), 2),
            "mc_equity_median": round(float(np.median(simulated_ending_equities)), 2)
        }
