"""
Unified Notification Dispatcher with Deduplication, Rate-Limiting, and Dual-Channel Routing.
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

from src.alerts.tactical_playbook import TacticalPlaybookGenerator
from src.alerts.telegram_bot import TelegramAlertBot
from src.alerts.whatsapp_gateway import WhatsAppGateway
from src.core.logging import setup_logger

logger = setup_logger("dispatcher")
SETTINGS_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "alert_settings.json")


class AlertSettings(BaseModel):
    telegram_enabled: bool = True
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    whatsapp_enabled: bool = False
    whatsapp_provider: str = "fonnte"
    whatsapp_api_token: str = ""
    whatsapp_target_phone: str = ""
    whatsapp_endpoint_url: str = ""
    enable_pre_ara_alerts: bool = True
    enable_bpjs_alerts: bool = True
    enable_bsjp_alerts: bool = True
    enable_confluence_alerts: bool = True
    enable_execution_alerts: bool = True
    min_score_filter: float = 65.0


class NotificationDispatcher:
    """
    Central Coordinator for Step-by-Step Tactical Notifications.
    """
    _instance = None

    def __init__(self):
        self.settings = self._load_settings()
        # Cooldown map: key -> timestamp (to avoid duplicate signal spam within same day)
        self.sent_cooldown_map: Dict[str, float] = {}

    @classmethod
    def get_instance(cls) -> "NotificationDispatcher":
        if cls._instance is None:
            cls._instance = NotificationDispatcher()
        return cls._instance

    def _load_settings(self) -> AlertSettings:
        loaded = AlertSettings()
        try:
            if os.path.exists(SETTINGS_FILE_PATH):
                with open(SETTINGS_FILE_PATH, "r", encoding="utf-8") as f:
                    loaded = AlertSettings.model_validate(json.load(f))
        except Exception as e:
            logger.warning(f"Failed to load alert settings: {e}")

        # Fallback to environment variables if not configured in JSON
        from src.core.config import settings as app_settings
        if not loaded.telegram_bot_token and app_settings.TELEGRAM_BOT_TOKEN:
            loaded.telegram_bot_token = app_settings.TELEGRAM_BOT_TOKEN
        if not loaded.telegram_chat_id and app_settings.TELEGRAM_CHAT_ID:
            loaded.telegram_chat_id = app_settings.TELEGRAM_CHAT_ID

        return loaded

    def save_settings(self, new_settings: AlertSettings):
        self.settings = new_settings
        try:
            os.makedirs(os.path.dirname(SETTINGS_FILE_PATH), exist_ok=True)
            with open(SETTINGS_FILE_PATH, "w", encoding="utf-8") as f:
                f.write(new_settings.model_dump_json(indent=2))
        except Exception as e:
            logger.error(f"Failed to save alert settings: {e}")

    async def dispatch_buy_signal(
        self,
        symbol: str,
        name: str,
        sector: str,
        strategy: str,
        entry_price: float,
        target_tp1: float,
        target_tp2: float,
        stop_loss: float,
        score: float,
        selling_time_window: str = "",
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Build and broadcast step-by-step BUY tactical playbook to active channels.
        """
        today_key = f"{symbol}_{strategy}_{datetime.now().strftime('%Y-%m-%d')}"
        if not force and today_key in self.sent_cooldown_map:
            logger.info(f"Signal {today_key} already sent today. Suppressing duplicate alert.")
            return {"status": "SKIPPED", "reason": "Cooldown active for today"}

        playbook = TacticalPlaybookGenerator.generate_buy_playbook(
            symbol=symbol,
            name=name,
            sector=sector,
            strategy=strategy,
            entry_price=entry_price,
            target_tp1=target_tp1,
            target_tp2=target_tp2,
            stop_loss=stop_loss,
            score=score,
            selling_time_window=selling_time_window
        )

        results = {}
        cfg = self.settings

        # Telegram Channel
        if cfg.telegram_enabled and cfg.telegram_bot_token and cfg.telegram_chat_id:
            tg_bot = TelegramAlertBot(bot_token=cfg.telegram_bot_token, chat_id=cfg.telegram_chat_id)
            tg_ok = await tg_bot.send_message(
                text=playbook["telegram_html"],
                inline_button_url=f"http://43.163.98.53/analysis/{symbol}",
                button_text=f"[ANALISIS] #{symbol.replace('.JK', '')}"
            )
            results["telegram"] = tg_ok

        # WhatsApp Channel
        if cfg.whatsapp_enabled and cfg.whatsapp_api_token:
            wa_bot = WhatsAppGateway(
                api_token=cfg.whatsapp_api_token,
                target_phone=cfg.whatsapp_target_phone,
                provider=cfg.whatsapp_provider,
                endpoint_url=cfg.whatsapp_endpoint_url
            )
            wa_ok = await wa_bot.send_message(message_text=playbook["whatsapp_md"])
            results["whatsapp"] = wa_ok

        self.sent_cooldown_map[today_key] = datetime.now().timestamp()
        
        # Broadcast via real-time WebSocket
        try:
            from src.api.routers.stream import emit_market_event_sync
            emit_market_event_sync("SIGNAL_DISPATCHED", {
                "symbol": symbol,
                "name": name,
                "strategy": strategy,
                "score": score,
                "entry_price": entry_price,
                "target_tp1": target_tp1,
                "target_tp2": target_tp2,
                "stop_loss": stop_loss
            })
        except Exception as e:
            logger.warning(f"Failed to emit WS signal event: {e}")

        # Broadcast via real-time WebSocket
        try:
            from src.api.routers.stream import emit_market_event_sync
            emit_market_event_sync("TRADE_EXECUTED", {
                "symbol": symbol,
                "strategy": strategy,
                "action_type": action_type,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "realized_pnl_pct": realized_pnl_pct,
                "realized_pnl_amt": realized_pnl_amt
            })
        except Exception as e:
            logger.warning(f"Failed to emit WS trade execution event: {e}")

        return {"status": "DISPATCHED", "results": results, "playbook": playbook}

    async def dispatch_sell_execution(
        self,
        symbol: str,
        strategy: str,
        action_type: str,
        entry_price: float,
        exit_price: float,
        shares_lot: int,
        realized_pnl_amt: float,
        realized_pnl_pct: float,
        holding_duration: str = ""
    ) -> Dict[str, Any]:
        """
        Build and broadcast step-by-step SELL execution report to active channels.
        """
        playbook = TacticalPlaybookGenerator.generate_sell_playbook(
            symbol=symbol,
            strategy=strategy,
            action_type=action_type,
            entry_price=entry_price,
            exit_price=exit_price,
            shares_lot=shares_lot,
            realized_pnl_amt=realized_pnl_amt,
            realized_pnl_pct=realized_pnl_pct,
            holding_duration=holding_duration
        )

        results = {}
        cfg = self.settings

        if cfg.telegram_enabled and cfg.telegram_bot_token and cfg.telegram_chat_id:
            tg_bot = TelegramAlertBot(bot_token=cfg.telegram_bot_token, chat_id=cfg.telegram_chat_id)
            tg_ok = await tg_bot.send_message(
                text=playbook["telegram_html"],
                inline_button_url="http://43.163.98.53/forward-test",
                button_text="[PORTFOLIO] Buka Forward Test Studio"
            )
            results["telegram"] = tg_ok

        if cfg.whatsapp_enabled and cfg.whatsapp_api_token:
            wa_bot = WhatsAppGateway(
                api_token=cfg.whatsapp_api_token,
                target_phone=cfg.whatsapp_target_phone,
                provider=cfg.whatsapp_provider,
                endpoint_url=cfg.whatsapp_endpoint_url
            )
            wa_ok = await wa_bot.send_message(message_text=playbook["whatsapp_md"])
            results["whatsapp"] = wa_ok

        return {"status": "DISPATCHED", "results": results, "playbook": playbook}
