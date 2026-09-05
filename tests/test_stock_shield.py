import pytest
from src.analytics.stock_shield import StockShieldEngine

def test_clean_compliant_stock():
    engine = StockShieldEngine()
    fund = {
        "roe": 21.0,
        "npm": 35.0,
        "der": 0.2,
        "pbv": 4.0,
        "per": 18.0,
        "net_profit_growth": 14.0
    }
    res = engine.evaluate_stock_safety(
        symbol="BBCA.JK",
        price=9850.0,
        fundamentals=fund,
        adtv_20=500_000_000_000.0,  # 500 Miliar/day
        return_1m=3.5,
        return_3m=8.2,
        volume_intensity=1.1,
        atr_pct=1.8
    )
    assert res["risk_level"] == "SAFE_TIER_ALPHA"
    assert res["is_safe_to_buy"] is True
    assert res["is_fca_hazard"] is False
    assert res["is_suspension_hazard"] is False
    assert res["is_arb_hazard"] is False
    assert res["safety_score"] >= 90.0
    assert len(res["warning_flags"]) == 0

def test_saham_gorengan_pump_and_dump_suspension():
    engine = StockShieldEngine()
    fund = {
        "roe": -12.0,
        "npm": -25.0,
        "der": 2.5,
        "pbv": 8.0,
        "per": -5.0
    }
    # Pumped 65% in 1 month despite burning cash -> Suspension hazard
    res = engine.evaluate_stock_safety(
        symbol="GORG.JK",
        price=350.0,
        fundamentals=fund,
        adtv_20=2_000_000_000.0,
        return_1m=65.0,
        return_3m=120.0,
        volume_intensity=6.2,
        atr_pct=9.5
    )
    assert res["is_suspension_hazard"] is True
    assert res["risk_level"] in ["SUSPENSION_HAZARD", "CRITICAL_HAZARD"]
    assert res["is_safe_to_buy"] is False
    assert any("Suspensi" in f or "UMA" in f for f in res["warning_flags"])

def test_penny_stock_fca_trap():
    engine = StockShieldEngine()
    fund = {
        "roe": 1.0,
        "npm": 0.5,
        "der": 1.1,
        "pbv": 0.5,
        "per": 50.0
    }
    # Price Rp 50 (at gocap <= 51), transaction only 80 Jt/day -> FCA hazard
    res = engine.evaluate_stock_safety(
        symbol="GCAP.JK",
        price=50.0,
        fundamentals=fund,
        adtv_20=80_000_000.0,
        return_1m=0.0,
        return_3m=0.0
    )
    assert res["is_fca_hazard"] is True
    assert res["risk_level"] in ["FCA_HAZARD", "CRITICAL_HAZARD"]
    assert res["is_safe_to_buy"] is False
    assert any("Kriteria 1 FCA" in f or "Kriteria 7 FCA" in f for f in res["warning_flags"])

def test_extreme_insolvency_fca_trap():
    engine = StockShieldEngine()
    fund = {
        "roe": -28.0,
        "npm": -40.0,
        "der": 7.5,
        "pbv": 2.0,
        "per": -2.0,
        "bvps": -50.0
    }
    res = engine.evaluate_stock_safety(
        symbol="UTNG.JK",
        price=450.0,
        fundamentals=fund,
        adtv_20=5_000_000_000.0,
        return_1m=-15.0,
        return_3m=-45.0
    )
    assert res["is_fca_hazard"] is True
    assert res["is_safe_to_buy"] is False
    assert any("Kriteria 5 FCA" in f for f in res["warning_flags"])
