"""
Unit & Integration Tests for Morning Fade & Intraday Cycle Protection Engine.
Verifies:
1. MorningFadeEngine phase timing detection across all trading hours (WIB)
2. Morning Fade vs Healthy Retest candle anatomy detection
3. Breakeven profit lock calculation & ForwardTestEngine auto-elevation
4. FastAPI Intraday endpoints (/intraday/radar, /fade-screener, /lock-breakeven)
"""

from datetime import datetime
import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.analytics.morning_fade_engine import MorningFadeEngine
from src.analytics.forward_tester import ForwardTestEngine

client = TestClient(app)


def test_intraday_phase_detection():
    engine = MorningFadeEngine.get_instance()

    # 1. Pre-Opening 08:50 (Thursday - standard schedule)
    dt_pre = datetime(2026, 9, 3, 8, 50, 0)
    p_pre = engine.get_current_intraday_phase(dt_pre)
    assert p_pre["phase_key"] == "PRE_OPENING"
    assert p_pre["is_exit_window"] is True

    # 2. Morning Euphoria 09:10 -> SELLER MODE ONLY (Blocked BPJS)
    dt_euphoria = datetime(2026, 9, 3, 9, 10, 0)
    p_euphoria = engine.get_current_intraday_phase(dt_euphoria)
    assert p_euphoria["phase_key"] == "MORNING_EUPHORIA"
    assert p_euphoria["is_fomo_danger"] is True
    assert p_euphoria["trader_mode"] == "SELLER_MODE"
    assert p_euphoria["allow_bpjs_buy"] is False
    assert "SELLER MODE" in p_euphoria["badge"]

    # 3. BPJS Sweet Spot 09:20 -> BUYER MODE BPJS (Approved)
    dt_bpjs = datetime(2026, 9, 3, 9, 20, 0)
    p_bpjs = engine.get_current_intraday_phase(dt_bpjs)
    assert p_bpjs["phase_key"] == "BPJS_SWEET_SPOT"
    assert p_bpjs["trader_mode"] == "BUYER_MODE_BPJS"
    assert p_bpjs["allow_bpjs_buy"] is True
    assert "BUYER MODE" in p_bpjs["badge"]

    # 4. Morning Retest 09:45 -> MONITORING MODE (Breakeven Lock)
    dt_retest = datetime(2026, 9, 3, 9, 45, 0)
    p_retest = engine.get_current_intraday_phase(dt_retest)
    assert p_retest["phase_key"] == "MORNING_PULLBACK_RETEST"
    assert p_retest["allow_bpjs_buy"] is False
    assert p_retest["trader_mode"] == "MONITORING_MODE"

    # 5. Midday Vacuum 11:00
    dt_midday = datetime(2026, 9, 3, 11, 0, 0)
    p_midday = engine.get_current_intraday_phase(dt_midday)
    assert p_midday["phase_key"] == "MIDDAY_VACUUM"

    # 6. Closing Accumulation 15:00
    dt_close = datetime(2026, 9, 3, 15, 0, 0)
    p_close = engine.get_current_intraday_phase(dt_close)
    assert p_close["phase_key"] == "CLOSING_ACCUMULATION"
    assert "BSJP" in p_close["badge"]


def test_morning_fade_detection():
    engine = MorningFadeEngine.get_instance()

    # Stock A: Extreme Morning Fade (Spiked to 1080 from prev 1000, now collapsed to 1005)
    fade_res = engine.evaluate_morning_fade(
        symbol="FADE.JK",
        open_price=1010,
        high_price=1080,
        low_price=1000,
        current_price=1005,
        prev_close=1000
    )
    assert fade_res["is_fading"] is True
    assert fade_res["fade_risk"] in ["MODERATE", "CRITICAL"]
    assert fade_res["upper_shadow_ratio"] >= 0.40

    # Stock B: Healthy Retest (Open=Low 1000, High 1050, Retested to 1040 above VWAP 1030)
    retest_res = engine.evaluate_morning_fade(
        symbol="GOOD.JK",
        open_price=1000,
        high_price=1050,
        low_price=1000,
        current_price=1040,
        prev_close=990,
        vwap=1030
    )
    assert retest_res["is_healthy_retest"] is True
    assert retest_res["is_fading"] is False
    assert retest_res["badge_color"] == "emerald"


