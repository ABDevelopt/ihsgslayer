import pytest
from datetime import date
from src.analytics.ai_score import AIScoreEngine

@pytest.fixture
def ai_engine():
    return AIScoreEngine()

def test_ai_score_computation_and_bounds(ai_engine):
    sample_universe = [
        {
            "symbol": "BBCA.JK",
            "sector": "Financials",
            "date": date(2026, 8, 26),
            "roe": 22.5,
            "npm": 38.0,
            "roa": 3.8,
            "per": 18.0,
            "pbv": 4.2,
            "der": 0.15,
            "adtv_20": 500e9,
            "return_1m": 4.5,
            "return_3m": 12.0
        },
        {
            "symbol": "BBRI.JK",
            "sector": "Financials",
            "date": date(2026, 8, 26),
            "roe": 19.8,
            "npm": 32.0,
            "roa": 3.1,
            "per": 12.5,
            "pbv": 2.1,
            "der": 0.85,
            "adtv_20": 450e9,
            "return_1m": 2.0,
            "return_3m": 8.5
        },
        {
            "symbol": "BANK_POOR.JK",
            "sector": "Financials",
            "date": date(2026, 8, 26),
            "roe": 2.0,
            "npm": 3.5,
            "roa": 0.4,
            "per": 45.0,
            "pbv": 0.9,
            "der": 2.8,
            "adtv_20": 5e9,
            "return_1m": -8.0,
            "return_3m": -15.0
        }
    ]

    results = ai_engine.compute_score_for_universe(sample_universe)
    assert len(results) == 3

    for r in results:
        assert 0.0 <= r.ai_score <= 100.0
        assert 0.0 <= r.profitability_score <= 100.0
        assert 0.0 <= r.valuation_score <= 100.0
        assert 0.0 <= r.health_score <= 100.0
        assert 0.0 <= r.liquidity_score <= 100.0
        assert 0.0 <= r.momentum_score <= 100.0

    # Top quality bank should score higher than poor bank
    bbca_score = next(r for r in results if r.symbol == "BBCA.JK")
    poor_score = next(r for r in results if r.symbol == "BANK_POOR.JK")
    assert bbca_score.ai_score > poor_score.ai_score

def test_danger_zone_trigger(ai_engine):
    distressed_stock = [
        {
            "symbol": "DISTRESSED.JK",
            "sector": "Energy",
            "date": date(2026, 8, 26),
            "roe": -18.0,
            "npm": -12.0,
            "roa": -5.0,
            "per": -5.0,
            "pbv": 0.4,
            "der": 4.5,
            "adtv_20": 2e9,
            "return_1m": -20.0,
            "return_3m": -40.0
        },
        {
            "symbol": "SOLID_ENERGY.JK",
            "sector": "Energy",
            "date": date(2026, 8, 26),
            "roe": 25.0,
            "npm": 22.0,
            "roa": 15.0,
            "per": 6.5,
            "pbv": 1.2,
            "der": 0.4,
            "adtv_20": 100e9,
            "return_1m": 5.0,
            "return_3m": 15.0
        }
    ]

    results = ai_engine.compute_score_for_universe(distressed_stock)
    distressed_res = next(r for r in results if r.symbol == "DISTRESSED.JK")
    
    assert distressed_res.is_danger_zone is True
    assert distressed_res.label == "DANGER_ZONE"
    assert distressed_res.ai_score <= 35.0
    assert len(distressed_res.danger_zone_reasons) > 0
