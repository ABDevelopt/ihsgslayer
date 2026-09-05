"""
Unit Tests for Friday Risk Shield & Weekend De-Risking Protocol.
Verifies:
1. FridayShieldEngine detection & risk profile generation.
2. 50% Position Sizing cap calculation on Friday.
3. Strict BSJP filter for weekend holding (skor >= 70 & 65-hour exposure badge).
4. MorningFadeEngine Friday schedule (Sholat Jumat 11:30 - 14:00, De-risking afternoon).
5. FastAPI Intraday endpoints (/intraday/friday-shield and /intraday/radar).
"""

from datetime import datetime
import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.analytics.friday_shield import FridayShieldEngine
from src.analytics.morning_fade_engine import MorningFadeEngine
from src.analytics.bsjp import BSJPEngine, BSJPCandidateResult

client = TestClient(app)


def test_friday_detection_and_profile():
    engine = FridayShieldEngine.get_instance()

    # Friday test date: 2026-09-04 (Friday)
    dt_friday = datetime(2026, 9, 4, 10, 0, 0)
    assert engine.is_friday(dt_friday) is True
    prof_fri = engine.get_friday_risk_profile(dt_friday)
    assert prof_fri["is_friday"] is True
    assert prof_fri["position_size_multiplier"] == 0.50
    assert prof_fri["recommended_cash_reserve_pct"] == 70.0
    assert prof_fri["weekend_exposure_hours"] == 65.0
    assert "FRIDAY DE-RISKING" in prof_fri["risk_badge"]

    # Non-Friday test date: 2026-09-02 (Wednesday)
    dt_wed = datetime(2026, 9, 2, 10, 0, 0)
    assert engine.is_friday(dt_wed) is False
    prof_wed = engine.get_friday_risk_profile(dt_wed)
    assert prof_wed["is_friday"] is False
    assert prof_wed["position_size_multiplier"] == 1.0
    assert prof_wed["recommended_cash_reserve_pct"] == 20.0
    assert prof_wed["weekend_exposure_hours"] == 17.0


def test_friday_sizing_discount():
    engine = FridayShieldEngine.get_instance()

    # Friday: Rp 10.000.000 -> Rp 5.000.000
    dt_friday = datetime(2026, 9, 4, 10, 0, 0)
    adj_fri = engine.calculate_adjusted_sizing(10_000_000.0, dt_friday)
    assert adj_fri["is_friday"] is True
    assert adj_fri["multiplier"] == 0.50
    assert adj_fri["adjusted_amount"] == 5_000_000.0
    assert adj_fri["discount_applied_pct"] == 50.0

    # Tuesday: Rp 10.000.000 -> Rp 10.000.000
    dt_tue = datetime(2026, 9, 1, 10, 0, 0)
    adj_tue = engine.calculate_adjusted_sizing(10_000_000.0, dt_tue)
    assert adj_tue["is_friday"] is False
    assert adj_tue["multiplier"] == 1.0
    assert adj_tue["adjusted_amount"] == 10_000_000.0


def test_weekend_bsjp_candidate_filtering():
    engine = FridayShieldEngine.get_instance()

    mock_candidates = [
        {"symbol": "STRONG.JK", "bsjp_score": 78.5, "name": "Strong Corp"},
        {"symbol": "MEDIOCRE.JK", "bsjp_score": 62.0, "name": "Mediocre Corp"},
        {"symbol": "WEAK.JK", "bsjp_score": 52.0, "name": "Weak Corp"},
    ]

    # 1. On Friday: only score >= 70 qualifies
    dt_friday = datetime(2026, 9, 4, 15, 0, 0)
    filtered_fri = engine.filter_weekend_bsjp_candidates(mock_candidates, dt_friday)
    assert len(filtered_fri) == 1
    assert filtered_fri[0]["symbol"] == "STRONG.JK"
    assert filtered_fri[0]["is_weekend_qualified"] is True
    assert filtered_fri[0]["weekend_exposure_hours"] == 65.0
    assert "LOLOS FILTER WEEKEND" in filtered_fri[0]["weekend_risk_badge"]

    # 2. On Thursday: all score >= 50 qualify
    dt_thu = datetime(2026, 9, 3, 15, 0, 0)
    filtered_thu = engine.filter_weekend_bsjp_candidates(mock_candidates, dt_thu)
    assert len(filtered_thu) == 3


def test_morning_fade_engine_friday_schedule():
    fade_engine = MorningFadeEngine.get_instance()

    # 1. Friday Prayer Break: 12:15 WIB
    dt_prayer = datetime(2026, 9, 4, 12, 15, 0)
    p_prayer = fade_engine.get_current_intraday_phase(dt_prayer)
    assert p_prayer["is_friday"] is True
    assert p_prayer["status"] == "BREAK"
    assert "SHOLAT JUMAT" in p_prayer["badge"]

    # 2. Friday Sesi 2 Opening: 14:15 WIB
    dt_sesi2 = datetime(2026, 9, 4, 14, 15, 0)
    p_sesi2 = fade_engine.get_current_intraday_phase(dt_sesi2)
    assert p_sesi2["is_friday"] is True
    assert p_sesi2["phase_key"] == "AFTERNOON_DISCOVERY"
    assert "SESI 2 JUMAT" in p_sesi2["badge"]

    # 3. Friday Afternoon De-risking: 15:00 WIB
    dt_derisk = datetime(2026, 9, 4, 15, 0, 0)
    p_derisk = fade_engine.get_current_intraday_phase(dt_derisk)
    assert p_derisk["is_friday"] is True
    assert "WEEKEND DE-RISKING" in p_derisk["badge"]
    assert "70%" in p_derisk["tactical_action"]

    # 4. Friday Pre-Closing: 15:50 WIB
    dt_close = datetime(2026, 9, 4, 15, 50, 0)
    p_close = fade_engine.get_current_intraday_phase(dt_close)
    assert p_close["is_friday"] is True
    assert "100% CASH" in p_close["badge"]


def test_friday_api_endpoints():
    # 1. /friday-shield endpoint
    r1 = client.get("/api/v1/intraday/friday-shield")
    assert r1.status_code == 200
    d1 = r1.json()
    assert "is_friday" in d1
    assert "position_size_multiplier" in d1
    assert "recommended_cash_reserve_pct" in d1
    assert "rules" in d1

    # 2. /radar endpoint includes friday_shield
    r2 = client.get("/api/v1/intraday/radar")
    assert r2.status_code == 200
    d2 = r2.json()
    assert "friday_shield" in d2
