"""
Real-Time WebSocket Streaming Router for IHSG Slayer.
Provides ultra-low latency push notifications for live market pulses,
high-conviction screener signals, and automated forward test executions.
"""

import asyncio
import json
from datetime import datetime
from typing import Set, Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.core.logging import setup_logger

logger = setup_logger("stream")
router = APIRouter(tags=["Real-Time Stream"])


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts payload frames."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def send_personal(self, websocket: WebSocket, message: Dict[str, Any]):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send personal WS message: {e}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast JSON message to all connected clients."""
        if not self.active_connections:
            return

        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to client, removing: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)


manager = ConnectionManager()
_main_event_loop: Optional[asyncio.AbstractEventLoop] = None


def set_main_event_loop(loop: asyncio.AbstractEventLoop):
    global _main_event_loop
    _main_event_loop = loop


async def broadcast_market_event(event_type: str, data: Dict[str, Any]):
    """Async broadcast of custom market event to all active WebSocket clients."""
    payload = {
        "type": event_type,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB"),
        "data": data
    }
    await manager.broadcast(payload)


def emit_market_event_sync(event_type: str, data: Dict[str, Any]):
    """Safe thread-safe sync wrapper to broadcast events from worker threads."""
    global _main_event_loop
    try:
        if _main_event_loop and _main_event_loop.is_running():
            asyncio.run_coroutine_threadsafe(
                broadcast_market_event(event_type, data),
                _main_event_loop
            )
    except Exception as e:
        logger.warning(f"Failed to emit sync market event: {e}")


@router.websocket("/ws/market-pulse")
async def websocket_market_pulse(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market pulse and instant signal push notifications.
    Client can send 'ping' to receive 'pong'.
    """
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "INITIAL_HANDSHAKE",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB"),
            "data": {
                "status": "ONLINE",
                "protocol": "IHSG_STREAM_V1",
                "message": "Koneksi WebSocket IHSG Slayer aktif.",
                "active_clients": len(manager.active_connections)
            }
        })

        while True:
            raw_text = await websocket.receive_text()
            if raw_text.strip().lower() == "ping":
                await websocket.send_json({
                    "type": "PONG",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB")
                })
            else:
                try:
                    msg = json.loads(raw_text)
                    if msg.get("action") == "ping":
                        await websocket.send_json({
                            "type": "PONG",
                            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB")
                        })
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket session error: {e}")
        manager.disconnect(websocket)
