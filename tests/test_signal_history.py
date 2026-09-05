import pytest
from src.analytics.signal_history import SignalHistoryEngine
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_record_signal_history_event():
    event = SignalHistoryEngine.record_signal_event(
        signal_type="BPJS_PAGI",
        symbol="TEST.JK",
        name="Test Emiten Tbk",
        sector="Technology",
        price_at_signal=1250.0,
        ai_score=82.0,
        setup_pattern="Morning Breakout",
        entry_zone="Rp 1,240 - Rp 1,260",
        target_tp1="Rp 1,300 (+4.0%)",
        stop_loss="Rp 1,215 (-2.8%)",
        target_tp2="Rp 1,350 (+8.0%)",
        risk_reward="1 : 1.4",
        rationale="Test signal trigger history event"
    )
    assert event["symbol"] == "TEST.JK"
    assert event["signal_type"] == "BPJS_PAGI"
    assert "WIB" in event["timestamp"]
    assert event["price_at_signal"] == 1250.0

def test_get_signal_history_filtering():
    history_all = SignalHistoryEngine.get_history(limit=50)
    assert len(history_all) > 0

    history_bpjs = SignalHistoryEngine.get_history(signal_type="BPJS_PAGI", limit=50)
    for h in history_bpjs:
        assert h["signal_type"] == "BPJS_PAGI"

    history_sym = SignalHistoryEngine.get_history(symbol="ICBP", limit=50)
    for h in history_sym:
        assert "ICBP" in h["symbol"]

def test_api_signal_history_endpoint():
    res = client.get("/api/v1/evaluation/history?limit=20")
    assert res.status_code == 200
    data = res.json()
    assert "history" in data
    assert len(data["history"]) > 0
    first = data["history"][0]
    assert "timestamp" in first
    assert "signal_time" in first
    assert "price_at_signal" in first
