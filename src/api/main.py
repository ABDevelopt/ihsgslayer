import asyncio
import os
import math
import json as _json
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from src.core.config import settings
from src.core.logging import setup_logger
from src.data.database import init_db
from src.api.routers.stocks import router as stocks_router
from src.api.routers.screener import router as screener_router, _build_current_universe_metrics
from src.api.routers.backtest import router as backtest_router
from src.api.routers.journal import router as journal_router
from src.api.routers.evaluation import router as evaluation_router
from src.api.routers.forward_test import router as forward_test_router
from src.api.routers.alerts import router as alerts_router
from src.api.routers.danger_shield import router as danger_shield_router
from src.api.routers.portfolio import router as portfolio_router
from src.api.routers.sentiment import router as sentiment_router
from src.api.routers.intraday_cycle import router as intraday_cycle_router
from src.api.routers.deploy_webhook import router as deploy_webhook_router
from src.api.routers.stream import router as stream_router, set_main_event_loop, broadcast_market_event

logger = setup_logger("main")

template_dir = os.path.join(os.path.dirname(__file__), "..", "web", "templates")
templates = Jinja2Templates(directory=template_dir)

async def _background_cache_warmer():
    """Continuously refresh universe metrics in background without blocking user requests."""
    while True:
        try:
            logger.info("Running background universe cache pre-warming...")
            await asyncio.to_thread(_build_current_universe_metrics, force_refresh=True)
            logger.info("Background cache pre-warming complete.")
        except Exception as e:
            logger.warning(f"Background cache warmer exception: {e}")
        await asyncio.sleep(300)  # Refresh every 5 minutes

async def _forward_test_bot_worker():
    """Background autonomous bot worker that evaluates open positions and enters high-conviction signals."""
    from src.analytics.forward_tester import ForwardTestEngine
    engine = ForwardTestEngine.get_instance()
    await asyncio.sleep(10)  # Initial startup delay
    while True:
        try:
            if engine.portfolio.auto_bot_enabled:
                logger.info("Executing autonomous forward test bot cycle...")
                await asyncio.to_thread(engine.execute_autonomous_cycle)
        except Exception as e:
            logger.warning(f"Forward test bot worker exception: {e}")
        await asyncio.sleep(30)  # Run every 30 seconds

async def _market_pulse_broadcaster():
    """Periodically broadcast live market heartbeat to connected WebSocket clients."""
    while True:
        try:
            await broadcast_market_event("PULSE", {
                "status": "MARKET_STREAM_ACTIVE",
                "uptime": "OK"
            })
        except Exception as e:
            logger.warning(f"Market pulse broadcaster error: {e}")
        await asyncio.sleep(15)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing IHSG Slayer Engine & Database...")
    set_main_event_loop(asyncio.get_running_loop())
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Database init warning (non-fatal for dev): {e}")

    # Launch background cache warmer, forward test bot, and market pulse streaming
    warmer_task = asyncio.create_task(_background_cache_warmer())
    bot_task = asyncio.create_task(_forward_test_bot_worker())
    pulse_task = asyncio.create_task(_market_pulse_broadcaster())
    yield
    warmer_task.cancel()
    bot_task.cancel()
    pulse_task.cancel()
    logger.info("Shutting down IHSG Slayer Engine...")

def _nan_safe_dumps(obj):
    """Recursively replace NaN/Inf float values with None (JSON null) to prevent serialization errors."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _nan_safe_dumps(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_nan_safe_dumps(v) for v in obj]
    return obj


class NaNSafeJSONResponse(JSONResponse):
    """Custom JSONResponse that sanitizes NaN/Inf before serialization."""
    def render(self, content) -> bytes:
        clean = _nan_safe_dumps(content)
        return _json.dumps(
            clean, ensure_ascii=False, allow_nan=False,
            indent=None, separators=(",", ":")
        ).encode("utf-8")


app = FastAPI(
    title="IHSG Slayer Platform",
    description="Hybrid Quantitative & Order-Flow Market Analytics Platform for IDX Equities (Bandar Metrics × IHSG Screener)",
    version="0.1.0",
    lifespan=lifespan,
    default_response_class=NaNSafeJSONResponse
)

# GZip Compression for Ultra-Fast Network Payload Transfers
app.add_middleware(GZipMiddleware, minimum_size=500)

# Enable CORS for Frontend Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(stocks_router, prefix="/api/v1")
app.include_router(screener_router, prefix="/api/v1")
app.include_router(backtest_router, prefix="/api/v1")
app.include_router(journal_router, prefix="/api/v1")
app.include_router(portfolio_router, prefix="/api/v1")
app.include_router(evaluation_router, prefix="/api/v1")
app.include_router(forward_test_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(danger_shield_router, prefix="/api/v1")
app.include_router(sentiment_router, prefix="/api/v1")
app.include_router(intraday_cycle_router, prefix="/api/v1")
app.include_router(deploy_webhook_router, prefix="/api/v1")
app.include_router(stream_router)

@app.get("/", response_class=HTMLResponse, tags=["Web App"])
@app.get("/dashboard", response_class=HTMLResponse, tags=["Web App"])
async def serve_dashboard(request: Request):
    """Serve unified web dashboard interface."""
    return templates.TemplateResponse(request=request, name="index.html", context={"request": request})

@app.get("/analysis", response_class=HTMLResponse, tags=["Web App"])
@app.get("/stocks/{symbol}/view", response_class=HTMLResponse, tags=["Web App"])
async def serve_stock_analysis(request: Request, symbol: Optional[str] = None):
    """Serve dedicated 360-degree stock analysis page for individual emiten."""
    return templates.TemplateResponse(request=request, name="stock_analysis.html", context={"request": request, "symbol": symbol or "BBCA.JK"})

@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "platform": settings.APP_NAME, "env": settings.APP_ENV}
