"""
Alerts & Notifications API Router.
Handles Telegram and WhatsApp configuration, step-by-step playbook generation, and test push dispatches.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from src.alerts.dispatcher import NotificationDispatcher, AlertSettings
from src.alerts.tactical_playbook import TacticalPlaybookGenerator

router = APIRouter(prefix="/alerts", tags=["Alerts & Notification Hub"])
dispatcher = NotificationDispatcher.get_instance()


class TestTelegramRequest(BaseModel):
    bot_token: Optional[str] = None
    chat_id: str


class TestWhatsAppRequest(BaseModel):
    provider: str = "fonnte"
    api_token: str
    target_phone: str
    endpoint_url: Optional[str] = None


@router.get("/settings")
async def get_alert_settings():
    """Get current Telegram and WhatsApp alert settings."""
    return dispatcher.settings.model_dump()


@router.post("/settings")
async def update_alert_settings(settings: AlertSettings):
    """Save updated alert settings."""
    dispatcher.save_settings(settings)
    return {"status": "SUCCESS", "message": "Pengaturan notifikasi berhasil disimpan.", "settings": dispatcher.settings.model_dump()}


@router.get("/detect-chat-id")
async def detect_telegram_chat_id(bot_token: Optional[str] = None):
    """
    Auto-detect the latest chat_id by querying Telegram getUpdates.
    Useful when user clicked /start in the bot.
    """
    token = bot_token or dispatcher.settings.telegram_bot_token
    if not token:
        raise HTTPException(status_code=400, detail="Bot Token belum diisi.")
    
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://api.telegram.org/bot{token}/getUpdates")
            data = resp.json()
            if not data.get("ok"):
                raise HTTPException(status_code=400, detail=f"Telegram API Error: {data.get('description')}")
            
            updates = data.get("result", [])
            if not updates:
                return {
                    "status": "WAITING",
                    "message": "Belum ada pesan yang diterima oleh bot. Buka https://t.me/ihsgslayer_bot di Telegram lalu klik 'Start' atau kirim pesan.",
                    "chat_id": None
                }
            
            # Get latest update
            latest = updates[-1]
            chat = latest.get("message", {}).get("chat", {}) or latest.get("channel_post", {}).get("chat", {})
            chat_id = str(chat.get("id"))
            first_name = chat.get("first_name", "")
            username = chat.get("username", "")
            title = chat.get("title", "")
            
            return {
                "status": "SUCCESS",
                "chat_id": chat_id,
                "name": title or first_name or username,
                "type": chat.get("type", "private"),
                "message": f"Ditemukan Chat ID: {chat_id} ({title or first_name or username})"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-telegram")
async def test_telegram_notification(req: TestTelegramRequest):
    """Send a real step-by-step sample playbook to Telegram with live consistent data."""
    from src.alerts.telegram_bot import TelegramAlertBot
    from src.api.routers.screener import _build_current_universe_metrics

    symbol = "JECC.JK"
    name = "Jembo Cable Company Tbk"
    sector = "Industrial"
    real_score = 56.6
    entry_p = 665.0

    try:
        metrics = _build_current_universe_metrics()
        stock_metric = next((m for m in metrics if m["symbol"] == symbol or m["symbol"].replace(".JK", "") == "JECC"), None)
        if stock_metric:
            real_score = round(float(stock_metric.get("ai_score", 56.6)), 1)
            entry_p = float(stock_metric.get("price", 665.0) or 665.0)
            name = stock_metric.get("name", name)
            sector = stock_metric.get("sector", sector)
    except Exception:
        pass

    target_tp1 = round(entry_p * 1.05, 0)
    target_tp2 = round(entry_p * 1.15, 0)
    stop_loss = round(entry_p * 0.95, 0)

    sample = TacticalPlaybookGenerator.generate_buy_playbook(
        symbol=symbol,
        name=name,
        sector=sector,
        strategy="PRE_ARA",
        entry_price=entry_p,
        target_tp1=target_tp1,
        target_tp2=target_tp2,
        stop_loss=stop_loss,
        score=real_score,
        selling_time_window="Pagi 09:30 - 10:15 / Plafon ARA 15:45 WIB"
    )

    test_html = (
        "<b>[UJI COBA NOTIFIKASI TELEGRAM]</b>\n"
        "<i>(Pesan verifikasi integrasi bot &mdash; Data tersinkronisasi pasar riil)</i>\n\n"
        f"{sample['telegram_html']}"
    )

    token = req.bot_token or dispatcher.settings.telegram_bot_token
    bot = TelegramAlertBot(bot_token=token, chat_id=req.chat_id)
    success = await bot.send_message(
        text=test_html,
        inline_button_url="http://43.163.98.53/analysis/JECC.JK",
        button_text="[ANALISIS] Buka Analisis #JECC"
    )

    if success:
        return {"status": "SUCCESS", "message": "Notifikasi Telegram berhasil terkirim!", "score_used": real_score}
    else:
        raise HTTPException(status_code=400, detail="Gagal mengirim ke Telegram. Periksa kembali Bot Token dan Chat ID.")


@router.post("/test-whatsapp")
async def test_whatsapp_notification(req: TestWhatsAppRequest):
    """Send a real step-by-step sample playbook to WhatsApp."""
    from src.alerts.whatsapp_gateway import WhatsAppGateway

    sample = TacticalPlaybookGenerator.generate_buy_playbook(
        symbol="PTBA.JK",
        name="Bukit Asam Tbk",
        sector="Energy",
        strategy="BPJS",
        entry_price=2540.0,
        target_tp1=2630.0,
        target_tp2=2720.0,
        stop_loss=2470.0,
        score=78.0,
        selling_time_window="Sore Ini: 15:40 - 15:50 WIB (Zero Overnight)"
    )

    gw = WhatsAppGateway(
        api_token=req.api_token,
        target_phone=req.target_phone,
        provider=req.provider,
        endpoint_url=req.endpoint_url
    )
    success = await gw.send_message(message_text=sample["whatsapp_md"])

    if success:
        return {"status": "SUCCESS", "message": "Notifikasi WhatsApp berhasil terkirim!"}
    else:
        raise HTTPException(status_code=400, detail="Gagal mengirim ke WhatsApp. Periksa kembali API Token dan Nomor WhatsApp.")


@router.post("/preview-playbook")
async def preview_tactical_playbook(
    symbol: str = Body("BBCA.JK", embed=True),
    strategy: str = Body("BPJS", embed=True),
    entry_price: float = Body(10200.0, embed=True),
    target_tp1: float = Body(10550.0, embed=True),
    target_tp2: float = Body(10900.0, embed=True),
    stop_loss: float = Body(9950.0, embed=True),
    score: float = Body(80.0, embed=True)
):
    """Generate live preview of step-by-step tactical playbook."""
    playbook = TacticalPlaybookGenerator.generate_buy_playbook(
        symbol=symbol,
        name=symbol,
        sector="General",
        strategy=strategy,
        entry_price=entry_price,
        target_tp1=target_tp1,
        target_tp2=target_tp2,
        stop_loss=stop_loss,
        score=score
    )
    return {"status": "SUCCESS", "playbook": playbook}
