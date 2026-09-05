"""
Enhanced Telegram Notification Dispatcher with Step-by-Step Tactical Playbook Formatting.
"""

import httpx
from typing import Dict, Any, Optional
from src.core.config import settings
from src.core.logging import setup_logger

logger = setup_logger("telegram_bot")


class TelegramAlertBot:
    """Telegram Notification Dispatcher for IHSG Slayer Tactical Playbooks."""

    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self.bot_token = bot_token or settings.TELEGRAM_BOT_TOKEN
        self.chat_id = chat_id or settings.TELEGRAM_CHAT_ID

    async def send_message(self, text: str, inline_button_url: Optional[str] = None, button_text: str = "Buka Analisis Saham") -> bool:
        """Send formatted HTML message to Telegram with optional inline action button."""
        token = self.bot_token
        chat = self.chat_id

        if not token or not chat:
            logger.warning("Telegram credentials not configured. Skipping message push.")
            return False

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload: Dict[str, Any] = {
            "chat_id": chat,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }

        if inline_button_url:
            payload["reply_markup"] = {
                "inline_keyboard": [
                    [
                        {"text": button_text, "url": inline_button_url}
                    ]
                ]
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    logger.info(f"Successfully sent Telegram alert to {chat}")
                    return True
                else:
                    logger.error(f"Telegram API Error {resp.status_code}: {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False
