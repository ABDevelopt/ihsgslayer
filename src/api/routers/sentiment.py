"""
FastAPI Router for Macro & News Sentiment Intelligence Engine.
Provides endpoints for:
1. Global Macro & Commodity Barometer (/sentiment/macro-commodities)
2. Live Domestic & Global Financial News Feed with NLP Polarity (/sentiment/news/latest)
3. 360-Degree Stock Sentiment & Tailwinds (/sentiment/stock/{symbol})
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException
from src.analytics.commodity_macro_engine import CommodityMacroEngine
from src.analytics.news_sentiment_engine import NewsSentimentEngine

router = APIRouter(prefix="/sentiment", tags=["Sentiment & Macro Intelligence"])


@router.get("/macro-commodities", summary="Get Global Macro & Commodity Drivers")
def get_macro_commodities(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetch live global macro benchmarks (Crude Oil, Gold, Coal, USD/IDR, DXY, EIDO)
    and sectoral tailwind / headwind impacts for the Indonesian market.
    """
    engine = CommodityMacroEngine.get_instance()
    return engine.evaluate_sector_tailwinds()


@router.get("/news/latest", summary="Get Latest Market News Enriched with NLP Sentiment")
def get_latest_news(
    limit: int = Query(25, ge=1, le=100),
    symbol: Optional[str] = Query(None, description="Optional filter by emiten symbol (e.g. BBCA, MEDC)")
) -> List[Dict[str, Any]]:
    """
    Fetch real-time news headlines parsed with Indonesian financial NLP polarity scoring.
    """
    engine = NewsSentimentEngine.get_instance()
    return engine.fetch_latest_news(limit=limit, symbol=symbol)


@router.get("/stock/{symbol}", summary="Get Full 360-Degree Sentiment & Macro Analysis for a Stock")
def get_stock_sentiment(symbol: str) -> Dict[str, Any]:
    """
    Evaluate multi-layer news sentiment, corporate disclosures, circuit breaker status,
    order-flow divergence (sell-on-news), and global macro commodity tailwinds for an emiten.
    """
    clean_sym = symbol.strip().upper()
    if not clean_sym:
        raise HTTPException(status_code=400, detail="Symbol cannot be empty")

    news_engine = NewsSentimentEngine.get_instance()
    macro_engine = CommodityMacroEngine.get_instance()

    sentiment_eval = news_engine.evaluate_stock_sentiment(clean_sym)
    macro_impact = macro_engine.get_stock_macro_impact(clean_sym)

    # Combined score boost
    total_boost = round(sentiment_eval.get("score_adjustment", 0.0) + macro_impact.get("score_boost", 0.0), 1)

    return {
        "symbol": clean_sym,
        "sentiment": sentiment_eval,
        "macro_impact": macro_impact,
        "combined_ai_score_adjustment": total_boost,
        "circuit_breaker_active": sentiment_eval.get("is_circuit_breaker_active", False),
        "divergence_trap": sentiment_eval.get("is_divergence_trap", False)
    }