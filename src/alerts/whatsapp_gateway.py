"""
WhatsApp Notification Gateway Adapter for IHSG Slayer.
Supports Fonnte, Wablas, Whacenter, Starsender, and Custom REST Webhook Gateways.
"""

import httpx
from typing import Dict, Any, Optional
from src.core.logging import setup_logger

logger = setup_logger("whatsapp_gateway")


class WhatsAppGateway:
    """
    Unified WhatsApp Gateway for sending tactical trading alerts.
    """

    def __init__(
        self,
        api_token: str = "",
        target_phone: str = "",
        provider: str = "fonnte",  # "fonnte", "wablas", "custom_webhook"
        endpoint_url: Optional[str] = None
    ):
        self.api_token = api_token
        self.target_phone = target_phone
        self.provider = provider
        self.endpoint_url = endpoint_url

    async def send_message(self, message_text: str, phone: Optional[str] = None) -> bool:
        """Send formatted WhatsApp message via configured gateway provider."""
        target = phone or self.target_phone
        token = self.api_token

        if not token and not self.endpoint_url:
            logger.warning("WhatsApp API Token / Endpoint not configured. Skipping WhatsApp push.")
            return False

        if not target and not self.endpoint_url:
            logger.warning("WhatsApp Target Phone number not configured.")
            return False

        # Format number (e.g. 0812 -> 62812)
        if target:
            clean_target = target.replace("-", "").replace(" ", "").replace("+", "")
            if clean_target.startswith("0"):
                clean_target = "62" + clean_target[1:]
        else:
            clean_target = ""

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                if self.provider == "fonnte":
                    url = "https://api.fonnte.com/send"
                    headers = {"Authorization": token}
                    data = {
                        "target": clean_target,
                        "message": message_text,
                        "countryCode": "62"
                    }
                    resp = await client.post(url, headers=headers, data=data)
                    return resp.status_code == 200

                elif self.provider == "wablas":
                    url = self.endpoint_url or "https://api.wablas.com/api/send-message"
                    headers = {"Authorization": token}
                    data = {
                        "phone": clean_target,
                        "message": message_text
                    }
                    resp = await client.post(url, headers=headers, json=data)
                    return resp.status_code == 200

                else:
                    # Generic Custom Webhook
                    url = self.endpoint_url or "http://127.0.0.1:8080/webhook/whatsapp"
                    data = {
                        "phone": clean_target,
                        "message": message_text,
                        "token": token
                    }
                    resp = await client.post(url, json=data)
                    return resp.status_code in (200, 201, 202)

        except Exception as e:
            logger.error(f"Failed to send WhatsApp alert via {self.provider}: {e}")
            return False
