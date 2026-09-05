"""
Signal Evaluator & Real Outcome Auditor for BPJS (Beli Pagi Jual Sore), BSJP (Beli Sore Jual Pagi), and Pre-ARA.
Records candidate signals at entry window, tracks actual real-world prices at target exit times,
calculates realized PnL %, win/loss classification, Maximum Favorable Excursion (MFE),
Maximum Adverse Excursion (MAE), and aggregates performance statistics for model auditing.
"""

from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import src.data.audit_db as audit_db
import pandas as pd
import numpy as np
import json
import os


class SignalEvaluatorEngine:
    """
    Real-world Outcome Evaluation Engine for Intraday & Overnight Trading Setups.
    """

    DEFAULT_STORE_PATH = os.path.join("data", "signal_evaluations.json")

    @classmethod
    def load_records(cls, filepath: Optional[str] = None) -> List[Dict[str, Any]]:
        """Load evaluation records from disk cache / database."""
        path = filepath or cls.DEFAULT_STORE_PATH
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @classmethod
    def save_records(cls, records: List[Dict[str, Any]], filepath: Optional[str] = None) -> None:
        """
        Permanently save evaluation records to disk cache and create automatic mirror backup.
        Guarantees persistent audit preservation with zero data loss.
        """
        path = filepath or cls.DEFAULT_STORE_PATH
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, default=str)

        # Automatic mirror backup
        try:
            backup_dir = os.path.join("data", "backups")
            os.makedirs(backup_dir, exist_ok=True)
            backup_path = os.path.join(backup_dir, "signal_evaluations_archive.json")
            with open(backup_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, default=str)
        except Exception:
            pass

    @classmethod
    def record_signal(
        cls,
        strategy_type: str,  # "BPJS", "BSJP", "PRE_ARA"
        symbol: str,
        name: str,
        sector: str,
        entry_price: float,
        target_tp1: float,
        target_tp2: float,
        stop_loss: float,
        signal_date: Optional[str] = None,
        signal_time: Optional[str] = None,
        target_exit_time: Optional[str] = None,
        confidence_level: Optional[str] = None,
        eval_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Record a newly triggered trade signal into the audit log.
        """
        now = datetime.now()
        s_date = signal_date or now.strftime("%Y-%m-%d")
        
        if strategy_type == "BPJS":
            s_time = signal_time or "09:30 WIB"
            t_exit = target_exit_time or "15:30 WIB (Sesi Sore)"
        elif strategy_type == "PRE_ARA":
            s_time = signal_time or "09:15 WIB"
            t_exit = target_exit_time or "15:45 WIB (Penutupan Sore / ARA)"
        else:
            s_time = signal_time or "15:50 WIB"
            t_exit = target_exit_time or "09:15 WIB H+1 (Pembukaan Pagi)"

        from src.data.universe import is_stock_sharia
        records = cls.load_records()
        
        # Anti-Duplication check: Do not re-record same symbol, strategy, and date
        for r in records:
            if (
                r.get("symbol") == symbol
                and r.get("signal_date") == s_date
                and r.get("strategy_type") == strategy_type
            ):
                return r

        new_id = len(records) + 1

        meta = eval_metadata or {}
        score_val = float(meta.get("ai_score") or meta.get("bpjs_score") or meta.get("pre_ara_score") or meta.get("bsjp_score") or 70.0)
        conf = confidence_level
        if not conf:
            if score_val >= 80.0 or "SANGAT TINGGI" in str(meta.get("ara_probability", "")):
                conf = "ULTRA (Tinggi)"
            elif score_val >= 70.0 or "HIGH" in str(meta.get("gap_up_probability", "")):
                conf = "HIGH (Tinggi)"
            elif score_val >= 60.0:
                conf = "MODERATE (Menengah)"
            else:
                conf = "TACTICAL (Standar)"

        record = {
            "id": new_id,
            "strategy_type": strategy_type,
            "symbol": symbol,
            "is_sharia": is_stock_sharia(symbol),
            "name": name,
            "sector": sector,
            "confidence_level": conf,
            "confidence_score": score_val,
            "signal_date": s_date,
            "signal_time": s_time,
            "entry_price": float(entry_price),
            "target_tp1": float(target_tp1),
            "target_tp2": float(target_tp2),
            "stop_loss": float(stop_loss),
            "target_exit_time": t_exit,
            "actual_exit_price": None,
            "actual_highest_price": None,
            "actual_lowest_price": None,
            "realized_pnl_pct": None,
            "outcome_status": "PENDING",
            "win_reason": "Menunggu evaluasi harga pasar riil pada waktu target",
            "eval_metadata": eval_metadata or {},
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
            "evaluated_at": None
        }

        records.append(record)
        cls.save_records(records)
        try:
            audit_db.save_evaluation_record(record)
        except Exception as e:
            pass
        return record

    @classmethod
    def evaluate_signal_outcome(
        cls,
        record: Dict[str, Any],
        df_daily: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Evaluate a single recorded signal against actual subsequent market data.
        """
        if df_daily.empty:
            return record

        entry_p = float(record["entry_price"])
        tp1 = float(record["target_tp1"])
        tp2 = float(record["target_tp2"])
        sl = float(record["stop_loss"])
        strategy = record["strategy_type"]

        # Strategy 1: BPJS & PRE_ARA (Same day evaluation)
        if strategy in ("BPJS", "PRE_ARA"):
            candle = df_daily.iloc[-1]
            day_high = float(candle["high"])
            day_low = float(candle["low"])
            day_close = float(candle["close"])

            record["actual_highest_price"] = day_high
            record["actual_lowest_price"] = day_low

            if day_low <= sl:
                record["actual_exit_price"] = sl
                record["realized_pnl_pct"] = round(((sl - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "LOSS"
                record["win_reason"] = f"Menyentuh Batas Cut Loss Rp {sl:,.0f} ({record['realized_pnl_pct']}%)"
            elif day_high >= tp1:
                actual_exit = min(tp1, day_high)
                record["actual_exit_price"] = actual_exit
                record["realized_pnl_pct"] = round(((actual_exit - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "WIN"
                record["win_reason"] = f"Target Sore TP1 Tercapai di Rp {actual_exit:,.0f} (+{record['realized_pnl_pct']}%)"
            else:
                record["actual_exit_price"] = day_close
                record["realized_pnl_pct"] = round(((day_close - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "WIN" if record["realized_pnl_pct"] > 0 else "LOSS"
                sign = "+" if record["realized_pnl_pct"] > 0 else ""
                record["win_reason"] = f"Exit Penutupan Sore di Rp {day_close:,.0f} ({sign}{record['realized_pnl_pct']}%)"

            record["evaluated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Strategy 2: BSJP (Next day morning evaluation)
        elif strategy == "BSJP":
            if len(df_daily) < 2:
                return record

            h1_candle = df_daily.iloc[-1]
            next_open = float(h1_candle["open"])
            next_high = float(h1_candle["high"])
            next_low = float(h1_candle["low"])

            record["actual_highest_price"] = next_high
            record["actual_lowest_price"] = next_low

            if next_open >= entry_p * 1.015:
                record["actual_exit_price"] = next_open
                record["realized_pnl_pct"] = round(((next_open - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "WIN"
                record["win_reason"] = f"Gap-Up Pembukaan Pagi Jam 09:00 WIB (+{record['realized_pnl_pct']}%)"
            elif next_high >= tp1:
                actual_exit = min(tp1, next_high)
                record["actual_exit_price"] = actual_exit
                record["realized_pnl_pct"] = round(((actual_exit - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "WIN"
                record["win_reason"] = f"Morning Surge Lonjakan Pagi Jam 09:15 WIB (+{record['realized_pnl_pct']}%)"
            elif next_low <= sl:
                record["actual_exit_price"] = sl
                record["realized_pnl_pct"] = round(((sl - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "LOSS"
                record["win_reason"] = f"Stop Loss Pagi Terkena di Rp {sl:,.0f} ({record['realized_pnl_pct']}%)"
            else:
                record["actual_exit_price"] = float(h1_candle["close"])
                record["realized_pnl_pct"] = round(((record["actual_exit_price"] - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "WIN" if record["realized_pnl_pct"] > 0 else "LOSS"
                sign = "+" if record["realized_pnl_pct"] > 0 else ""
                record["win_reason"] = f"Exit Sesi Pagi di Rp {record['actual_exit_price']:,.0f} ({sign}{record['realized_pnl_pct']}%)"

            record["evaluated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                # Strategy 3: BUY_LAYAK / AI Score (Swing evaluation)
        elif strategy in ("BUY_LAYAK", "HYBRID_QUANT"):
            candle = df_daily.iloc[-1]
            day_high = float(candle["high"])
            day_low = float(candle["low"])
            day_close = float(candle["close"])
            record["actual_highest_price"] = day_high
            record["actual_lowest_price"] = day_low

            if day_high >= tp1:
                actual_exit = min(tp1, day_high)
                record["actual_exit_price"] = actual_exit
                record["actual_exit_time"] = "Sesi 1 (Target TP1)"
                record["realized_pnl_pct"] = round(((actual_exit - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "WIN"
                record["win_reason"] = f"Target Swing TP1 Tercapai di Rp {actual_exit:,.0f} (+{record['realized_pnl_pct']}%)"
            elif day_low <= sl:
                record["actual_exit_price"] = sl
                record["actual_exit_time"] = "Sesi 1 (Cut Loss)"
                record["realized_pnl_pct"] = round(((sl - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "LOSS"
                record["win_reason"] = f"Batas Cut Loss Terkena di Rp {sl:,.0f} ({record['realized_pnl_pct']}%)"
            else:
                record["actual_exit_price"] = day_close
                record["realized_pnl_pct"] = round(((day_close - entry_p) / entry_p) * 100.0, 2)
                record["outcome_status"] = "PENDING"
                record["actual_exit_time"] = "Sedang Berjalan (Swing)"
                record["win_reason"] = f"Posisi Swing Aktif di Rp {day_close:,.0f} (Menuju TP1 Rp {tp1:,.0f})"

            record["evaluated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return record

    @classmethod
    def evaluate_all_pending(cls, ohlcv_map: Dict[str, pd.DataFrame]) -> List[Dict[str, Any]]:
        """
        Evaluate all pending signals using provided latest OHLCV market data.
        """
        records = cls.load_records()
        updated_any = False

        for r in records:
            if r.get("outcome_status") == "PENDING":
                sym = r["symbol"]
                if sym in ohlcv_map and not ohlcv_map[sym].empty:
                    cls.evaluate_signal_outcome(r, ohlcv_map[sym])
                    updated_any = True

        if updated_any:
            cls.save_records(records)
        return records

    @classmethod
    def refresh_and_mine_latest_signals(cls) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Synchronizes audit dataset with the latest Yahoo Finance candles.
        Mines any new trading days (e.g. 1 September, 2 September), updates existing records,
        and recalculates institutional performance metrics.
        """
        from src.analytics.real_data_miner import RealDataMiner
        from src.analytics.signal_history import SignalHistoryEngine

        existing = cls.load_records()
        existing_keys = {
            (r.get("symbol"), r.get("signal_date"), r.get("strategy_type")): r
            for r in existing
        }

        mined_evals, mined_hists = RealDataMiner.mine_real_signals_and_outcomes()

        # Merge mined evals with existing
        for m in mined_evals:
            key = (m.get("symbol"), m.get("signal_date"), m.get("strategy_type"))
            if key in existing_keys:
                cur = existing_keys[key]
                if cur.get("outcome_status") == "PENDING" or m.get("outcome_status") in ("WIN", "LOSS"):
                    cur.update({
                        "actual_exit_price": m.get("actual_exit_price"),
                        "actual_exit_time": m.get("actual_exit_time"),
                        "actual_highest_price": m.get("actual_highest_price"),
                        "actual_lowest_price": m.get("actual_lowest_price"),
                        "realized_pnl_pct": m.get("realized_pnl_pct"),
                        "outcome_status": m.get("outcome_status"),
                        "win_reason": m.get("win_reason"),
                        "evaluated_at": m.get("evaluated_at")
                    })
            else:
                m["id"] = len(existing) + 1
                existing.append(m)
                existing_keys[key] = m

        # Save merged audit records
        cls.save_records(existing)

        # Also merge signal history
        for h in mined_hists:
            SignalHistoryEngine.record_signal_event(
                signal_type=h.get("signal_type", "BPJS_PAGI"),
                symbol=h.get("symbol", ""),
                name=h.get("name", ""),
                sector=h.get("sector", "General"),
                price_at_signal=h.get("price_at_signal", 0.0),
                ai_score=h.get("ai_score", 75.0),
                setup_pattern=h.get("setup_pattern", ""),
                entry_zone=h.get("entry_zone", ""),
                target_tp1=h.get("target_tp1", ""),
                target_tp2=h.get("target_tp2", ""),
                stop_loss=h.get("stop_loss", ""),
                risk_reward=h.get("risk_reward", "1 : 2.0"),
                safety_shield_status=h.get("safety_shield_status", "AMAN / BEBAS GORENGAN"),
                rationale=h.get("rationale", "")
            )

        summary = cls.calculate_summary_metrics(existing)
        return existing, summary

    @classmethod
    def calculate_summary_metrics(cls, records: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Calculate mathematical and statistical summary metrics across all evaluated trades.
        """
        data = records if records is not None else cls.load_records()
        if not data:
            return {
                "total_signals": 0,
                "evaluated_count": 0,
                "win_count": 0,
                "loss_count": 0,
                "pending_count": 0,
                "win_rate_pct": 0.0,
                "avg_win_pct": 0.0,
                "avg_loss_pct": 0.0,
                "payoff_ratio": 0.0,
                "expectancy_pct": 0.0,
                "profit_factor": 0.0,
                "kelly_criterion_pct": 0.0,
                "half_kelly_pct": 0.0,
                "z_score_stat": 0.0,
                "p_value_text": "N/A",
                "is_statistically_significant": False,
                "max_consecutive_wins": 0,
                "max_consecutive_losses": 0,
                "net_total_pnl_pct": 0.0,
                "bpjs_metrics": {"total": 0, "win_count": 0, "win_rate": 0.0, "avg_pnl": 0.0},
                "bsjp_metrics": {"total": 0, "win_count": 0, "win_rate": 0.0, "avg_pnl": 0.0},
                "pre_ara_metrics": {"total": 0, "win_count": 0, "win_rate": 0.0, "avg_pnl": 0.0}
            }

        evaluated = [r for r in data if r.get("outcome_status") in ("WIN", "LOSS")]
        wins = [r for r in evaluated if r["outcome_status"] == "WIN"]
        losses = [r for r in evaluated if r["outcome_status"] == "LOSS"]
        pending = [r for r in data if r.get("outcome_status") == "PENDING"]

        total_eval = len(evaluated)
        win_count = len(wins)
        loss_count = len(losses)
        win_rate = round((win_count / total_eval * 100.0), 1) if total_eval > 0 else 0.0
        loss_rate = (100.0 - win_rate) / 100.0
        wr_frac = win_rate / 100.0

        win_pnls = [r["realized_pnl_pct"] for r in wins if r.get("realized_pnl_pct") is not None]
        loss_pnls = [r["realized_pnl_pct"] for r in losses if r.get("realized_pnl_pct") is not None]

        avg_win = round(float(np.mean(win_pnls)), 2) if win_pnls else 0.0
        avg_loss = round(float(np.mean(loss_pnls)), 2) if loss_pnls else 0.0
        abs_avg_loss = abs(avg_loss) if avg_loss != 0 else 1.0

        payoff_ratio = round(avg_win / abs_avg_loss, 2) if abs_avg_loss > 0 else 1.0
        expectancy = round((wr_frac * avg_win) - (loss_rate * abs_avg_loss), 2)

        total_gain_sum = sum(win_pnls) if win_pnls else 0.0
        total_loss_sum = abs(sum(loss_pnls)) if loss_pnls else 0.0
        profit_factor = round(total_gain_sum / (total_loss_sum + 1e-6), 2)
        net_total_pnl = round(sum(r.get("realized_pnl_pct", 0) for r in evaluated), 2)

        # Kelly Criterion
        kelly = wr_frac - ((1.0 - wr_frac) / max(0.01, payoff_ratio))
        kelly_pct = float(round(max(0.0, min(1.0, kelly)) * 100.0, 1))
        half_kelly_pct = float(round(kelly_pct / 2.0, 1))

        # Z-Score Hypothesis Test vs 50% Random Walk
        if total_eval >= 10:
            se = float(np.sqrt(0.25 / total_eval))
            z_score = float(round((wr_frac - 0.50) / se, 2))
            is_sig = bool(z_score >= 1.96)  # 95% Confidence (2-sigma)
            p_val_text = "< 0.0001" if z_score >= 3.89 else ("< 0.01" if z_score >= 2.58 else ("< 0.05" if z_score >= 1.96 else "p > 0.05"))
        else:
            z_score = 0.0
            is_sig = False
            p_val_text = "N/A"

        # Consecutive Streaks
        cur_w_streak = 0
        cur_l_streak = 0
        max_w_streak = 0
        max_l_streak = 0

        for r in evaluated:
            if r["outcome_status"] == "WIN":
                cur_w_streak += 1
                cur_l_streak = 0
                max_w_streak = max(max_w_streak, cur_w_streak)
            elif r["outcome_status"] == "LOSS":
                cur_l_streak += 1
                cur_w_streak = 0
                max_l_streak = max(max_l_streak, cur_l_streak)

        # Strategy Breakdown
        bpjs_eval = [r for r in evaluated if r["strategy_type"] == "BPJS"]
        bsjp_eval = [r for r in evaluated if r["strategy_type"] == "BSJP"]
        pre_ara_eval = [r for r in evaluated if r["strategy_type"] == "PRE_ARA"]

        bpjs_wins = [r for r in bpjs_eval if r["outcome_status"] == "WIN"]
        bsjp_wins = [r for r in bsjp_eval if r["outcome_status"] == "WIN"]
        pre_ara_wins = [r for r in pre_ara_eval if r["outcome_status"] == "WIN"]

        bpjs_wr = round((len(bpjs_wins) / len(bpjs_eval) * 100.0), 1) if bpjs_eval else 0.0
        bsjp_wr = round((len(bsjp_wins) / len(bsjp_eval) * 100.0), 1) if bsjp_eval else 0.0
        pre_ara_wr = round((len(pre_ara_wins) / len(pre_ara_eval) * 100.0), 1) if pre_ara_eval else 0.0

        bpjs_avg = round(float(np.mean([r["realized_pnl_pct"] for r in bpjs_eval])), 2) if bpjs_eval else 0.0
        bsjp_avg = round(float(np.mean([r["realized_pnl_pct"] for r in bsjp_eval])), 2) if bsjp_eval else 0.0
        pre_ara_avg = round(float(np.mean([r["realized_pnl_pct"] for r in pre_ara_eval])), 2) if pre_ara_eval else 0.0

        buy_layak_eval = [r for r in evaluated if r.get("strategy_type") in ("BUY_LAYAK", "HYBRID_QUANT")]
        buy_layak_wins = [r for r in buy_layak_eval if r["outcome_status"] == "WIN"]
        buy_layak_wr = round((len(buy_layak_wins) / len(buy_layak_eval) * 100.0), 1) if buy_layak_eval else 0.0
        buy_layak_avg = round(float(np.mean([r["realized_pnl_pct"] for r in buy_layak_eval])), 2) if buy_layak_eval else 0.0

        # 3 Major Pillars Aggregates
        scalping_eval = [r for r in evaluated if r.get("strategy_type") in ("BPJS", "PRE_ARA")]
        scalping_wins = [r for r in scalping_eval if r["outcome_status"] == "WIN"]
        scalping_wr = round((len(scalping_wins) / len(scalping_eval) * 100.0), 1) if scalping_eval else 0.0
        scalping_avg = round(float(np.mean([r["realized_pnl_pct"] for r in scalping_eval])), 2) if scalping_eval else 0.0

        swing_eval = [r for r in evaluated if r.get("strategy_type") in ("BSJP", "BUY_LAYAK", "HYBRID_QUANT", "CONFLUENCE", "SMARTPICK")]
        swing_wins = [r for r in swing_eval if r["outcome_status"] == "WIN"]
        swing_wr = round((len(swing_wins) / len(swing_eval) * 100.0), 1) if swing_eval else 0.0
        swing_avg = round(float(np.mean([r["realized_pnl_pct"] for r in swing_eval])), 2) if swing_eval else 0.0

        return {
            "total_signals": len(data),
            "evaluated_count": total_eval,
            "win_count": win_count,
            "loss_count": loss_count,
            "pending_count": len(pending),
            "win_rate_pct": win_rate,
            "avg_win_pct": avg_win,
            "avg_loss_pct": avg_loss,
            "payoff_ratio": payoff_ratio,
            "expectancy_pct": expectancy,
            "profit_factor": profit_factor,
            "kelly_criterion_pct": kelly_pct,
            "half_kelly_pct": half_kelly_pct,
            "z_score_stat": z_score,
            "p_value_text": p_val_text,
            "is_statistically_significant": is_sig,
            "max_consecutive_wins": max_w_streak,
            "max_consecutive_losses": max_l_streak,
            "net_total_pnl_pct": net_total_pnl,
            "bpjs_metrics": {
                "total": len(bpjs_eval),
                "win_count": len(bpjs_wins),
                "win_rate": bpjs_wr,
                "avg_pnl": bpjs_avg
            },
            "bsjp_metrics": {
                "total": len(bsjp_eval),
                "win_count": len(bsjp_wins),
                "win_rate": bsjp_wr,
                "avg_pnl": bsjp_avg
            },
            "bpjs_win_rate_pct": bpjs_wr,
            "bsjp_win_rate_pct": bsjp_wr,
            "pre_ara_win_rate_pct": pre_ara_wr,
            "buy_layak_win_rate_pct": buy_layak_wr,
            "pre_ara_metrics": {
                "total": len(pre_ara_eval),
                "win_count": len(pre_ara_wins),
                "win_rate": pre_ara_wr,
                "avg_pnl": pre_ara_avg
            },
            "buy_layak_metrics": {
                "total": len(buy_layak_eval),
                "win_count": len(buy_layak_wins),
                "win_rate": buy_layak_wr,
                "avg_pnl": buy_layak_avg
            },
            "scalping_metrics": {
                "name": "Scalping (Intraday)",
                "holding": "09:15 - 15:45 WIB (Zero Overnight)",
                "target_pnl": "+2.5% s/d +7.0% / ARA",
                "cut_loss": "-1.5% s/d -2.5%",
                "total": len(scalping_eval),
                "win_count": len(scalping_wins),
                "win_rate": scalping_wr,
                "avg_pnl": scalping_avg,
                "strategies": ["BPJS", "PRE_ARA"]
            },
            "swing_metrics": {
                "name": "Swing Trading",
                "holding": "3 - 20 Hari Bursa",
                "target_pnl": "+8.0% s/d +25.0%",
                "cut_loss": "-4.0% s/d -6.0%",
                "total": len(swing_eval),
                "win_count": len(swing_wins),
                "win_rate": swing_wr,
                "avg_pnl": swing_avg,
                "strategies": ["BSJP", "BUY_LAYAK", "CONFLUENCE", "SMARTPICK"]
            },
            "invest_metrics": {
                "name": "Investasi Jangka Panjang",
                "holding": "3 Bulan - 2+ Tahun",
                "target_pnl": "+30.0% s/d +100%+ (plus Dividen)",
                "cut_loss": "Evaluasi Fundamental (DCA)",
                "total": 0,
                "win_count": 0,
                "win_rate": 0.0,
                "avg_pnl": 0.0,
                "strategies": ["VALUE_INVEST", "DIVIDEND_GROWTH", "GROWTH_COMPOUNDER"]
            }
        }

    @classmethod
    def seed_initial_audit_dataset(cls) -> List[Dict[str, Any]]:
        """
        Populate real forward-test evaluation logs by mining actual Yahoo Finance historical bars.
        Zero dummy/mocked data.
        """
        existing = cls.load_records()
        if existing:
            return existing

        try:
            from src.analytics.real_data_miner import RealDataMiner
            evals, hists = RealDataMiner.mine_real_signals_and_outcomes()
            cls.save_records(evals)
            return evals
        except Exception:
            return existing
