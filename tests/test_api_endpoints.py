import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_api_stock_overview():
    response = client.get("/api/v1/stocks/BBCA.JK")
    assert response.status_code == 200
    data = response.json()
    assert "ai_score" in data
    assert "active_patterns" in data
    assert "order_flow" in data
    assert "fundamentals" in data
    assert data["ai_score"]["ai_score"] >= 0.0

def test_api_screener_query():
    payload = {
        "min_ai_score": 60.0,
        "exclude_danger_zone": True,
        "limit": 10
    }
    response = client.post("/api/v1/screener/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data

def test_api_screener_natural_language():
    response = client.post(
        "/api/v1/screener/natural-language",
        json={"query": "saham perbankan undervalue dengan area demand"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "parsed_filter" in data
    assert "results" in data

def test_api_backtest_run():
    response = client.post("/api/v1/backtest/run", json={
        "initial_capital": 100000000.0,
        "min_ai_score": 70.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "trade_metrics" in data
    assert "equity_metrics" in data

def test_api_journal_workflow():
    # 1. Record Buy
    buy_trade = {
        "date": "2026-08-26",
        "symbol": "BBCA.JK",
        "action": "BUY",
        "shares": 1000,
        "price": 9500.0,
        "fee": 15000.0
    }
    buy_res = client.post("/api/v1/journal/buy", json=buy_trade)
    assert buy_res.status_code == 200

    # 2. Check Portfolio Valuation & NAV
    port_res = client.get("/api/v1/journal/portfolio")
    assert port_res.status_code == 200
    port_data = port_res.json()
    assert port_data.get("nav_per_unit", 1000.0) > 0
    assert len(port_data["open_positions"]) >= 1

    # 3. Record Partial Sell
    sell_trade = {
        "date": "2026-08-26",
        "symbol": "BBCA.JK",
        "action": "SELL",
        "shares": 500,
        "price": 9800.0,
        "fee": 12500.0
    }
    sell_res = client.post("/api/v1/journal/sell", json=sell_trade)
    assert sell_res.status_code == 200
    sell_data = sell_res.json()
    assert sell_data["realized_pnl_amt"] > 0

def test_api_buy_signals():
    response = client.get("/api/v1/screener/buy-signals?min_score=60.0")
    assert response.status_code == 200
    data = response.json()
    assert "signals" in data
    assert "count" in data
    assert isinstance(data["signals"], list)

def test_api_bpjs():
    response = client.get("/api/v1/screener/bpjs?min_score=60.0")
    assert response.status_code == 200
    data = response.json()
    assert "candidates" in data
    assert "session" in data
    assert isinstance(data["candidates"], list)
