from datetime import date
from typing import List, Dict, Any, Optional
from collections import deque
import pandas as pd
from pydantic import BaseModel, Field

class TradeEntry(BaseModel):
    id: Optional[str] = None
    date: date
    symbol: str
    action: str  # "BUY" or "SELL"
    shares: int
    price: float
    fee: float = 0.0
    notes: Optional[str] = None

class JournalPosition(BaseModel):
    symbol: str
    total_shares: int
    avg_price: float
    cost_basis: float
    current_price: float
    market_value: float
    unrealized_pnl_amt: float
    unrealized_pnl_pct: float

class TradingJournalEngine:
    """
    Institutional FIFO Trading Journal & Unitized NAV Tracking Engine.
    """

    def __init__(self, initial_cash: float = 100_000_000.0, initial_nav_per_unit: float = 1000.0):
        self.cash = initial_cash
        self.initial_cash = initial_cash
        self.total_units = initial_cash / initial_nav_per_unit
        self.nav_per_unit = initial_nav_per_unit
        
        # FIFO inventory queue: symbol -> deque of {'shares': int, 'price': float, 'fee_per_share': float}
        self.inventory: Dict[str, deque] = {}
        self.closed_trades: List[Dict[str, Any]] = []
        self.trade_history: List[TradeEntry] = []

    def record_buy(self, trade: TradeEntry) -> Dict[str, Any]:
        """Record a BUY transaction into FIFO inventory."""
        total_cost = (trade.shares * trade.price) + trade.fee
        if total_cost > self.cash:
            raise ValueError(f"Insufficient cash (Rp {self.cash:,.2f}) for trade cost (Rp {total_cost:,.2f})")

        self.cash -= total_cost
        if trade.symbol not in self.inventory:
            self.inventory[trade.symbol] = deque()

        fee_per_share = trade.fee / trade.shares if trade.shares > 0 else 0.0
        self.inventory[trade.symbol].append({
            "shares": trade.shares,
            "price": trade.price,
            "cost_per_share": trade.price + fee_per_share,
            "entry_date": trade.date
        })
        self.trade_history.append(trade)

        return {"status": "SUCCESS", "action": "BUY", "symbol": trade.symbol, "remaining_cash": self.cash}

    def record_sell(self, trade: TradeEntry) -> Dict[str, Any]:
        """Record a SELL transaction, matching shares using First-In-First-Out (FIFO)."""
        if trade.symbol not in self.inventory:
            raise ValueError(f"No open position in {trade.symbol} to sell.")

        queue = self.inventory[trade.symbol]
        total_available = sum(lot['shares'] for lot in queue)
        if trade.shares > total_available:
            raise ValueError(f"Cannot sell {trade.shares} shares of {trade.symbol}. Only {total_available} available.")

        shares_to_sell = trade.shares
        total_fifo_cost = 0.0
        matched_lots = []

        while shares_to_sell > 0 and queue:
            first_lot = queue[0]
            if first_lot['shares'] <= shares_to_sell:
                # Consume whole lot
                lot_cost = first_lot['shares'] * first_lot['cost_per_share']
                total_fifo_cost += lot_cost
                shares_to_sell -= first_lot['shares']
                matched_lots.append(queue.popleft())
            else:
                # Partially consume lot
                lot_cost = shares_to_sell * first_lot['cost_per_share']
                total_fifo_cost += lot_cost
                first_lot['shares'] -= shares_to_sell
                shares_to_sell = 0

        gross_proceeds = trade.shares * trade.price
        net_proceeds = gross_proceeds - trade.fee
        realized_pnl_amt = net_proceeds - total_fifo_cost
        realized_pnl_pct = (realized_pnl_amt / total_fifo_cost) * 100.0 if total_fifo_cost > 0 else 0.0

        self.cash += net_proceeds
        if not queue:
            del self.inventory[trade.symbol]

        closed_record = {
            "symbol": trade.symbol,
            "exit_date": trade.date,
            "shares": trade.shares,
            "sell_price": trade.price,
            "net_proceeds": round(net_proceeds, 2),
            "fifo_cost": round(total_fifo_cost, 2),
            "realized_pnl_amt": round(realized_pnl_amt, 2),
            "realized_pnl_pct": round(realized_pnl_pct, 2)
        }
        self.closed_trades.append(closed_record)
        self.trade_history.append(trade)

        return closed_record

    def get_portfolio_valuation(self, current_market_prices: Dict[str, float]) -> Dict[str, Any]:
        """Compute mark-to-market positions, total portfolio equity, and unitized NAV."""
        positions: List[JournalPosition] = []
        positions_market_val = 0.0

        for symbol, lots in self.inventory.items():
            total_shares = sum(l['shares'] for l in lots)
            total_cost = sum(l['shares'] * l['cost_per_share'] for l in lots)
            avg_price = total_cost / total_shares if total_shares > 0 else 0.0
            
            cur_price = current_market_prices.get(symbol, avg_price)
            mkt_val = total_shares * cur_price
            unrealized_amt = mkt_val - total_cost
            unrealized_pct = (unrealized_amt / total_cost) * 100.0 if total_cost > 0 else 0.0

            positions_market_val += mkt_val
            positions.append(
                JournalPosition(
                    symbol=symbol,
                    total_shares=total_shares,
                    avg_price=round(avg_price, 2),
                    cost_basis=round(total_cost, 2),
                    current_price=round(cur_price, 2),
                    market_value=round(mkt_val, 2),
                    unrealized_pnl_amt=round(unrealized_amt, 2),
                    unrealized_pnl_pct=round(unrealized_pct, 2)
                )
            )

        total_portfolio_val = self.cash + positions_market_val
        self.nav_per_unit = total_portfolio_val / self.total_units if self.total_units > 0 else 1000.0

        return {
            "total_portfolio_value": round(total_portfolio_val, 2),
            "cash": round(self.cash, 2),
            "positions_value": round(positions_market_val, 2),
            "total_units": round(self.total_units, 4),
            "nav_per_unit": round(self.nav_per_unit, 4),
            "nav_return_pct": round(((self.nav_per_unit / 1000.0) - 1.0) * 100.0, 2),
            "open_positions": [p.model_dump() for p in positions],
            "closed_trades_count": len(self.closed_trades)
        }
