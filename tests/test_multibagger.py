"""
Unit tests for Multibagger Hunter Engine.
"""

import pytest
from src.analytics.multibagger_hunter import MultibaggerHunterEngine


def test_multibagger_scan():
    candidates = MultibaggerHunterEngine.scan_multibagger_candidates(min_score=50.0)
    assert isinstance(candidates, list)
    assert len(candidates) >= 1
    
    top = candidates[0]
    assert "symbol" in top
    assert "multibagger_score" in top
    assert top["multibagger_score"] >= 50.0
    assert "potential_multiple" in top
    assert "target_bagger_100" in top
    assert "minervini_template" in top
    assert "bandarmologi" in top
    assert "catalyst_summary" in top
