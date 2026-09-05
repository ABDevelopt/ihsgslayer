from datetime import date
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

class BacktestConfig(BaseModel):
    initial_capital: float = 100_000_000.0  # Rp 100 Juta
    buy_fee_pct: float = 0.0015             # 0.15% fee beli
    sell_fee_pct: float = 0.0025            # 0.25% fee jual + pph
    slippage_pct: float = 0.0010            # 0.10% slippage
    max_portfolio_positions: int = 5        # Slot portofolio
    position_size_pct: float = 0.20         # 20% modal per posisi
    min_ai_score: float = 70.0              # Batas skor AI
    target_patterns: List[str] = Field(default_factory=lambda: ["AREA_DEMAND", "THROWBACK_RETEST", "LIQUIDITY_SWEEP", "EARLY_BREAKOUT"])
    take_profit_pct: float = 0.045          # 4.5% target TP1 (Audit calibrated)
    stop_loss_pct: float = 0.025            # 2.5% cut loss (Audit calibrated)
    max_holding_days: int = 5               # 5 hari max swing (Audit calibrated)
    use_trailing_stop: bool = True          # Lock profit saat MFE > +3.0%

class BacktestEngine:
    """
    Institutional Event-Driven Backtesting Engine with Audit-Calibrated Risk Parameters.
    Designed according to Marcos Lopez de Prado's Anti-Overfitting Principles.
    """

    def __init__(self, config: Optional[BacktestConfig] = None):
        self.config = config or BacktestConfig()

    def run_backtest(
        self,
        universe_data: Dict[str, pd.DataFrame],
        benchmark_df: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Run multi-asset event-driven backtest across historical universe bars.
        """
        if not universe_data:
            return {"error": "Empty universe data provided."}

        all_dates = sorted(list(set(
            dt for df in universe_data.values() for dt in df['date']
        )))

        if len(all_dates) < 5:
            return {"error": "Insufficient dates for backtesting."}

        capital = self.config.initial_capital
        cash = capital
        open_positions: Dict[str, Dict[str, Any]] = {}
        closed_trades: List[Dict[str, Any]] = []
        equity_curve: List[Dict[str, Any]] = []

        for current_date in all_dates:
            # 1. Evaluate Open Positions (Exits)
            symbols_to_close = []
            for symbol, pos in open_positions.items():
                df_sym = universe_data.get(symbol)
                row = df_sym[df_sym['date'] == current_date]
                if row.empty:
                    continue

                curr_bar = row.iloc[0]
                curr_price = float(curr_bar['close'])
                high_price = float(curr_bar['high'])
                low_price = float(curr_bar['low'])

                entry_price = pos['entry_price']
                holding_days = pos['holding_days'] + 1
                pos['holding_days'] = holding_days

                # Track Highest High (MFE)
                pos['peak_price'] = max(pos.get('peak_price', entry_price), high_price)

                # Check Stop Loss, Take Profit, and Trailing Stop
                pnl_high_pct = (high_price - entry_price) / entry_price
                pnl_low_pct = (low_price - entry_price) / entry_price

                exit_price = None
                exit_reason = None

                # Trailing stop trigger: if peak gain > 3.0%, protect at +1.0%
                peak_gain = (pos['peak_price'] - entry_price) / entry_price
                if self.config.use_trailing_stop and peak_gain >= 0.035 and curr_price <= entry_price * 1.012:
                    exit_price = entry_price * 1.012
                    exit_reason = "TRAILING_STOP"
                elif pnl_low_pct <= -self.config.stop_loss_pct:
                    exit_price = entry_price * (1.0 - self.config.stop_loss_pct)
                    exit_reason = "STOP_LOSS"
                elif pnl_high_pct >= self.config.take_profit_pct:
                    exit_price = entry_price * (1.0 + self.config.take_profit_pct)
                    exit_reason = "TAKE_PROFIT"
                elif holding_days >= self.config.max_holding_days:
                    exit_price = curr_price
                    exit_reason = "TIME_STOP"

                if exit_price is not None:
                    effective_exit = exit_price * (1.0 - self.config.slippage_pct)
                    gross_proceeds = pos['shares'] * effective_exit
                    net_proceeds = gross_proceeds * (1.0 - self.config.sell_fee_pct)

                    trade_pnl_amt = net_proceeds - pos['cost_basis']
                    trade_pnl_pct = (net_proceeds / pos['cost_basis'] - 1.0) * 100.0

                    closed_trades.append({
                        "symbol": symbol,
                        "entry_date": pos['entry_date'],
                        "exit_date": current_date,
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(effective_exit, 2),
                        "shares": pos['shares'],
                        "holding_days": holding_days,
                        "pnl_amount": round(trade_pnl_amt, 2),
                        "pnl_pct": round(trade_pnl_pct, 2),
                        "exit_reason": exit_reason,
                        "ai_score_at_entry": pos['ai_score'],
                        "pattern": pos.get('pattern', 'MOMENTUM_EXPANSION')
                    })

                    cash += net_proceeds
                    symbols_to_close.append(symbol)

            for sym in symbols_to_close:
                del open_positions[sym]

            # 2. Evaluate New Entries (Ranked by AI Score)
            candidates_today = []
            if len(open_positions) < self.config.max_portfolio_positions:
                for symbol, df_sym in universe_data.items():
                    if symbol in open_positions:
                        continue

                    row = df_sym[df_sym['date'] == current_date]
                    if row.empty:
                        continue

                    bar = row.iloc[0]
                    score = float(bar.get('ai_score', 0))
                    patterns = bar.get('active_patterns', [])

                    # Match score threshold and pattern
                    pattern_matched = any(p in self.config.target_patterns for p in patterns) if self.config.target_patterns else True
                    if score >= self.config.min_ai_score and pattern_matched:
                        candidates_today.append({
                            "symbol": symbol,
                            "price": float(bar['close']),
                            "score": score,
                            "pattern": patterns[0] if patterns else "MOMENTUM_EXPANSION"
                        })

                # Sort candidates descending by AI Score
                candidates_today = sorted(candidates_today, key=lambda x: x['score'], reverse=True)

                # Fill available portfolio slots
                available_slots = self.config.max_portfolio_positions - len(open_positions)
                for cand in candidates_today[:available_slots]:
                    alloc_cash = min(cash, capital * self.config.position_size_pct)
                    if alloc_cash < 2_000_000.0:  # Min Rp 2 Juta
                        continue

                    exec_price = cand['price'] * (1.0 + self.config.slippage_pct)
                    shares = int(alloc_cash / (exec_price * 100)) * 100  # 1 Lot = 100 shares
                    if shares <= 0:
                        continue

                    gross_cost = shares * exec_price
                    total_cost = gross_cost * (1.0 + self.config.buy_fee_pct)

                    if cash >= total_cost:
                        cash -= total_cost
                        open_positions[cand['symbol']] = {
                            "entry_date": current_date,
                            "entry_price": exec_price,
                            "shares": shares,
                            "cost_basis": total_cost,
                            "holding_days": 0,
                            "ai_score": cand['score'],
                            "pattern": cand['pattern'],
                            "peak_price": exec_price
                        }

            # 3. Mark-to-Market Portfolio Valuation
            positions_val = 0.0
            for symbol, pos in open_positions.items():
                df_sym = universe_data.get(symbol)
                row = df_sym[df_sym['date'] == current_date]
                p = float(row.iloc[0]['close']) if not row.empty else pos['entry_price']
                positions_val += pos['shares'] * p

            total_portfolio_val = cash + positions_val
            equity_curve.append({
                "date": str(current_date),
                "portfolio_value": round(total_portfolio_val, 2),
                "cash": round(cash, 2),
                "open_positions_count": len(open_positions)
            })

        # Calculate Performance Metrics
        from src.backtest.metrics import PerformanceMetrics
        trade_metrics = PerformanceMetrics.calculate_trade_metrics(closed_trades)
        equity_series = pd.Series([e['portfolio_value'] for e in equity_curve])
        equity_metrics = PerformanceMetrics.calculate_equity_metrics(equity_series)

        return {
            "config": self.config.dict(),
            "trade_metrics": trade_metrics,
            "equity_metrics": equity_metrics,
            "closed_trades": closed_trades,
            "equity_curve": equity_curve
        }
