"""
Audit and Signal History Database Layer using SQLite with Write-Ahead Logging (WAL).
Provides high-performance, ACID-compliant, concurrency-safe storage for quantitative audits.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
DB_PATH = os.path.join(DB_DIR, "ihsg_slayer.db")
EVAL_JSON_PATH = os.path.join(DB_DIR, "signal_evaluations.json")
HIST_JSON_PATH = os.path.join(DB_DIR, "signal_history.json")


def get_db_connection() -> sqlite3.Connection:
    """
    Get optimized SQLite connection with Write-Ahead Logging (WAL) enabled.
    """
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for high concurrency
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA cache_size = -64000;")  # 64MB cache
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def map_strategy_to_category(strategy_type: str) -> str:
    """
    Map individual quantitative strategies into the 3 Major Pillars:
    1. SCALPING (Intraday Fast Momentum / Zero Overnight)
    2. SWING (Multi-Day to Multi-Week / Trend & Rebound)
    3. INVEST (Long-Term / Fundamental Value & Compounder)
    """
    s = (strategy_type or "").upper()
    if s in ("BPJS", "PRE_ARA", "SCALPING", "INTRADAY", "TAPE_READING"):
        return "SCALPING"
    elif s in ("BSJP", "BUY_LAYAK", "HYBRID_QUANT", "CONFLUENCE", "SMARTPICK", "SWING", "SWING_REBOUND"):
        return "SWING"
    else:
        return "INVEST"


def initialize_database():
    """
    Initialize tables and indexes, then automatically backfill from existing JSON files if needed.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Signal Evaluations Table (Audit Outcome)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS signal_evaluations (
                id INTEGER PRIMARY KEY,
                strategy_type TEXT NOT NULL,
                symbol TEXT NOT NULL,
                is_sharia INTEGER DEFAULT 0,
                name TEXT,
                sector TEXT,
                confidence_level TEXT,
                confidence_score REAL,
                signal_date TEXT NOT NULL,
                signal_time TEXT,
                entry_price REAL NOT NULL,
                target_tp1 REAL NOT NULL,
                target_tp2 REAL,
                stop_loss REAL NOT NULL,
                target_exit_time TEXT,
                actual_exit_price REAL,
                actual_exit_time TEXT,
                actual_highest_price REAL,
                actual_lowest_price REAL,
                realized_pnl_pct REAL,
                outcome_status TEXT NOT NULL,
                win_reason TEXT,
                eval_metadata TEXT,
                created_at TEXT,
                evaluated_at TEXT,
                UNIQUE(strategy_type, symbol, signal_date)
            );
        """)

        # Indexes for evaluations
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_symbol ON signal_evaluations(symbol);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_date ON signal_evaluations(signal_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_strategy ON signal_evaluations(strategy_type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_status ON signal_evaluations(outcome_status);")
        # Check if trading_category column exists in signal_evaluations
        cursor.execute("PRAGMA table_info(signal_evaluations);")
        cols = [row[1] for row in cursor.fetchall()]
        if "trading_category" not in cols:
            try:
                cursor.execute("ALTER TABLE signal_evaluations ADD COLUMN trading_category TEXT;")
                conn.commit()
            except Exception:
                pass

        # Backfill trading_category
        cursor.execute("UPDATE signal_evaluations SET trading_category = 'SCALPING' WHERE strategy_type IN ('BPJS', 'PRE_ARA');")
        cursor.execute("UPDATE signal_evaluations SET trading_category = 'SWING' WHERE strategy_type IN ('BSJP', 'BUY_LAYAK', 'HYBRID_QUANT', 'CONFLUENCE', 'SMARTPICK');")
        cursor.execute("UPDATE signal_evaluations SET trading_category = 'INVEST' WHERE trading_category IS NULL OR trading_category = '';")
        conn.commit()
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_category ON signal_evaluations(trading_category);")


        # 2. Signal History Table (Chronological Event Feed)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS signal_history (
                id INTEGER PRIMARY KEY,
                timestamp TEXT NOT NULL,
                signal_date TEXT NOT NULL,
                signal_time TEXT,
                signal_type TEXT NOT NULL,
                symbol TEXT NOT NULL,
                is_sharia INTEGER DEFAULT 0,
                name TEXT,
                sector TEXT,
                price_at_signal REAL,
                ai_score REAL,
                setup_pattern TEXT,
                entry_zone TEXT,
                target_tp1 TEXT,
                target_tp2 TEXT,
                stop_loss TEXT,
                risk_reward TEXT,
                safety_shield_status TEXT,
                rationale TEXT
            );
        """)

        # Indexes for signal history
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hist_symbol ON signal_history(symbol);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hist_date ON signal_history(signal_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hist_type ON signal_history(signal_type);")

        conn.commit()

    # Automatically migrate from JSON if database is empty
    _auto_migrate_from_json()


def _auto_migrate_from_json():
    """
    Backfill records from JSON into SQLite if the database table is currently empty.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM signal_evaluations;")
        count = cursor.fetchone()[0]

        if count == 0 and os.path.exists(EVAL_JSON_PATH):
            try:
                with open(EVAL_JSON_PATH, "r", encoding="utf-8") as f:
                    records = json.load(f)
                
                rows_to_insert = []
                for r in records:
                    meta_str = json.dumps(r.get("eval_metadata", {})) if isinstance(r.get("eval_metadata"), (dict, list)) else "{}"
                    rows_to_insert.append((
                        r.get("id"),
                        r.get("strategy_type", "BPJS"),
                        r.get("symbol", ""),
                        1 if r.get("is_sharia") else 0,
                        r.get("name", ""),
                        r.get("sector", "General"),
                        r.get("confidence_level", "MODERATE (Menengah)"),
                        float(r.get("confidence_score") or 70.0),
                        r.get("signal_date", ""),
                        r.get("signal_time", ""),
                        float(r.get("entry_price") or 0.0),
                        float(r.get("target_tp1") or 0.0),
                        float(r.get("target_tp2") or 0.0) if r.get("target_tp2") else None,
                        float(r.get("stop_loss") or 0.0),
                        r.get("target_exit_time", ""),
                        float(r.get("actual_exit_price")) if r.get("actual_exit_price") is not None else None,
                        r.get("actual_exit_time", ""),
                        float(r.get("actual_highest_price")) if r.get("actual_highest_price") is not None else None,
                        float(r.get("actual_lowest_price")) if r.get("actual_lowest_price") is not None else None,
                        float(r.get("realized_pnl_pct")) if r.get("realized_pnl_pct") is not None else None,
                        r.get("outcome_status", "PENDING"),
                        r.get("win_reason", ""),
                        meta_str,
                        r.get("created_at", ""),
                        r.get("evaluated_at", "")
                    ))

                cursor.executemany("""
                    INSERT OR REPLACE INTO signal_evaluations (
                        id, strategy_type, symbol, is_sharia, name, sector,
                        confidence_level, confidence_score, signal_date, signal_time,
                        entry_price, target_tp1, target_tp2, stop_loss, target_exit_time,
                        actual_exit_price, actual_exit_time, actual_highest_price, actual_lowest_price,
                        realized_pnl_pct, outcome_status, win_reason, eval_metadata,
                        created_at, evaluated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, rows_to_insert)
                conn.commit()
                print(f"[AuditDB] Migrated {len(rows_to_insert)} audit records into SQLite WAL!")
            except Exception as e:
                print(f"[AuditDB] Failed to auto-migrate evaluations JSON: {e}")

        # Check signal history
        cursor.execute("SELECT COUNT(*) FROM signal_history;")
        h_count = cursor.fetchone()[0]
        if h_count == 0 and os.path.exists(HIST_JSON_PATH):
            try:
                with open(HIST_JSON_PATH, "r", encoding="utf-8") as f:
                    h_records = json.load(f)
                
                h_rows = []
                for h in h_records:
                    h_rows.append((
                        h.get("id"),
                        h.get("timestamp", ""),
                        h.get("signal_date", ""),
                        h.get("signal_time", ""),
                        h.get("signal_type", "BPJS_PAGI"),
                        h.get("symbol", ""),
                        1 if h.get("is_sharia") else 0,
                        h.get("name", ""),
                        h.get("sector", "General"),
                        float(h.get("price_at_signal") or 0.0),
                        float(h.get("ai_score") or 75.0),
                        h.get("setup_pattern", ""),
                        h.get("entry_zone", ""),
                        str(h.get("target_tp1", "")),
                        str(h.get("target_tp2", "")),
                        str(h.get("stop_loss", "")),
                        str(h.get("risk_reward", "")),
                        str(h.get("safety_shield_status", "")),
                        str(h.get("rationale", ""))
                    ))

                cursor.executemany("""
                    INSERT OR REPLACE INTO signal_history (
                        id, timestamp, signal_date, signal_time, signal_type, symbol,
                        is_sharia, name, sector, price_at_signal, ai_score,
                        setup_pattern, entry_zone, target_tp1, target_tp2, stop_loss,
                        risk_reward, safety_shield_status, rationale
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, h_rows)
                conn.commit()
                print(f"[AuditDB] Migrated {len(h_rows)} signal history records into SQLite WAL!")
            except Exception as e:
                print(f"[AuditDB] Failed to auto-migrate history JSON: {e}")


# =========================================================================
# AUDIT CRUD OPERATIONS (High-Speed SQL)
# =========================================================================

def save_evaluation_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save or update a single signal evaluation record in SQLite WAL.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        meta = record.get("eval_metadata", {})
        meta_str = json.dumps(meta) if isinstance(meta, (dict, list)) else "{}"
        
        cursor.execute("""
            INSERT INTO signal_evaluations (
                strategy_type, symbol, is_sharia, name, sector,
                confidence_level, confidence_score, signal_date, signal_time,
                entry_price, target_tp1, target_tp2, stop_loss, target_exit_time,
                actual_exit_price, actual_exit_time, actual_highest_price, actual_lowest_price,
                realized_pnl_pct, outcome_status, win_reason, eval_metadata,
                created_at, evaluated_at, trading_category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(strategy_type, symbol, signal_date) DO UPDATE SET
                actual_exit_price=excluded.actual_exit_price,
                actual_exit_time=excluded.actual_exit_time,
                actual_highest_price=excluded.actual_highest_price,
                actual_lowest_price=excluded.actual_lowest_price,
                realized_pnl_pct=excluded.realized_pnl_pct,
                outcome_status=excluded.outcome_status,
                win_reason=excluded.win_reason,
                evaluated_at=excluded.evaluated_at,
                eval_metadata=excluded.eval_metadata;
        """, (
            record.get("strategy_type", "BPJS"),
            record.get("symbol", ""),
            1 if record.get("is_sharia") else 0,
            record.get("name", ""),
            record.get("sector", "General"),
            record.get("confidence_level", "MODERATE (Menengah)"),
            float(record.get("confidence_score") or 70.0),
            record.get("signal_date", ""),
            record.get("signal_time", ""),
            float(record.get("entry_price") or 0.0),
            float(record.get("target_tp1") or 0.0),
            float(record.get("target_tp2") or 0.0) if record.get("target_tp2") else None,
            float(record.get("stop_loss") or 0.0),
            record.get("target_exit_time", ""),
            float(record.get("actual_exit_price")) if record.get("actual_exit_price") is not None else None,
            record.get("actual_exit_time", ""),
            float(record.get("actual_highest_price")) if record.get("actual_highest_price") is not None else None,
            float(record.get("actual_lowest_price")) if record.get("actual_lowest_price") is not None else None,
            float(record.get("realized_pnl_pct")) if record.get("realized_pnl_pct") is not None else None,
            record.get("outcome_status", "PENDING"),
            record.get("win_reason", ""),
            meta_str,
            record.get("created_at", ""),
            record.get("evaluated_at", ""),
            record.get("trading_category") or map_strategy_to_category(record.get("strategy_type", "BPJS"))
        ))
        conn.commit()
    return record


def get_all_evaluation_records(
    strategy: Optional[str] = None,
    status: Optional[str] = None,
    date_str: Optional[str] = None,
    trading_category: Optional[str] = None,
    limit: int = 250
) -> List[Dict[str, Any]]:
    """
    Query audit evaluation records with optional filters.
    """
    query = "SELECT * FROM signal_evaluations WHERE 1=1"
    params = []

    if trading_category and trading_category.upper() != "ALL":
        query += " AND (trading_category = ? OR (? = 'SWING' AND strategy_type IN ('BSJP', 'BUY_LAYAK', 'HYBRID_QUANT', 'CONFLUENCE', 'SMARTPICK')) OR (? = 'SCALPING' AND strategy_type IN ('BPJS', 'PRE_ARA')))"
        params.extend([trading_category.upper(), trading_category.upper(), trading_category.upper()])

    if strategy and strategy.upper() != "ALL":
        if strategy.upper() == "BUY_LAYAK":
            query += " AND strategy_type IN ('BUY_LAYAK', 'HYBRID_QUANT')"
        else:
            query += " AND strategy_type = ?"
            params.append(strategy.upper())

    if status and status.upper() != "ALL":
        query += " AND outcome_status = ?"
        params.append(status.upper())

    if date_str and date_str.upper() != "ALL":
        query += " AND signal_date = ?"
        params.append(date_str)

    query += " ORDER BY signal_date DESC, signal_time DESC LIMIT ?;"
    params.append(limit)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    results = []
    for r in rows:
        d = dict(r)
        d["is_sharia"] = bool(d.get("is_sharia"))
        if d.get("eval_metadata"):
            try:
                d["eval_metadata"] = json.loads(d["eval_metadata"])
            except:
                d["eval_metadata"] = {}
        results.append(d)
    return results


def get_stock_evaluations(symbol: str, limit: int = 500) -> List[Dict[str, Any]]:
    """
    Get evaluations for a single ticker symbol.
    """
    clean_sym = symbol.upper().replace(".JK", "")
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM signal_evaluations
            WHERE REPLACE(symbol, '.JK', '') = ?
            ORDER BY signal_date DESC, signal_time DESC
            LIMIT ?;
        """, (clean_sym, limit))
        rows = cursor.fetchall()

    results = []
    for r in rows:
        d = dict(r)
        d["is_sharia"] = bool(d.get("is_sharia"))
        if d.get("eval_metadata"):
            try:
                d["eval_metadata"] = json.loads(d["eval_metadata"])
            except:
                d["eval_metadata"] = {}
    return results


def get_emiten_win_rate_stats(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Get win rate % and total historical trade audit count for a specific emiten.
    """
    clean_sym = symbol.upper().replace(".JK", "")
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total_signals,
                SUM(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN 1 ELSE 0 END) as evaluated_count,
                SUM(CASE WHEN outcome_status = 'WIN' THEN 1 ELSE 0 END) as win_count,
                ROUND(CAST(SUM(CASE WHEN outcome_status = 'WIN' THEN 1 ELSE 0 END) AS REAL) / NULLIF(SUM(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN 1 ELSE 0 END), 0) * 100.0, 1) as win_rate_pct,
                ROUND(AVG(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN realized_pnl_pct ELSE NULL END), 1) as avg_pnl_pct
            FROM signal_evaluations
            WHERE REPLACE(symbol, '.JK', '') = ?;
        """, (clean_sym,))
        row = cursor.fetchone()
        if row and row["evaluated_count"] and row["evaluated_count"] > 0:
            return {
                "evaluated_count": row["evaluated_count"],
                "win_count": row["win_count"],
                "win_rate_pct": row["win_rate_pct"],
                "avg_pnl_pct": row["avg_pnl_pct"]
            }
    return None


def get_distinct_audit_dates() -> List[str]:
    """
    Get all unique trading dates recorded in audit log.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT signal_date FROM signal_evaluations ORDER BY signal_date DESC;")
        return [row[0] for row in cursor.fetchall() if row[0]]


# Initialize database tables on import
initialize_database()

def get_categories_performance_summary() -> Dict[str, Any]:
    """
    Calculate side-by-side performance metrics across the 3 Major Pillars:
    SCALPING (Intraday), SWING (Multi-Day), and INVEST (Long-Term).
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN strategy_type IN ('BPJS', 'PRE_ARA') THEN 'SCALPING'
                    WHEN strategy_type IN ('BSJP', 'BUY_LAYAK', 'HYBRID_QUANT', 'CONFLUENCE', 'SMARTPICK') THEN 'SWING'
                    ELSE 'INVEST'
                END as cat,
                COUNT(*) as total_trades,
                SUM(CASE WHEN outcome_status = 'WIN' THEN 1 ELSE 0 END) as win_count,
                SUM(CASE WHEN outcome_status = 'LOSS' THEN 1 ELSE 0 END) as loss_count,
                SUM(CASE WHEN outcome_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
                AVG(CASE WHEN outcome_status = 'WIN' THEN realized_pnl_pct ELSE NULL END) as avg_win,
                AVG(CASE WHEN outcome_status = 'LOSS' THEN realized_pnl_pct ELSE NULL END) as avg_loss,
                AVG(realized_pnl_pct) as avg_pnl,
                MAX(realized_pnl_pct) as max_gain,
                MIN(realized_pnl_pct) as max_loss
            FROM signal_evaluations
            GROUP BY cat;
        """)
        rows = cursor.fetchall()

    result = {
        "SCALPING": {"name": "Scalping (Intraday)", "holding": "09:15 - 15:45 WIB (Zero Overnight)", "target_pnl": "+2.5% s/d +7.0% / ARA", "cut_loss": "-1.5% s/d -2.5%", "total_trades": 0, "win_count": 0, "loss_count": 0, "win_rate_pct": 0.0, "avg_pnl_pct": 0.0, "avg_win_pct": 0.0, "avg_loss_pct": 0.0, "max_gain_pct": 0.0, "max_loss_pct": 0.0, "profit_factor": 0.0, "strategies": ["BPJS", "PRE_ARA"]},
        "SWING": {"name": "Swing Trading", "holding": "3 - 20 Hari Bursa", "target_pnl": "+8.0% s/d +25.0%", "cut_loss": "-4.0% s/d -6.0%", "total_trades": 0, "win_count": 0, "loss_count": 0, "win_rate_pct": 0.0, "avg_pnl_pct": 0.0, "avg_win_pct": 0.0, "avg_loss_pct": 0.0, "max_gain_pct": 0.0, "max_loss_pct": 0.0, "profit_factor": 0.0, "strategies": ["BSJP", "BUY_LAYAK", "CONFLUENCE", "SMARTPICK"]},
        "INVEST": {"name": "Investasi Jangka Panjang", "holding": "3 Bulan - 2+ Tahun", "target_pnl": "+30.0% s/d +100%+ (plus Dividen)", "cut_loss": "Evaluasi Fundamental (DCA)", "total_trades": 0, "win_count": 0, "loss_count": 0, "win_rate_pct": 0.0, "avg_pnl_pct": 0.0, "avg_win_pct": 0.0, "avg_loss_pct": 0.0, "max_gain_pct": 0.0, "max_loss_pct": 0.0, "profit_factor": 0.0, "strategies": ["VALUE_INVEST", "DIVIDEND_GROWTH", "GROWTH_COMPOUNDER"]}
    }

    for r in rows:
        c = dict(r)
        cat_key = c.get("cat")
        if cat_key in result:
            tot = c.get("total_trades") or 0
            wins = c.get("win_count") or 0
            wr = round((wins / tot * 100.0), 1) if tot > 0 else 0.0
            avg_w = round(float(c.get("avg_win") or 0.0), 2)
            avg_l = round(float(c.get("avg_loss") or 0.0), 2)
            pf = round(abs(avg_w / (avg_l if avg_l != 0 else -1.0)), 2)
            result[cat_key].update({
                "total_trades": tot,
                "win_count": wins,
                "loss_count": c.get("loss_count") or 0,
                "pending_count": c.get("pending_count") or 0,
                "win_rate_pct": wr,
                "avg_pnl_pct": round(float(c.get("avg_pnl") or 0.0), 2),
                "avg_win_pct": avg_w,
                "avg_loss_pct": avg_l,
                "max_gain_pct": round(float(c.get("max_gain") or 0.0), 2),
                "max_loss_pct": round(float(c.get("max_loss") or 0.0), 2),
                "profit_factor": pf
            })

    return result


def get_stock_rankings(
    min_signals: int = 1,
    strategy: Optional[str] = None,
    trading_category: Optional[str] = None,
    sort_by: str = "win_rate",
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get ranked leaderboard of stocks/emitens based on win rate, total PnL, and audit frequency.
    Allows filtering by minimum signals, strategy, and trading pillar (SCALPING, SWING, INVEST).
    """
    where_clauses = ["1=1"]
    params: List[Any] = []

    if trading_category and isinstance(trading_category, str) and trading_category.upper() != "ALL":
        cat = trading_category.upper()
        where_clauses.append("(trading_category = ? OR (? = 'SWING' AND strategy_type IN ('BSJP', 'BUY_LAYAK', 'HYBRID_QUANT', 'CONFLUENCE', 'SMARTPICK')) OR (? = 'SCALPING' AND strategy_type IN ('BPJS', 'PRE_ARA')))")
        params.extend([cat, cat, cat])

    if strategy and isinstance(strategy, str) and strategy.upper() != "ALL":
        strat = strategy.upper()
        if strat == "BUY_LAYAK":
            where_clauses.append("strategy_type IN ('BUY_LAYAK', 'HYBRID_QUANT')")
        else:
            where_clauses.append("strategy_type = ?")
            params.append(strat)

    where_sql = " AND ".join(where_clauses)

    if sort_by == "total_pnl":
        order_by = "total_pnl_pct DESC, win_rate_pct DESC, evaluated_count DESC"
    elif sort_by == "total_signals":
        order_by = "total_signals DESC, win_rate_pct DESC, total_pnl_pct DESC"
    elif sort_by == "avg_pnl":
        order_by = "avg_pnl_pct DESC, win_rate_pct DESC"
    else:
        order_by = "win_rate_pct DESC, evaluated_count DESC, total_pnl_pct DESC"

    query = f"""
        SELECT 
            symbol,
            MAX(name) as name,
            MAX(sector) as sector,
            MAX(is_sharia) as is_sharia,
            COUNT(*) as total_signals,
            SUM(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN 1 ELSE 0 END) as evaluated_count,
            SUM(CASE WHEN outcome_status = 'WIN' THEN 1 ELSE 0 END) as win_count,
            SUM(CASE WHEN outcome_status = 'LOSS' THEN 1 ELSE 0 END) as loss_count,
            SUM(CASE WHEN outcome_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
            ROUND(CAST(SUM(CASE WHEN outcome_status = 'WIN' THEN 1 ELSE 0 END) AS REAL) / NULLIF(SUM(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN 1 ELSE 0 END), 0) * 100.0, 1) as win_rate_pct,
            ROUND(AVG(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN realized_pnl_pct ELSE NULL END), 2) as avg_pnl_pct,
            ROUND(SUM(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN realized_pnl_pct ELSE 0 END), 2) as total_pnl_pct,
            ROUND(MAX(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN realized_pnl_pct ELSE NULL END), 2) as best_trade_pct,
            ROUND(MIN(CASE WHEN outcome_status IN ('WIN', 'LOSS') THEN realized_pnl_pct ELSE NULL END), 2) as worst_trade_pct,
            GROUP_CONCAT(DISTINCT strategy_type) as strategies,
            MAX(signal_date) as last_signal_date
        FROM signal_evaluations
        WHERE {where_sql}
        GROUP BY symbol
        HAVING evaluated_count >= ?
        ORDER BY {order_by}
        LIMIT ?;
    """
    params.extend([max(1, min_signals), limit])

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    results = []
    for r in rows:
        d = dict(r)
        d["is_sharia"] = bool(d.get("is_sharia"))
        d["clean_symbol"] = (d.get("symbol") or "").replace(".JK", "")
        strat_str = d.get("strategies") or ""
        d["strategies_list"] = [s.strip() for s in strat_str.split(",") if s.strip()]
        results.append(d)
    return results

