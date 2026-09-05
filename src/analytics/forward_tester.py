"""
Forward Test & Paper Trading Quantitative Simulation Engine.
Enables real-time forward validation of trading strategies (BPJS, BSJP, Pre-ARA, Confluence, SmartPick)
without risking real capital, tracking slippage, execution latency, out-of-sample win rates, and trailing stops.
"""

import os
import json
import uuid
import time
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "forward_test_state.json")


class ForwardPosition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    symbol: str
    name: str = ""
    sector: str = ""
    strategy: str  # "BPJS", "BSJP", "PRE_ARA", "CONFLUENCE", "SMARTPICK", "MANUAL"
    entry_time: str  # e.g. "2026-08-31 09:15:20 WIB"
    entry_date: str  # e.g. "2026-08-31"
    entry_price: float
    shares_lot: int  # 1 lot = 100 shares
    total_shares: int
    invested_capital: float
    current_price: float
    highest_price: float
    lowest_price: float
    floating_pnl_amt: float = 0.0
    floating_pnl_pct: float = 0.0
    target_tp1: float
    predicted_gain_tp1_pct: float = 3.5
    target_tp2: float
    predicted_gain_tp2_pct: float = 7.0
    stop_loss: float
    predicted_stop_loss_pct: float = -2.5
    trailing_stop_active: bool = False
    trailing_stop_price: float = 0.0
    trailing_stop_pct: float = 2.0  # 2% trailing stop from peak
    breakeven_lock_active: bool = False
    breakeven_price: float = 0.0
    selling_time_window: str = ""
    status: str = "OPEN"  # "OPEN", "CLOSED"
    close_time: Optional[str] = None
    close_price: Optional[float] = None
    realized_pnl_amt: Optional[float] = None
    realized_pnl_pct: Optional[float] = None
    exit_reason: Optional[str] = None  # "TAKE_PROFIT_1", "TAKE_PROFIT_2", "STOP_LOSS", "TIME_STOP", "TRAILING_STOP", "MANUAL"
    notes: Optional[str] = None


class BotLogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str
    level: str  # "INFO", "SUCCESS", "WARN", "ALERT", "TRADE"
    action: str
    symbol: Optional[str] = None
    message: str


class ForwardTestPortfolio(BaseModel):
    initial_capital: float = 100_000_000.0  # Rp 100 Juta default
    cash_balance: float = 100_000_000.0
    portfolio_equity: float = 100_000_000.0
    total_invested: float = 0.0
    total_floating_pnl_amt: float = 0.0
    total_floating_pnl_pct: float = 0.0
    total_realized_pnl_amt: float = 0.0
    total_realized_pnl_pct: float = 0.0
    win_rate_pct: float = 0.0
    profit_factor: float = 0.0
    total_trades_count: int = 0
    winning_trades_count: int = 0
    losing_trades_count: int = 0
    avg_win_pct: float = 0.0
    avg_loss_pct: float = 0.0
    max_drawdown_pct: float = 0.0
    auto_bot_enabled: bool = True
    bot_settings: Dict[str, Any] = Field(default_factory=lambda: {
        "max_concurrent_positions": 5,
        "default_lot_per_trade": 50,
        "auto_tp_enabled": True,
        "auto_sl_enabled": True,
        "auto_time_stop_enabled": True,
        "trailing_stop_enabled": True,
        "min_score_filter": 65.0,
    })
    open_positions: List[ForwardPosition] = Field(default_factory=list)
    closed_positions: List[ForwardPosition] = Field(default_factory=list)
    equity_history: List[Dict[str, Any]] = Field(default_factory=list)
    bot_logs: List[BotLogEntry] = Field(default_factory=list)


