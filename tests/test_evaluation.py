import pytest
import os
import pandas as pd
from src.analytics.signal_evaluator import SignalEvaluatorEngine
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_record_signal_and_persistence(tmp_path):
    test_file = str(tmp_path / "test_evals.json")
    
    rec1 = SignalEvaluatorEngine.record_signal(
        strategy_type="BPJS",
        symbol="ICBP.JK",
        name="Indofood CBP Sukses Makmur Tbk",
        sector="Consumer",
        entry_price=7850.0,
        target_tp1=8125.0,
        target_tp2=8400.0,
        stop_loss=7650.0
    )
    assert rec1["symbol"] == "ICBP.JK"
    assert rec1["strategy_type"] == "BPJS"
    assert rec1["outcome_status"] == "PENDING"
    assert rec1["entry_price"] == 7850.0

def test_evaluate_bpjs_outcome_win():
    record = {
        "id": 101,
        "strategy_type": "BPJS",
        "symbol": "ICBP.JK",
        "entry_price": 7850.0,
        "target_tp1": 8125.0,
        "target_tp2": 8400.0,
        "stop_loss": 7650.0,
        "outcome_status": "PENDING"
    }
    # Market reached high 8150 (> TP1 8125), low 7800 (> SL 7650)
    df = pd.DataFrame([{
        "open": 7850.0,
        "high": 8150.0,
        "low": 7800.0,
        "close": 8100.0,
        "volume": 5000000
    }])

    evaluated = SignalEvaluatorEngine.evaluate_signal_outcome(record, df)
    assert evaluated["outcome_status"] == "WIN"
    assert evaluated["realized_pnl_pct"] > 3.0
    assert "TP1" in evaluated["win_reason"]

def test_evaluate_bpjs_outcome_loss():
    record = {
        "id": 102,
        "strategy_type": "BPJS",
        "symbol": "TEST.JK",
        "entry_price": 1000.0,
        "target_tp1": 1050.0,
        "target_tp2": 1100.0,
        "stop_loss": 975.0,
        "outcome_status": "PENDING"
    }
    # Market dropped to low 960 (hit SL 975)
    df = pd.DataFrame([{
        "open": 1000.0,
        "high": 1010.0,
        "low": 960.0,
        "close": 970.0,
        "volume": 2000000
    }])

    evaluated = SignalEvaluatorEngine.evaluate_signal_outcome(record, df)
    assert evaluated["outcome_status"] == "LOSS"
    assert evaluated["realized_pnl_pct"] < 0
    assert "Cut Loss" in evaluated["win_reason"]

def test_evaluate_bsjp_outcome_gapup_win():
    record = {
        "id": 103,
        "strategy_type": "BSJP",
        "symbol": "BBRI.JK",
        "entry_price": 3100.0,
        "target_tp1": 3200.0,
        "target_tp2": 3300.0,
        "stop_loss": 3020.0,
        "outcome_status": "PENDING"
    }
    # Next day candle opened with gap-up at 3180 (+2.58%)
    df = pd.DataFrame([
        {"open": 3050.0, "high": 3110.0, "low": 3040.0, "close": 3100.0, "volume": 10000000},
        {"open": 3180.0, "high": 3220.0, "low": 3170.0, "close": 3200.0, "volume": 12000000}
    ])

    evaluated = SignalEvaluatorEngine.evaluate_signal_outcome(record, df)
    assert evaluated["outcome_status"] == "WIN"
    assert evaluated["realized_pnl_pct"] > 2.0
    assert "Gap-Up" in evaluated["win_reason"]

def test_summary_metrics_calculation():
    sample_records = [
        {"strategy_type": "BPJS", "outcome_status": "WIN", "realized_pnl_pct": 4.0},
        {"strategy_type": "BPJS", "outcome_status": "WIN", "realized_pnl_pct": 3.5},
        {"strategy_type": "BPJS", "outcome_status": "LOSS", "realized_pnl_pct": -2.5},
        {"strategy_type": "BSJP", "outcome_status": "WIN", "realized_pnl_pct": 3.0},
        {"strategy_type": "BSJP", "outcome_status": "LOSS", "realized_pnl_pct": -2.0}
    ]
    summary = SignalEvaluatorEngine.calculate_summary_metrics(sample_records)
    assert summary["total_signals"] == 5
    assert summary["win_count"] == 3
    assert summary["loss_count"] == 2
    assert summary["win_rate_pct"] == 60.0
    assert summary["profit_factor"] > 2.0
    assert summary["bpjs_metrics"]["win_rate"] == 66.7
    assert summary["bsjp_metrics"]["win_rate"] == 50.0

def test_api_evaluation_endpoints():
    res_summary = client.get("/api/v1/evaluation/summary")
    assert res_summary.status_code == 200
    s_data = res_summary.json()
    assert "win_rate_pct" in s_data
    assert "profit_factor" in s_data
    assert "bpjs_metrics" in s_data
    assert "bsjp_metrics" in s_data

    res_records = client.get("/api/v1/evaluation/records?strategy=ALL")
    assert res_records.status_code == 200
    r_data = res_records.json()
    assert "records" in r_data
    assert len(r_data["records"]) > 0


def test_stock_evaluation_endpoint():
    res = client.get("/api/v1/evaluation/stock/ADRO")
    assert res.status_code == 200
    data = res.json()
    assert data["clean_symbol"] == "ADRO"
    assert "win_rate_pct" in data
    assert "total_signals" in data
    assert "strategies" in data
    assert "records" in data
