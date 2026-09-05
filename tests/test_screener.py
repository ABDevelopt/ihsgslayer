import pytest
from src.screener.engine import ScreenerEngine, ScreenerFilter
from src.screener.nl_parser import NaturalLanguageParser

@pytest.fixture
def screener_engine():
    return ScreenerEngine()

@pytest.fixture
def nl_parser():
    return NaturalLanguageParser()

def test_screener_filtering_and_ranking(screener_engine):
    mock_universe = [
        {
            "symbol": "BBCA.JK",
            "sector": "Financials",
            "ai_score": 85.0,
            "is_danger_zone": False,
            "active_patterns": ["AREA_DEMAND"],
            "adtv_20": 200e9,
            "net_foreign_val": 50e9
        },
        {
            "symbol": "BBRI.JK",
            "sector": "Financials",
            "ai_score": 78.0,
            "is_danger_zone": False,
            "active_patterns": ["THROWBACK_RETEST"],
            "adtv_20": 180e9,
            "net_foreign_val": -10e9
        },
        {
            "symbol": "DANGER_STOCK.JK",
            "sector": "Energy",
            "ai_score": 30.0,
            "is_danger_zone": True,
            "active_patterns": ["AREA_DEMAND"],
            "adtv_20": 5e9,
            "net_foreign_val": 1e9
        }
    ]

    # Filter 1: Min AI Score >= 75 and Exclude Danger Zone
    f1 = ScreenerFilter(min_ai_score=75.0, exclude_danger_zone=True)
    res1 = screener_engine.filter_and_rank(mock_universe, f1)
    assert len(res1) == 2
    assert res1[0]["symbol"] == "BBCA.JK"
    assert res1[1]["symbol"] == "BBRI.JK"

    # Filter 2: Only Area Demand pattern
    f2 = ScreenerFilter(patterns=["AREA_DEMAND"], exclude_danger_zone=True)
    res2 = screener_engine.filter_and_rank(mock_universe, f2)
    assert len(res2) == 1
    assert res2[0]["symbol"] == "BBCA.JK"

def test_natural_language_parser(nl_parser):
    # Test banking undervalue demand area
    q1 = "Cari saham bank yang undervalue dengan pattern area demand dan foreign buy"
    f1 = nl_parser.parse_query(q1)

    assert "Financials" in f1.sectors
    assert f1.min_ai_score == 70.0
    assert "AREA_DEMAND" in f1.patterns
    assert f1.net_foreign_positive is True
    assert f1.exclude_danger_zone is True

    # Test energy early breakout
    q2 = "Saham energi yang breakout dan ramai volume tinggi"
    f2 = nl_parser.parse_query(q2)

    assert "Energy" in f2.sectors
    assert "EARLY_BREAKOUT" in f2.patterns
    assert f2.min_volume_intensity >= 1.4