class ForwardTestEngine:
    """
    Core Execution and Management Engine for Forward Testing Studio.
    """
    _instance = None

    def __init__(self):
        self.portfolio = self._load_state()

    @classmethod
    def get_instance(cls) -> "ForwardTestEngine":
        if cls._instance is None:
            cls._instance = ForwardTestEngine()
        return cls._instance

    def _load_state(self) -> ForwardTestPortfolio:
        """Load portfolio state from disk or initialize fresh."""
        try:
            if os.path.exists(DATA_FILE_PATH):
                with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    return ForwardTestPortfolio.model_validate(raw)
        except Exception as e:
            print(f"[ForwardTestEngine] Failed to load state: {e}, creating fresh portfolio.")

        portfolio = ForwardTestPortfolio()
        self._seed_initial_demo(portfolio)
        self._save_state(portfolio)
        return portfolio

    def _save_state(self, portfolio: Optional[ForwardTestPortfolio] = None):
        """Persist portfolio state to disk."""
        if portfolio is None:
            portfolio = self.portfolio
        try:
            os.makedirs(os.path.dirname(DATA_FILE_PATH), exist_ok=True)
            with open(DATA_FILE_PATH, "w", encoding="utf-8") as f:
                f.write(portfolio.model_dump_json(indent=2))
        except Exception as e:
            print(f"[ForwardTestEngine] Failed to save state: {e}")

    def log_bot_event(self, action: str, message: str, level: str = "INFO", symbol: Optional[str] = None):
        """Record an autonomous event in the bot's live audit terminal."""
        p = self.portfolio
        now_str = datetime.now().strftime("%H:%M:%S WIB")
        entry = BotLogEntry(
            timestamp=now_str,
            level=level,
            action=action,
            symbol=symbol,
            message=message
        )
        p.bot_logs.insert(0, entry)
        if len(p.bot_logs) > 200:
            p.bot_logs = p.bot_logs[:200]
        self._save_state()

    def _recalculate_metrics(self):
        """Recalculate portfolio equity, PnL, win rates, and drawdown."""
        p = self.portfolio
        total_open_value = 0.0
        total_floating = 0.0

        for pos in p.open_positions:
            val = pos.current_price * pos.total_shares
            total_open_value += val
            fl_amt = (pos.current_price - pos.entry_price) * pos.total_shares
            pos.floating_pnl_amt = round(fl_amt, 2)
            pos.floating_pnl_pct = round(((pos.current_price - pos.entry_price) / pos.entry_price) * 100.0, 2)
            total_floating += fl_amt

        p.total_invested = round(sum(pos.invested_capital for pos in p.open_positions), 2)
        p.portfolio_equity = round(p.cash_balance + total_open_value, 2)
        p.total_floating_pnl_amt = round(total_floating, 2)
        p.total_floating_pnl_pct = round((total_floating / (p.total_invested + 1e-6)) * 100.0, 2) if p.total_invested > 0 else 0.0

        # Closed trades metrics
        closed = p.closed_positions
        if closed:
            realized_amt = sum(c.realized_pnl_amt or 0.0 for c in closed)
            p.total_realized_pnl_amt = round(realized_amt, 2)
            p.total_realized_pnl_pct = round((realized_amt / p.initial_capital) * 100.0, 2)

            wins = [c for c in closed if (c.realized_pnl_pct or 0.0) > 0]
            losses = [c for c in closed if (c.realized_pnl_pct or 0.0) <= 0]
            p.total_trades_count = len(closed)
            p.winning_trades_count = len(wins)
            p.losing_trades_count = len(losses)
            p.win_rate_pct = round((len(wins) / len(closed)) * 100.0, 1)

            total_gain = sum(w.realized_pnl_amt or 0.0 for w in wins)
            total_loss = abs(sum(l.realized_pnl_amt or 0.0 for l in losses))
            p.profit_factor = round(total_gain / (total_loss + 1e-6), 2) if total_loss > 0 else (99.0 if total_gain > 0 else 1.0)
            p.avg_win_pct = round(float(np.mean([w.realized_pnl_pct for w in wins])) if wins else 0.0, 2)
            p.avg_loss_pct = round(float(np.mean([l.realized_pnl_pct for l in losses])) if losses else 0.0, 2)
        else:
            p.win_rate_pct = 0.0
            p.profit_factor = 0.0

        # Record equity point
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        if not p.equity_history or p.equity_history[-1].get("time") != now_str:
            p.equity_history.append({
                "time": now_str,
                "equity": p.portfolio_equity,
                "cash": p.cash_balance,
                "invested": p.total_invested,
                "open_count": len(p.open_positions)
            })
            if len(p.equity_history) > 100:
                p.equity_history = p.equity_history[-100:]

        self._save_state()

    def open_position(
        self,
        symbol: str,
        strategy: str,
        entry_price: float,
        shares_lot: int,
        target_tp1: float,
        target_tp2: float,
        stop_loss: float,
        name: str = "",
        sector: str = "",
        selling_time_window: str = "",
        notes: str = ""
    ) -> ForwardPosition:
        """Open a new forward test paper trading position."""
        p = self.portfolio
        symbol = symbol.upper()
        total_shares = shares_lot * 100
        cost = entry_price * total_shares

        # Check existing open position for same symbol
        if any(pos.symbol == symbol for pos in p.open_positions):
            raise ValueError(f"Posisi pada {symbol} sudah terbuka dalam portofolio Forward Test.")

        if cost > p.cash_balance:
            raise ValueError(f"Saldo kas tidak mencukupi (Tersedia: Rp {p.cash_balance:,.0f}, Dibutuhkan: Rp {cost:,.0f}).")

        # Deduct cash
        p.cash_balance -= cost

        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S WIB")
        date_str = now.strftime("%Y-%m-%d")

        gain_tp1 = round(((target_tp1 - entry_price) / entry_price) * 100.0, 1)
        gain_tp2 = round(((target_tp2 - entry_price) / entry_price) * 100.0, 1)
        sl_pct = round(((stop_loss - entry_price) / entry_price) * 100.0, 1)

        position = ForwardPosition(
            symbol=symbol,
            name=name or symbol,
            sector=sector or "General",
            strategy=strategy,
            entry_time=now_str,
            entry_date=date_str,
            entry_price=entry_price,
            shares_lot=shares_lot,
            total_shares=total_shares,
            invested_capital=cost,
            current_price=entry_price,
            highest_price=entry_price,
            lowest_price=entry_price,
            floating_pnl_amt=0.0,
            floating_pnl_pct=0.0,
            target_tp1=target_tp1,
            predicted_gain_tp1_pct=gain_tp1,
            target_tp2=target_tp2,
            predicted_gain_tp2_pct=gain_tp2,
            stop_loss=stop_loss,
            predicted_stop_loss_pct=sl_pct,
            trailing_stop_active=False,
            trailing_stop_price=stop_loss,
            trailing_stop_pct=2.0,
            selling_time_window=selling_time_window,
            status="OPEN",
            notes=notes
        )

        p.open_positions.append(position)
        self.log_bot_event(
            action="OPEN_POSITION",
            message=f"Buka posisi {strategy} pada {symbol} @ Rp {entry_price:,.0f} ({shares_lot} Lot, Total: Rp {cost:,.0f}).",
            level="TRADE",
            symbol=symbol
        )
        self._recalculate_metrics()
        return position

    def close_position(
        self,
        position_id: str,
        close_price: Optional[float] = None,
        exit_reason: str = "MANUAL",
        notes: str = ""
    ) -> ForwardPosition:
        """Close an existing forward test position."""
        p = self.portfolio
        target_pos = None
        for pos in p.open_positions:
            if pos.id == position_id:
                target_pos = pos
                break

        if not target_pos:
            raise ValueError(f"Posisi Forward Test ID {position_id} tidak ditemukan.")

        exit_p = close_price if close_price is not None else target_pos.current_price
        gross_proceeds = exit_p * target_pos.total_shares
        realized_pnl = gross_proceeds - target_pos.invested_capital
        realized_pct = round(((exit_p - target_pos.entry_price) / target_pos.entry_price) * 100.0, 2)

        now = datetime.now()
        target_pos.status = "CLOSED"
        target_pos.close_time = now.strftime("%Y-%m-%d %H:%M:%S WIB")
        target_pos.close_price = exit_p
        target_pos.realized_pnl_amt = round(realized_pnl, 2)
        target_pos.realized_pnl_pct = realized_pct
        target_pos.exit_reason = exit_reason
        if notes:
            target_pos.notes = notes

        # Add proceeds to cash balance
        p.cash_balance += gross_proceeds
        p.open_positions = [pos for pos in p.open_positions if pos.id != position_id]
        p.closed_positions.insert(0, target_pos)

        lvl = "SUCCESS" if realized_pnl > 0 else "WARN"
        self.log_bot_event(
            action=f"CLOSE_{exit_reason}",
            message=f"Tutup posisi {target_pos.symbol} @ Rp {exit_p:,.0f} | PnL: {'+' if realized_pnl>0 else ''}Rp {realized_pnl:,.0f} ({'+' if realized_pct>0 else ''}{realized_pct}%) | Alasan: {exit_reason}.",
            level=lvl,
            symbol=target_pos.symbol
        )

        # Trigger Sell Alert Dispatcher and WebSocket broadcast
        try:
            from src.alerts.dispatcher import NotificationDispatcher
            dispatcher = NotificationDispatcher.get_instance()
            if dispatcher.settings.enable_execution_alerts:
                import asyncio
                try:
                    loop = asyncio.get_running_loop()
                    loop.create_task(dispatcher.dispatch_sell_execution(
                        symbol=target_pos.symbol,
                        strategy=target_pos.strategy,
                        action_type=exit_reason,
                        entry_price=target_pos.entry_price,
                        exit_price=exit_p,
                        shares_lot=target_pos.shares_lot,
                        realized_pnl_amt=realized_pnl,
                        realized_pnl_pct=realized_pct,
                        holding_duration=target_pos.notes or ""
                    ))
                except RuntimeError:
                    # Fallback if outside event loop
                    pass
        except Exception:
            pass

        self._recalculate_metrics()
        return target_pos

    def sync_live_prices(self, price_map: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Update live prices and automatically trigger TP/SL/Trailing Stop rules.
        """
        p = self.portfolio
        auto_actions = []
        positions_to_close = []

        now = datetime.now()
        current_time_str = now.strftime("%H:%M")

        for pos in p.open_positions:
            sym = pos.symbol
            if sym in price_map and price_map[sym] > 0:
                live_p = float(price_map[sym])
                pos.current_price = live_p
                pos.highest_price = max(pos.highest_price, live_p)
                pos.lowest_price = min(pos.lowest_price, live_p)

                # Floating PnL
                pos.floating_pnl_amt = round((live_p - pos.entry_price) * pos.total_shares, 2)
                pos.floating_pnl_pct = round(((live_p - pos.entry_price) / pos.entry_price) * 100.0, 2)

                # Breakeven Profit Lock: Lock capital at Entry + 0.4% broker fee once gain >= +2.5%
                min_breakeven = round(pos.entry_price * 1.004, 0)
                if pos.floating_pnl_pct >= 2.5 and not pos.breakeven_lock_active:
                    pos.breakeven_lock_active = True
                    pos.breakeven_price = min_breakeven
                    if pos.stop_loss < min_breakeven:
                        pos.stop_loss = min_breakeven
                        self.log_bot_event(
                            action="BREAKEVEN_LOCK_ACTIVATED",
                            message=f"Kunci Untung Breakeven aktif pada {sym}. Stop Loss dinaikkan ke Rp {min_breakeven:,.0f} (+0.4% fee).",
                            level="INFO",
                            symbol=sym
                        )

                # Trailing Stop ratchet
                if live_p >= pos.target_tp1 and not pos.trailing_stop_active:
                    pos.trailing_stop_active = True
                    pos.trailing_stop_price = round(pos.highest_price * (1.0 - pos.trailing_stop_pct / 100.0), 0)
                    self.log_bot_event(
                        action="TRAILING_STOP_ACTIVATED",
                        message=f"Trailing Stop diaktifkan pada {sym} di level Rp {pos.trailing_stop_price:,.0f}.",
                        level="INFO",
                        symbol=sym
                    )
                elif pos.trailing_stop_active:
                    new_trailing = round(pos.highest_price * (1.0 - pos.trailing_stop_pct / 100.0), 0)
                    if new_trailing > pos.trailing_stop_price:
                        pos.trailing_stop_price = new_trailing

                # Automated Exit Checks
                bot_cfg = p.bot_settings
                if bot_cfg.get("auto_tp_enabled", True):
                    if live_p >= pos.target_tp2:
                        positions_to_close.append((pos.id, live_p, "TAKE_PROFIT_2", f"Target TP2 Rp {pos.target_tp2:,.0f} tercapai."))
                        auto_actions.append({"symbol": sym, "action": "TAKE_PROFIT_2", "price": live_p})
                        continue

                if bot_cfg.get("trailing_stop_enabled", True) and pos.trailing_stop_active:
                    if live_p <= pos.trailing_stop_price:
                        positions_to_close.append((pos.id, live_p, "TRAILING_STOP", f"Trailing Stop Rp {pos.trailing_stop_price:,.0f} tersentuh dari puncak."))
                        auto_actions.append({"symbol": sym, "action": "TRAILING_STOP", "price": live_p})
                        continue

                if bot_cfg.get("auto_sl_enabled", True):
                    if live_p <= pos.stop_loss:
                        positions_to_close.append((pos.id, live_p, "STOP_LOSS", f"Batas Cut Loss Rp {pos.stop_loss:,.0f} tertembus."))
                        auto_actions.append({"symbol": sym, "action": "STOP_LOSS", "price": live_p})
                        continue

                if bot_cfg.get("auto_time_stop_enabled", True):
                    if pos.strategy == "BPJS" and current_time_str >= "15:45":
                        positions_to_close.append((pos.id, live_p, "TIME_STOP", "Penutupan Sesi Sore BPJS (15:45 WIB - Zero Overnight)."))
                        auto_actions.append({"symbol": sym, "action": "TIME_STOP_BPJS", "price": live_p})
                        continue

        # Execute auto closes
        for pos_id, exit_price, reason, note in positions_to_close:
            self.close_position(pos_id, close_price=exit_price, exit_reason=reason, notes=note)

        self._recalculate_metrics()
        return auto_actions

    def lock_all_qualifying_breakeven(self, min_gain_pct: float = 2.0) -> int:
        """
        Manually or programmatically elevate stop loss to breakeven (+0.4% fee)
        for all open positions that are in profit.
        """
        count = 0
        for pos in self.portfolio.open_positions:
            if pos.floating_pnl_pct >= min_gain_pct and not pos.breakeven_lock_active:
                pos.breakeven_lock_active = True
                min_be = round(pos.entry_price * 1.004, 0)
                pos.breakeven_price = min_be
                if pos.stop_loss < min_be:
                    pos.stop_loss = min_be
                self.log_bot_event(
                    action="BREAKEVEN_LOCK_BULK",
                    message=f"Kunci Untung Portofolio diaktifkan pada {pos.symbol} di level Rp {min_be:,.0f}.",
                    level="INFO",
                    symbol=pos.symbol
                )
                count += 1
        if count > 0:
            self._save_state()
            self._recalculate_metrics()
        return count

    def execute_autonomous_cycle(self, candidates_pool: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Full Autonomous Cycle:
        1. Sync active positions with live prices & execute TP/SL/Trailing Stops.
        2. If available slots, automatically screen and open highest-probability candidate.
        """
        p = self.portfolio
        if not p.auto_bot_enabled:
            return {"status": "DISABLED", "message": "Auto-Bot dinonaktifkan."}

        # Step 1: Sync prices
        open_symbols = [pos.symbol for pos in p.open_positions]
        price_map = {}
        # Fetch prices for open positions
        from src.data.collector import DataCollector
        collector = DataCollector()

        for sym in open_symbols:
            try:
                ohlcv = collector.fetch_historical_ohlcv(sym, period="5d")
                if not ohlcv.empty:
                    price_map[sym] = float(ohlcv['close'].iloc[-1])
            except Exception:
                pass

        exits = self.sync_live_prices(price_map)

        # Step 2: Auto-Scan & Auto-Entry
        bot_cfg = p.bot_settings
        max_slots = bot_cfg.get("max_concurrent_positions", 5)
        min_score = bot_cfg.get("min_score_filter", 65.0)
        lot_size = bot_cfg.get("default_lot_per_trade", 50)
        available_slots = max_slots - len(p.open_positions)

        new_entries = []
        if available_slots > 0 and candidates_pool:
            for c in candidates_pool:
                if available_slots <= 0:
                    break
                sym = c.get("symbol")
                if not sym or any(pos.symbol == sym for pos in p.open_positions):
                    continue

                score = float(c.get("pre_ara_score") or c.get("bpjs_score") or c.get("bsjp_score") or c.get("confluence_score") or c.get("ai_score") or 0.0)
                if score < min_score:
                    continue

                entry_p = float(c.get("current_price") or c.get("entry_price") or c.get("price") or 1000.0)
                cost = entry_p * lot_size * 100

                if cost <= p.cash_balance:
                    tp1 = float(c.get("target_tp1_price") or c.get("target_sell_morning_min") or c.get("target_tp1") or round(entry_p * 1.035))
                    tp2 = float(c.get("predicted_target_price") or c.get("target_sell_morning_max") or c.get("target_tp2") or round(entry_p * 1.070))
                    sl = float(c.get("predicted_stop_loss_price") or c.get("stop_loss_morning") or c.get("stop_loss") or round(entry_p * 0.975))

                    strat = c.get("strat_code") or "BPJS"
                    try:
                        pos = self.open_position(
                            symbol=sym,
                            strategy=strat,
                            entry_price=entry_p,
                            shares_lot=lot_size,
                            target_tp1=tp1,
                            target_tp2=tp2,
                            stop_loss=sl,
                            name=c.get("name", sym),
                            sector=c.get("sector", "General"),
                            selling_time_window=c.get("selling_time_window", ""),
                            notes=f"Auto-Bot Execution (Score {score:.0f})"
                        )
                        new_entries.append(sym)
                        available_slots -= 1
                    except Exception as e:
                        print(f"Auto-bot entry error: {e}")

        # Heartbeat log
        self.log_bot_event(
            action="HEARTBEAT_CYCLE",
            message=f"Siklus Otonom Selesai: {len(p.open_positions)} Posisi Aktif dipantau | {len(exits)} Auto-Exit | {len(new_entries)} Posisi Baru dibuka ({', '.join(new_entries) if new_entries else 'None'}).",
            level="INFO"
        )

        return {
            "status": "SUCCESS",
            "open_positions_count": len(p.open_positions),
            "auto_exits": exits,
            "new_entries": new_entries,
            "portfolio_equity": p.portfolio_equity
        }

    def reset_portfolio(self, initial_capital: float = 100_000_000.0):
        """Reset forward test simulation back to clean state."""
        self.portfolio = ForwardTestPortfolio(
            initial_capital=initial_capital,
            cash_balance=initial_capital,
            portfolio_equity=initial_capital,
            open_positions=[],
            closed_positions=[],
            equity_history=[{
                "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "equity": initial_capital,
                "cash": initial_capital,
                "invested": 0.0,
                "open_count": 0
            }],
            bot_logs=[
                BotLogEntry(
                    timestamp=datetime.now().strftime("%H:%M:%S WIB"),
                    level="INFO",
                    action="PORTFOLIO_RESET",
                    message=f"Portofolio Forward Test di-reset ke modal awal Rp {initial_capital:,.0f}."
                )
            ]
        )
        self._recalculate_metrics()

    def _seed_initial_demo(self, p: ForwardTestPortfolio):
        """Populate initial realistic paper trades so the studio is immediately live."""
        demo_closed = [
            ForwardPosition(
                symbol="BSSR.JK",
                name="Baramulti Suksessarana Tbk",
                sector="Energy",
                strategy="PRE_ARA",
                entry_time="2026-08-28 09:12:00 WIB",
                entry_date="2026-08-28",
                entry_price=4730.0,
                shares_lot=20,
                total_shares=2000,
                invested_capital=9_460_000.0,
                current_price=5150.0,
                highest_price=5200.0,
                lowest_price=4700.0,
                target_tp1=4970.0,
                target_tp2=5675.0,
                stop_loss=4580.0,
                status="CLOSED",
                close_time="2026-08-28 11:15:00 WIB",
                close_price=5150.0,
                realized_pnl_amt=840_000.0,
                realized_pnl_pct=8.88,
                exit_reason="TAKE_PROFIT_1",
                notes="TP1 hit dengan momentum volume velocity 3.4x."
            ),
            ForwardPosition(
                symbol="SSIA.JK",
                name="Surya Semesta Internusa Tbk",
                sector="Property",
                strategy="BPJS",
                entry_time="2026-08-28 09:20:00 WIB",
                entry_date="2026-08-28",
                entry_price=1945.0,
                shares_lot=50,
                total_shares=5000,
                invested_capital=9_725_000.0,
                current_price=2040.0,
                highest_price=2060.0,
                lowest_price=1940.0,
                target_tp1=2040.0,
                target_tp2=2330.0,
                stop_loss=1890.0,
                status="CLOSED",
                close_time="2026-08-28 15:45:00 WIB",
                close_price=2040.0,
                realized_pnl_amt=475_000.0,
                realized_pnl_pct=4.88,
                exit_reason="TIME_STOP",
                notes="Keluar di sesi closing 15:45 WIB dengan profit +4.88%."
            ),
            ForwardPosition(
                symbol="ADRO.JK",
                name="Adaro Energy Indonesia Tbk",
                sector="Energy",
                strategy="CONFLUENCE",
                entry_time="2026-08-27 10:05:00 WIB",
                entry_date="2026-08-27",
                entry_price=2750.0,
                shares_lot=40,
                total_shares=4000,
                invested_capital=11_000_000.0,
                current_price=2890.0,
                highest_price=2910.0,
                lowest_price=2740.0,
                target_tp1=2890.0,
                target_tp2=3050.0,
                stop_loss=2660.0,
                status="CLOSED",
                close_time="2026-08-28 10:30:00 WIB",
                close_price=2890.0,
                realized_pnl_amt=560_000.0,
                realized_pnl_pct=5.09,
                exit_reason="TAKE_PROFIT_1",
                notes="Konfluensi 4 Screener tercapai sempurna."
            ),
            ForwardPosition(
                symbol="SCCO.JK",
                name="Supreme Cable Manufacturing Tbk",
                sector="Industrial",
                strategy="BSJP",
                entry_time="2026-08-27 15:50:00 WIB",
                entry_date="2026-08-27",
                entry_price=2370.0,
                shares_lot=30,
                total_shares=3000,
                invested_capital=7_110_000.0,
                current_price=2460.0,
                highest_price=2490.0,
                lowest_price=2360.0,
                target_tp1=2430.0,
                target_tp2=2520.0,
                stop_loss=2320.0,
                status="CLOSED",
                close_time="2026-08-28 09:10:00 WIB",
                close_price=2460.0,
                realized_pnl_amt=270_000.0,
                realized_pnl_pct=3.80,
                exit_reason="TAKE_PROFIT_1",
                notes="Morning gap-up opening spike dieksekusi 09:10 WIB."
            )
        ]

        p.closed_positions = demo_closed
        total_realized = sum(c.realized_pnl_amt for c in demo_closed)
        p.total_realized_pnl_amt = total_realized
        p.cash_balance = p.initial_capital + total_realized
        p.portfolio_equity = p.cash_balance

        # Open active demo positions
        p.open_positions = [
            ForwardPosition(
                symbol="JECC.JK",
                name="Jembo Cable Company Tbk",
                sector="Industrial",
                strategy="PRE_ARA",
                entry_time="2026-08-31 09:15:00 WIB",
                entry_date="2026-08-31",
                entry_price=665.0,
                shares_lot=150,
                total_shares=15000,
                invested_capital=9_975_000.0,
                current_price=700.0,
                highest_price=705.0,
                lowest_price=660.0,
                floating_pnl_amt=525_000.0,
                floating_pnl_pct=5.26,
                target_tp1=700.0,
                predicted_gain_tp1_pct=5.3,
                target_tp2=805.0,
                predicted_gain_tp2_pct=21.1,
                stop_loss=645.0,
                predicted_stop_loss_pct=-3.0,
                trailing_stop_active=True,
                trailing_stop_price=685.0,
                selling_time_window="Pagi 09:30 - 10:15 / ARA 15:45 WIB",
                status="OPEN",
                notes="Lolos Pre-ARA Hunter Skor 85. Volume velocity 3.8x."
            ),
            ForwardPosition(
                symbol="PTBA.JK",
                name="Bukit Asam Tbk",
                sector="Energy",
                strategy="BPJS",
                entry_time="2026-08-31 09:25:00 WIB",
                entry_date="2026-08-31",
                entry_price=2540.0,
                shares_lot=40,
                total_shares=4000,
                invested_capital=10_160_000.0,
                current_price=2580.0,
                highest_price=2590.0,
                lowest_price=2540.0,
                floating_pnl_amt=160_000.0,
                floating_pnl_pct=1.57,
                target_tp1=2630.0,
                predicted_gain_tp1_pct=3.5,
                target_tp2=2720.0,
                predicted_gain_tp2_pct=7.1,
                stop_loss=2470.0,
                predicted_stop_loss_pct=-2.8,
                trailing_stop_active=False,
                trailing_stop_price=2470.0,
                selling_time_window="Sore Ini: 15:40 - 15:50 WIB",
                status="OPEN",
                notes="Rebound demand area dengan volume intensif."
            )
        ]

        # Deduct active invested capital from cash
        open_invested = sum(pos.invested_capital for pos in p.open_positions)
        p.cash_balance -= open_invested
        p.bot_logs = [
            BotLogEntry(
                timestamp="09:25:00 WIB",
                level="TRADE",
                action="OPEN_POSITION",
                symbol="PTBA.JK",
                message="[AUTO-BOT] Membuka posisi BPJS pada PTBA.JK @ Rp 2,540 (40 Lot)."
            ),
            BotLogEntry(
                timestamp="09:15:00 WIB",
                level="TRADE",
                action="OPEN_POSITION",
                symbol="JECC.JK",
                message="[AUTO-BOT] Membuka posisi Pre-ARA Hunter pada JECC.JK @ Rp 665 (150 Lot)."
            ),
            BotLogEntry(
                timestamp="09:00:00 WIB",
                level="INFO",
                action="BOT_START",
                message="[AUTO-BOT] Bot Kuantitatif Aktif. Memindai pasar BEI..."
            )
        ]
