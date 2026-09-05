import pytest
import json
from fastapi.testclient import TestClient
from src.api.main import app
from src.alerts.tactical_playbook import TacticalPlaybookGenerator
from src.alerts.dispatcher import NotificationDispatcher, AlertSettings
from src.api.routers.stream import manager

client = TestClient(app)


def test_websocket_market_pulse_handshake_and_ping():
    """Test real-time WebSocket connection handshake and ping-pong."""
    with client.websocket_connect("/ws/market-pulse") as ws:
        # Handshake frame
        initial = ws.receive_json()
        assert initial["type"] == "INITIAL_HANDSHAKE"
        assert initial["data"]["protocol"] == "IHSG_STREAM_V1"
        assert initial["data"]["status"] == "ONLINE"

        # Ping-pong
        ws.send_text("ping")
        resp = ws.receive_json()
        assert resp["type"] == "PONG"


def test_alert_settings_get_and_post():
    """Test getting and updating alert settings via API."""
    # GET settings
    r = client.get("/api/v1/alerts/settings")
    assert r.status_code == 200
    data = r.json()
    assert "telegram_enabled" in data
    assert "min_score_filter" in data

    # POST updated settings
    updated = dict(data)
    updated["min_score_filter"] = 77.5
    updated["enable_bpjs_alerts"] = True

    r2 = client.post("/api/v1/alerts/settings", json=updated)
    assert r2.status_code == 200
    assert r2.json()["status"] == "SUCCESS"
    assert r2.json()["settings"]["min_score_filter"] == 77.5


def test_preview_playbook_clean_text():
    """Verify generated tactical playbooks use clean text badges and contain no emojis."""
    r = client.post("/api/v1/alerts/preview-playbook", json={
        "symbol": "BBCA.JK",
        "strategy": "BPJS",
        "entry_price": 10200.0,
        "target_tp1": 10550.0,
        "target_tp2": 10900.0,
        "stop_loss": 9950.0,
        "score": 82.0
    })
    assert r.status_code == 200
    res = r.json()
    assert res["status"] == "SUCCESS"
    playbook = res["playbook"]
    assert "[SINYAL &amp; PANDUAN TAKTIS]" in playbook["telegram_html"]
    assert "[STRATEGI]" in playbook["telegram_html"]
    assert "[EMITEN]" in playbook["telegram_html"]
    assert "[ENTRY PLAYBOOK - LANGKAH BELI]" in playbook["telegram_html"]
    assert "[EXIT PLAYBOOK - LANGKAH JUAL]" in playbook["telegram_html"]


def test_sell_playbook_clean_text():
    """Verify sell execution playbook formatting."""
    playbook = TacticalPlaybookGenerator.generate_sell_playbook(
        symbol="TLKM.JK",
        strategy="BPJS",
        action_type="TAKE_PROFIT_1",
        entry_price=2800.0,
        exit_price=2920.0,
        shares_lot=50,
        realized_pnl_amt=600000.0,
        realized_pnl_pct=4.29,
        holding_duration="Sesi 1 (09:15 - 10:30 WIB)"
    )
    assert "[EKSEKUSI JUAL]" in playbook["telegram_html"]
    assert "[TP1 HIT]" in playbook["telegram_html"]
    assert "[INSTRUKSI TINDAKAN]" in playbook["telegram_html"]
