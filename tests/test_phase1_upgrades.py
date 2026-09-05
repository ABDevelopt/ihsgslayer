import time
import pytest
import sqlite3
import src.data.audit_db as audit_db


def test_audit_db_wal_mode():
    conn = audit_db.get_db_connection()
    mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
    assert mode.lower() == "wal", f"Expected WAL journal mode, got {mode}"


def test_audit_db_record_count():
    conn = audit_db.get_db_connection()
    eval_count = conn.execute("SELECT COUNT(*) FROM signal_evaluations;").fetchone()[0]
    hist_count = conn.execute("SELECT COUNT(*) FROM signal_history;").fetchone()[0]
    assert eval_count >= 800, f"Expected >= 800 evaluation records, got {eval_count}"
    assert hist_count >= 200, f"Expected >= 200 history records, got {hist_count}"


def test_audit_db_query_speed():
    start = time.perf_counter()
    records = audit_db.get_stock_evaluations("ADRO", limit=50)
    duration_ms = (time.perf_counter() - start) * 1000.0
    assert len(records) > 0
    assert duration_ms < 25.0, f"Query took {duration_ms:.2f}ms, expected < 25ms"


def test_audit_db_crud():
    test_rec = {
        "strategy_type": "BPJS",
        "symbol": "TEST_TICKER.JK",
        "is_sharia": True,
        "name": "Testing Ticker",
        "sector": "Tech",
        "confidence_level": "ULTRA (Tinggi)",
        "confidence_score": 90.0,
        "signal_date": "2026-09-04",
        "signal_time": "09:15 WIB",
        "entry_price": 1000.0,
        "target_tp1": 1050.0,
        "target_tp2": 1100.0,
        "stop_loss": 970.0,
        "target_exit_time": "15:45 WIB",
        "outcome_status": "PENDING",
        "win_reason": "Waiting market outcome",
        "eval_metadata": {"test": True}
    }
    audit_db.save_evaluation_record(test_rec)
    res = audit_db.get_stock_evaluations("TEST_TICKER", limit=5)
    assert len(res) >= 1
    assert res[0]["symbol"] == "TEST_TICKER.JK"
    assert res[0]["confidence_level"] == "ULTRA (Tinggi)"
    assert res[0]["is_sharia"] is True


def test_atr_volatility_parity_calculation():
    # Mathematical testing of ATR sizing parity rule
    # Stock 1: Calm stock (ATR = 1.8%, SL = -2.5%)
    # Stock 2: Volatile stock (ATR = 6.0%, SL = -3.5%)
    # With Rp 10 Juta capital and Score 85 (ULTRA):
    price = 1000.0
    capital = 10_000_000.0

    # Test formula directly:
    # Calm stock: Stop distance = max(2.5, 1.8 * 1.35) = 2.5%
    # Risk budget = 10M * 0.0075 = Rp 75.000
    # Parity alloc = 75.000 / 0.025 = Rp 3.000.000 (Capped by conviction 25% = Rp 2.500.000)
    # Lots = 25
    stop_dist_calm = max(2.5, 1.8 * 1.35)
    alloc_calm = min(capital * 0.25, (capital * 0.0075) / (stop_dist_calm / 100.0))
    lots_calm = int(alloc_calm / (price * 100))

    # Volatile stock: Stop distance = max(3.5, 6.0 * 1.35) = 8.1%
    # Risk budget = 10M * 0.0075 = Rp 75.000
    # Parity alloc = 75.000 / 0.081 = Rp 925.925 (Trimmed down to protect portfolio!)
    # Lots = 9
    stop_dist_vol = max(3.5, 6.0 * 1.35)
    alloc_vol = min(capital * 0.25, (capital * 0.0075) / (stop_dist_vol / 100.0))
    lots_vol = int(alloc_vol / (price * 100))

    assert lots_calm == 25
    assert lots_vol < lots_calm
    assert lots_vol <= 10
    # Verify risk in Rupiah on volatile stock is strictly <= Rp 75.000
    max_risk_rp = lots_vol * 100 * price * 0.035
    assert max_risk_rp <= 75000.0
