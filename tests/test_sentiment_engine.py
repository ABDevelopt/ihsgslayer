"""
Unit & Integration Tests for Macro & News Sentiment Intelligence Engine.
Verifies:
1. CommodityMacroEngine (global benchmark prices, sector tailwinds, macro climate)
2. NewsSentimentEngine (NLP lexicon scoring, critical risk circuit breaker, sell-on-news divergence)
3. StockShieldEngine integration (critical sentiment hazard blocks buy signals)
4. FastAPI Sentiment Endpoints (/macro-commodities, /news/latest, /stock/{symbol})
"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.analytics.commodity_macro_engine import CommodityMacroEngine
from src.analytics.news_sentiment_engine import NewsSentimentEngine
from src.analytics.stock_shield import StockShieldEngine

client = TestClient(app)


def test_commodity_macro_engine():
    engine = CommodityMacroEngine.get_instance()
    drivers = engine.fetch_global_macro_drivers()
    assert "CL=F" in drivers
    assert "GC=F" in drivers
    assert "USDIDR=X" in drivers
    assert drivers["CL=F"]["price"] > 0

    evaluation = engine.evaluate_sector_tailwinds()
    assert "market_climate" in evaluation
    assert "sectors_impact" in evaluation
    assert len(evaluation["sectors_impact"]) >= 4

    # Stock specific impact
    medc_impact = engine.get_stock_macro_impact("MEDC")
    assert medc_impact["symbol"] == "MEDC"
    assert "score_boost" in medc_impact


def test_news_sentiment_nlp_scoring():
    engine = NewsSentimentEngine.get_instance()

    # Positive headline test
    pos_headline = "BBCA Catat Rekor Laba Bersih Tertinggi Sepanjang Masa dan Bagikan Dividen Jumbo"
    res_pos = engine.analyze_headline(pos_headline)
    assert res_pos["sentiment_score"] > 0.4
    assert res_pos["sentiment_label"] == "POSITIF"
    assert res_pos["is_critical_risk"] is False

    # Moderate negative headline test
    neg_headline = "Laba Perusahaan Anjlok Drastis Akibat Penurunan Volume Penjualan"
    res_neg = engine.analyze_headline(neg_headline)
    assert res_neg["sentiment_score"] < 0
    assert res_neg["sentiment_label"] in ["NEGATIF", "RISIKO_KRITIS"]

    # Critical risk trigger test (PKPU / Suspensi)
    crit_headline = "Bursa Melakukan Penghentian Sementara Perdagangan (Suspensi) Akibat Permohonan PKPU"
    res_crit = engine.analyze_headline(crit_headline)
    assert res_crit["is_critical_risk"] is True
    assert res_crit["sentiment_label"] == "RISIKO_KRITIS"
    assert res_crit["badge_color"] == "rose"


def test_order_flow_divergence_trap():
    engine = NewsSentimentEngine.get_instance()
    # If a stock has positive news but low accumulation (< 35), flag divergence trap
    eval_divergence = engine.evaluate_stock_sentiment("BBCA.JK", broker_accumulation_score=25.0)
    # BBCA has positive curated news in default feed
    assert eval_divergence["is_divergence_trap"] is True
    assert "[DISTRIBUTION TRAP / SELL ON NEWS]" in eval_divergence["divergence_badge"]


def test_critical_sentiment_blocks_stock_shield():
    shield = StockShieldEngine()
    # Mock critical sentiment risk payload
    crit_sentiment = {
        "is_circuit_breaker_active": True,
        "summary": "Emiten sedang digugat PKPU dan terancam delisting."
    }
    result = shield.evaluate_stock_safety(
        symbol="XYZW.JK",
        price=1000.0,
        sentiment_risk=crit_sentiment
    )
    assert result["is_sentiment_hazard"] is True
    assert result["is_safe_to_buy"] is False
    assert result["risk_level"] == "CRITICAL_HAZARD"
    assert "BAHAYA SENTIMEN KRITIS" in result["risk_badge"]


def test_sentiment_api_endpoints():
    # 1. Macro commodities
    r1 = client.get("/api/v1/sentiment/macro-commodities")
    assert r1.status_code == 200
    d1 = r1.json()
    assert "drivers" in d1
    assert "sectors_impact" in d1

    # 2. Latest news
    r2 = client.get("/api/v1/sentiment/news/latest?limit=5")
    assert r2.status_code == 200
    d2 = r2.json()
    assert isinstance(d2, list)
    assert len(d2) > 0
    assert "sentiment_score" in d2[0]

    # 3. Stock sentiment
    r3 = client.get("/api/v1/sentiment/stock/BBCA.JK")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["symbol"] == "BBCA.JK"
    assert "sentiment" in d3
    assert "macro_impact" in d3
    assert "combined_ai_score_adjustment" in d3