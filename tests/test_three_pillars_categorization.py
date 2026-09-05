import pytest
from fastapi.testclient import TestClient
from src.api.main import app
import src.data.audit_db as audit_db

client = TestClient(app)


def test_map_strategy_to_category():
    """Verify strategy mapping into 3 major pillars."""
    assert audit_db.map_strategy_to_category("BPJS") == "SCALPING"
    assert audit_db.map_strategy_to_category("PRE_ARA") == "SCALPING"
    assert audit_db.map_strategy_to_category("BSJP") == "SWING"
    assert audit_db.map_strategy_to_category("BUY_LAYAK") == "SWING"
    assert audit_db.map_strategy_to_category("CONFLUENCE") == "SWING"
    assert audit_db.map_strategy_to_category("VALUE_INVEST") == "INVEST"
    assert audit_db.map_strategy_to_category("DIVIDEND_GROWTH") == "INVEST"


def test_categories_performance_summary_db():
    """Verify SQLite WAL database returns isolated metrics for 3 pillars."""
    summary = audit_db.get_categories_performance_summary()
    assert "SCALPING" in summary
    assert "SWING" in summary
    assert "INVEST" in summary

    scalping = summary["SCALPING"]
    assert scalping["total_trades"] > 0
    assert scalping["win_rate_pct"] > 50.0  # BPJS & Pre-ARA high win rate

    swing = summary["SWING"]
    assert swing["total_trades"] > 0
    assert "strategies" in swing


def test_api_evaluation_categories_endpoint():
    """Verify GET /api/v1/evaluation/categories endpoint."""
    r = client.get("/api/v1/evaluation/categories")
    assert r.status_code == 200
    data = r.json()
    assert "SCALPING" in data
    assert "SWING" in data
    assert "INVEST" in data
    assert data["SCALPING"]["name"] == "Scalping (Intraday)"
    assert data["SWING"]["name"] == "Swing Trading"


def test_api_evaluation_records_with_category_filter():
    """Verify filtering audit records by trading category."""
    # Scalping filter
    r_scalp = client.get("/api/v1/evaluation/records?trading_category=SCALPING&limit=50")
    assert r_scalp.status_code == 200
    recs_scalp = r_scalp.json()["records"]
    assert len(recs_scalp) > 0
    for r in recs_scalp:
        assert r["strategy_type"] in ("BPJS", "PRE_ARA")

    # Swing filter
    r_swing = client.get("/api/v1/evaluation/records?trading_category=SWING&limit=50")
    assert r_swing.status_code == 200
    recs_swing = r_swing.json()["records"]
    assert len(recs_swing) > 0
    for r in recs_swing:
        assert r["strategy_type"] in ("BSJP", "BUY_LAYAK", "HYBRID_QUANT", "CONFLUENCE", "SMARTPICK")
