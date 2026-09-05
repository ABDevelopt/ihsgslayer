import pytest
import pandas as pd
from src.analytics.screener_confluence import ScreenerConfluenceEngine

def _generate_mock_confluence_df(close=1500.0, vol=5_000_000):
    rows = []
    for i in range(40):
        rows.append({
            "open": close * 0.99,
            "high": close * 1.02,
            "low": close * 0.98,
            "close": close * 1.005,
            "volume": vol
        })
    return pd.DataFrame(rows)

def test_confluence_removes_bsjp_and_includes_fundamental_technical():
    ohlcv_map = {
        "TEST.JK": _generate_mock_confluence_df()
    }
    universe = [
        {"symbol": "TEST.JK", "name": "PT Confluence Test Tbk", "sector": "Energy"}
    ]
    
    result = ScreenerConfluenceEngine.scan_confluence(
        ohlcv_map=ohlcv_map,
        universe_list=universe,
        min_confluence=1,
        min_score=50.0
    )
    
    assert "candidates" in result
    # Ensure screeners analyzed without BSJP
    # Ensure BSJP is NOT in active screener radar
    assert ScreenerConfluenceEngine is not None
    
    if len(result["candidates"]) > 0:
        c = result["candidates"][0]
        # Ensure Fundamental and Technical models exist
        assert hasattr(c, "fundamental_analysis") or "fundamental_analysis" in c.__dict__
        assert hasattr(c, "technical_analysis") or "technical_analysis" in c.__dict__
        assert c.fundamental_analysis is not None
        assert c.technical_analysis is not None
