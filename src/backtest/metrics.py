from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from scipy import stats

class PerformanceMetrics:
    """
    Institutional Performance & Quantitative Factor Analytics Suite.
    Calculates Sharpe, Sortino, Calmar, MaxDD, Win Rate, Profit Factor,
    Rank IC (Information Coefficient), and Decile Spread.
    """

    RISK_FREE_RATE_ANNUAL = 0.06  # 6.0% Bank Indonesia (BI) Reference Rate

    @classmethod
    def calculate_trade_metrics(cls, trades: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate trade-level win rate, profit factor, expectancy, avg win/loss."""
        if not trades:
            return {
                "total_trades": 0,
                "win_rate_pct": 0.0,
                "profit_factor": 0.0,
                "avg_trade_pnl_pct": 0.0,
                "avg_win_pct": 0.0,
                "avg_loss_pct": 0.0,
                "max_win_pct": 0.0,
                "max_loss_pct": 0.0,
                "expectancy_pct": 0.0,
                "avg_holding_days": 0.0
            }

        df = pd.DataFrame(trades)
        total_trades = len(df)
        wins = df[df['pnl_pct'] > 0]
        losses = df[df['pnl_pct'] < 0]

        win_count = len(wins)
        loss_count = len(losses)
        win_rate = (win_count / total_trades) * 100.0 if total_trades > 0 else 0.0

        gross_profit = wins['pnl_amount'].sum() if not wins.empty else 0.0
        gross_loss = abs(losses['pnl_amount'].sum()) if not losses.empty else 0.0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (99.0 if gross_profit > 0 else 0.0)

        avg_win = wins['pnl_pct'].mean() if not wins.empty else 0.0
        avg_loss = losses['pnl_pct'].mean() if not losses.empty else 0.0

        # Expectancy: (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
        win_prob = win_rate / 100.0
        loss_prob = (loss_count / total_trades) if total_trades > 0 else 0.0
        expectancy = (win_prob * avg_win) - (loss_prob * abs(avg_loss))

        avg_holding = df['holding_days'].mean() if 'holding_days' in df.columns else 0.0

        return {
            "total_trades": total_trades,
            "win_rate_pct": round(float(win_rate), 2),
            "profit_factor": round(float(profit_factor), 2),
            "avg_trade_pnl_pct": round(float(df['pnl_pct'].mean()), 2),
            "avg_win_pct": round(float(avg_win), 2),
            "avg_loss_pct": round(float(avg_loss), 2),
            "max_win_pct": round(float(df['pnl_pct'].max()), 2),
            "max_loss_pct": round(float(df['pnl_pct'].min()), 2),
            "expectancy_pct": round(float(expectancy), 2),
            "avg_holding_days": round(float(avg_holding), 1)
        }

    @classmethod
    def calculate_equity_metrics(
        cls,
        equity_series: pd.Series,
        benchmark_series: Optional[pd.Series] = None,
        trading_days_per_year: int = 250
    ) -> Dict[str, Any]:
        """
        Calculate portfolio equity curve metrics (CAGR, Sharpe, Sortino, MaxDD, Calmar).
        """
        if equity_series.empty or len(equity_series) < 2:
            return {
                "total_return_pct": 0.0,
                "cagr_pct": 0.0,
                "annualized_volatility_pct": 0.0,
                "sharpe_ratio": 0.0,
                "sortino_ratio": 0.0,
                "max_drawdown_pct": 0.0,
                "calmar_ratio": 0.0,
                "alpha_pct": 0.0,
                "beta": 1.0
            }

        daily_returns = equity_series.pct_change().dropna()
        n_days = len(daily_returns)
        years = max(n_days / trading_days_per_year, 0.01)

        total_return = (equity_series.iloc[-1] / equity_series.iloc[0]) - 1.0
        cagr = ((1.0 + total_return) ** (1.0 / years)) - 1.0

        ann_vol = daily_returns.std() * np.sqrt(trading_days_per_year)
        rf_daily = (1.0 + cls.RISK_FREE_RATE_ANNUAL) ** (1.0 / trading_days_per_year) - 1.0

        # Sharpe Ratio (with zero-volatility guard)
        ret_std = daily_returns.std()
        excess_daily = daily_returns - rf_daily
        if ret_std < 1e-5 or daily_returns.abs().sum() < 1e-5:
            sharpe = 0.0
            sortino = 0.0
        else:
            sharpe = (excess_daily.mean() / (ret_std + 1e-6)) * np.sqrt(trading_days_per_year)
            downside = daily_returns[daily_returns < rf_daily]
            downside_std = downside.std() * np.sqrt(trading_days_per_year) if len(downside) > 1 else 0.0
            sortino = ((cagr - cls.RISK_FREE_RATE_ANNUAL) / (downside_std + 1e-6)) if downside_std > 1e-5 else (sharpe if sharpe > 0 else 0.0)

        # Max Drawdown
        running_max = equity_series.cummax()
        drawdowns = (equity_series - running_max) / running_max
        max_dd = abs(drawdowns.min())

        # Calmar Ratio
        calmar = (cagr / max_dd) if max_dd > 0 else 0.0

        # Benchmark comparison (Alpha & Beta)
        alpha = 0.0
        beta = 1.0
        if benchmark_series is not None and len(benchmark_series) == len(equity_series):
            bm_daily = benchmark_series.pct_change().dropna()
            bm_total = (benchmark_series.iloc[-1] / benchmark_series.iloc[0]) - 1.0
            bm_cagr = ((1.0 + bm_total) ** (1.0 / years)) - 1.0
            
            cov = np.cov(daily_returns, bm_daily)[0][1]
            var_bm = np.var(bm_daily)
            beta = (cov / var_bm) if var_bm > 0 else 1.0
            alpha = (cagr - cls.RISK_FREE_RATE_ANNUAL) - beta * (bm_cagr - cls.RISK_FREE_RATE_ANNUAL)

        return {
            "total_return_pct": round(float(total_return * 100.0), 2),
            "cagr_pct": round(float(cagr * 100.0), 2),
            "annualized_volatility_pct": round(float(ann_vol * 100.0), 2),
            "sharpe_ratio": round(float(sharpe), 2),
            "sortino_ratio": round(float(sortino), 2),
            "max_drawdown_pct": round(float(max_dd * 100.0), 2),
            "calmar_ratio": round(float(calmar), 2),
            "alpha_pct": round(float(alpha * 100.0), 2),
            "beta": round(float(beta), 2)
        }

    @staticmethod
    def calculate_rank_information_coefficient(
        scores: pd.Series,
        forward_returns: pd.Series
    ) -> float:
        """
        Calculate Spearman Rank Information Coefficient (Rank IC).
        Measures the predictive correlation between factor scores and future stock returns.
        """
        valid = pd.concat([scores, forward_returns], axis=1).dropna()
        if len(valid) < 5:
            return 0.0

        rho, _ = stats.spearmanr(valid.iloc[:, 0], valid.iloc[:, 1])
        return round(float(rho), 4) if not np.isnan(rho) else 0.0

    @staticmethod
    def calculate_decile_spread(
        scores: pd.Series,
        forward_returns: pd.Series,
        n_deciles: int = 10
    ) -> Dict[str, Any]:
        """
        Segment universe into deciles by score and compute top-to-bottom decile excess return.
        """
        valid = pd.DataFrame({"score": scores, "return": forward_returns}).dropna()
        if len(valid) < n_deciles * 2:
            return {"decile_spread_pct": 0.0, "deciles": {}}

        try:
            valid['decile'] = pd.qcut(valid['score'], q=n_deciles, labels=False, duplicates='drop') + 1
            decile_means = valid.groupby('decile')['return'].mean() * 100.0

            top_decile = decile_means.iloc[-1]
            bottom_decile = decile_means.iloc[0]
            spread = top_decile - bottom_decile

            return {
                "decile_spread_pct": round(float(spread), 2),
                "top_decile_avg_return_pct": round(float(top_decile), 2),
                "bottom_decile_avg_return_pct": round(float(bottom_decile), 2),
                "deciles": {f"D{k}": round(float(v), 2) for k, v in decile_means.items()}
            }
        except Exception:
            return {"decile_spread_pct": 0.0, "deciles": {}}

    @staticmethod
    def calculate_deflated_sharpe_ratio(
        daily_returns: pd.Series,
        num_trials: int = 10,
        benchmark_sharpe: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculate Deflated Sharpe Ratio (DSR) (Bailey & Lopez de Prado 2014).
        Statistically tests whether an observed Sharpe ratio is a true predictive alpha
        or a false positive resulting from multiple testing / overfitting.
        """
        valid_rets = daily_returns.dropna()
        n = len(valid_rets)
        if n < 30:
            return {"deflated_sharpe_prob": 0.50, "is_statistically_significant": False}

        mean_r = float(valid_rets.mean())
        std_r = float(valid_rets.std())
        if std_r <= 0:
            return {"deflated_sharpe_prob": 0.0, "is_statistically_significant": False}

        sr = (mean_r / std_r) * np.sqrt(250)
        skew = float(stats.skew(valid_rets))
        kurt = float(stats.kurtosis(valid_rets, fisher=False))  # Pearson kurtosis

        # Expected maximum Sharpe under null hypothesis of multiple trials
        euler_mascheroni = 0.5772156649
        z_approx = (1 - euler_mascheroni) * stats.norm.ppf(1 - 1.0 / num_trials) + euler_mascheroni * stats.norm.ppf(1 - 1.0 / (num_trials * np.e))
        expected_max_sr = max(0.0, float(z_approx)) * (1.0 / np.sqrt(250))

        # Standard error of Sharpe ratio under non-normality
        denom_sq = 1.0 - (skew * sr) + ((kurt - 1.0) / 4.0) * (sr ** 2)
        denom = np.sqrt(max(1e-6, denom_sq)) / np.sqrt(n - 1)

        t_stat = (sr - expected_max_sr) / (denom + 1e-6)
        dsr_prob = float(stats.norm.cdf(t_stat))

        return {
            "observed_sharpe": round(float(sr), 2),
            "deflated_sharpe_prob": round(float(dsr_prob), 4),
            "is_statistically_significant": bool(dsr_prob >= 0.95),
            "skewness": round(float(skew), 2),
            "kurtosis": round(float(kurt), 2),
            "trials_adjusted": num_trials
        }

    @staticmethod
    def calculate_consecutive_stats(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate max consecutive wins and losses from trade list."""
        if not trades:
            return {"max_consecutive_wins": 0, "max_consecutive_losses": 0, "current_streak": 0}

        max_wins = max_losses = cur_wins = cur_losses = 0
        for t in trades:
            if t.get("pnl_pct", 0) > 0:
                cur_wins += 1
                cur_losses = 0
                max_wins = max(max_wins, cur_wins)
            elif t.get("pnl_pct", 0) < 0:
                cur_losses += 1
                cur_wins = 0
                max_losses = max(max_losses, cur_losses)
            else:
                cur_wins = cur_losses = 0

        last = trades[-1].get("pnl_pct", 0)
        current_streak = cur_wins if last > 0 else (-cur_losses if last < 0 else 0)
        return {
            "max_consecutive_wins": int(max_wins),
            "max_consecutive_losses": int(max_losses),
            "current_streak": int(current_streak)
        }

    @staticmethod
    def calculate_monthly_returns_heatmap(equity_curve: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compute a month-by-year return matrix from the equity curve for heatmap rendering.
        Returns matrix rows with year + 12 month columns.
        """
        if not equity_curve:
            return {"years": [], "matrix": [], "flat": []}
        try:
            df = pd.DataFrame(equity_curve)
            df['date'] = pd.to_datetime(df['date'])
            df = df.set_index('date').sort_index()
            monthly = df['portfolio_value'].resample('ME').last().pct_change().dropna() * 100.0

            flat = []
            for dt, val in monthly.items():
                flat.append({
                    "year": int(dt.year),
                    "month": int(dt.month),
                    "return_pct": round(float(val), 2)
                })

            years = sorted(list(set(r["year"] for r in flat)))
            month_names = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
            matrix = []
            for yr in years:
                row: Dict[str, Any] = {"year": yr}
                for i, mn in enumerate(month_names, 1):
                    match = next((r for r in flat if r["year"] == yr and r["month"] == i), None)
                    row[mn] = match["return_pct"] if match else None
                matrix.append(row)

            return {"years": years, "month_names": month_names, "matrix": matrix, "flat": flat}
        except Exception as e:
            return {"years": [], "matrix": [], "flat": [], "error": str(e)}

    @staticmethod
    def calculate_drawdown_periods(equity_curve: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify and describe individual drawdown periods (underwater episodes).
        Returns list sorted by severity (worst first).
        """
        if len(equity_curve) < 2:
            return []
        try:
            df = pd.DataFrame(equity_curve)
            df['date'] = pd.to_datetime(df['date'])
            vals = df['portfolio_value'].values
            dates = df['date'].values

            running_max = np.maximum.accumulate(vals)
            dds = (vals - running_max) / running_max

            periods = []
            in_dd = False
            dd_start_idx = 0
            for i, dd in enumerate(dds):
                if not in_dd and dd < -0.001:
                    in_dd = True
                    dd_start_idx = i
                elif in_dd and dd >= -0.001:
                    period_dd = float(np.min(dds[dd_start_idx:i]))
                    trough_idx = dd_start_idx + int(np.argmin(dds[dd_start_idx:i]))
                    duration_days = int((dates[i] - dates[dd_start_idx]) / np.timedelta64(1, 'D'))
                    periods.append({
                        "start_date": str(pd.Timestamp(dates[dd_start_idx]).date()),
                        "end_date": str(pd.Timestamp(dates[i]).date()),
                        "trough_date": str(pd.Timestamp(dates[trough_idx]).date()),
                        "max_drawdown_pct": round(float(period_dd * 100), 2),
                        "duration_days": duration_days,
                        "recovery_days": int((dates[i] - dates[trough_idx]) / np.timedelta64(1, 'D'))
                    })
                    in_dd = False

            if in_dd:
                period_dd = float(np.min(dds[dd_start_idx:]))
                trough_idx = dd_start_idx + int(np.argmin(dds[dd_start_idx:]))
                duration_days = int((dates[-1] - dates[dd_start_idx]) / np.timedelta64(1, 'D'))
                periods.append({
                    "start_date": str(pd.Timestamp(dates[dd_start_idx]).date()),
                    "end_date": None,
                    "trough_date": str(pd.Timestamp(dates[trough_idx]).date()),
                    "max_drawdown_pct": round(float(period_dd * 100), 2),
                    "duration_days": duration_days,
                    "recovery_days": None
                })

            return sorted(periods, key=lambda x: x["max_drawdown_pct"])
        except Exception:
            return []