def test_breakeven_lock_calculation():
    engine = MorningFadeEngine.get_instance()

    # Position in solid profit (+3.5%)
    res_ok = engine.calculate_breakeven_lock(
        entry_price=1000.0,
        current_price=1035.0,
        highest_price=1040.0
    )
    assert res_ok["eligible_for_lock"] is True
    assert res_ok["breakeven_price"] == 1004.0  # 1000 * 1.004

    # Position with minimal gain (+1.0%)
    res_no = engine.calculate_breakeven_lock(
        entry_price=1000.0,
        current_price=1010.0,
        highest_price=1015.0
    )
    assert res_no["eligible_for_lock"] is False


def test_forward_tester_breakeven_lock():
    ft = ForwardTestEngine.get_instance()
    # Create a test position
    pos = ft.open_position(
        symbol="TEST.JK",
        strategy="BPJS",
        entry_price=1000.0,
        shares_lot=10,
        target_tp1=1035.0,
        target_tp2=1070.0,
        stop_loss=975.0
    )
    assert pos.breakeven_lock_active is False

    # Simulate price moving to 1030 (+3.0%)
    ft.sync_live_prices({"TEST.JK": 1030.0})
    for p in ft.portfolio.open_positions:
        if p.id == pos.id:
            assert p.breakeven_lock_active is True
            assert p.stop_loss >= 1004.0

    # Clean up position
    ft.close_position(pos.id, close_price=1030.0, exit_reason="MANUAL")


def test_intraday_api_endpoints():
    # 1. Radar
    r1 = client.get("/api/v1/intraday/radar")
    assert r1.status_code == 200
    d1 = r1.json()
    assert "current_phase" in d1
    assert "full_schedule" in d1
    assert len(d1["full_schedule"]) >= 5

    # 2. Fade Screener
    r2 = client.get("/api/v1/intraday/fade-screener")
    assert r2.status_code == 200
    d2 = r2.json()
    assert "fading_stocks" in d2
    assert "healthy_retests" in d2

    # 3. Lock Breakeven
    r3 = client.post("/api/v1/intraday/lock-breakeven?min_gain_pct=2.0")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["status"] == "SUCCESS"
    assert "positions_locked" in d3


def test_bpjs_timing_gate_validation():
    from src.analytics.bpjs import BPJSEngine

    # 1. 09:05 WIB: Should be BLOCKED (Seller Mode)
    gate_0905 = BPJSEngine.get_bpjs_timing_gate(datetime(2026, 9, 4, 9, 5, 0))
    assert gate_0905["allow_bpjs_buy"] is False
    assert gate_0905["trader_mode"] == "SELLER_MODE"
    assert gate_0905["bpjs_gate_status"] == "BLOCKED_DATA_UNCONFIRMED"

    # 2. 09:20 WIB: Should be APPROVED (Buyer Mode BPJS)
    gate_0920 = BPJSEngine.get_bpjs_timing_gate(datetime(2026, 9, 4, 9, 20, 0))
    assert gate_0920["allow_bpjs_buy"] is True
    assert gate_0920["trader_mode"] == "BUYER_MODE_BPJS"
    assert gate_0920["bpjs_gate_status"] == "APPROVED_ACTIVE"

    # 3. API endpoint integration with mocked scanner to prevent external HTTP
    from unittest.mock import patch
    with patch.object(BPJSEngine, "scan_bpjs_universe", return_value=[]), \
         patch("src.data.collector.DataCollector.fetch_universe_ohlcv_parallel", return_value={}):
        r = client.get("/api/v1/screener/bpjs")
        assert r.status_code == 200
        data = r.json()
        assert "timing_gate" in data
        assert "trader_mode" in data["timing_gate"]
        assert "allow_bpjs_buy" in data["timing_gate"]