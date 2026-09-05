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
        "🧪 <i>[UJI COBA BOT TELEGRAM]</i>\n"
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


class TestSignalDispatchRequest(BaseModel):
    action: Optional[str] = "BUY"  # "BUY" or "SELL"
    strategy: Optional[str] = "AUTO"  # "AUTO", "BPJS", "PRE_ARA", "BSJP", "BUY_LAYAK"
    symbol: Optional[str] = None
    force: bool = True


@router.post("/test-signal-dispatch")
async def trigger_signal_dispatch(req: TestSignalDispatchRequest = Body(default_factory=TestSignalDispatchRequest)):
    """
    Kirim uji coba notifikasi Telegram saat sinyal trading kuantitatif terdeteksi / keluar (BUY & SELL).
    Mengambil kandidat sinyal riil tertinggi dari algoritma pasar aktif.
    """
    from src.data.universe import FULL_IDX_UNIVERSE
    from src.api.routers.screener import (
        get_bpjs_candidates,
        get_pre_ara_candidates,
        get_bsjp_candidates,
        get_institutional_buy_signals,
        _build_current_universe_metrics
    )

    action = (req.action or "BUY").upper()

    # Handle SELL execution notification test
    if action == "SELL":
        sym = req.symbol.upper() if req.symbol else "IRSX.JK"
        if not sym.endswith(".JK"):
            sym += ".JK"
        strat_used = req.strategy if req.strategy and req.strategy != "AUTO" else "PRE_ARA"
        p_entry = 424.0
        p_exit = 446.0
        pnl_pct = round(((p_exit - p_entry) / p_entry) * 100.0, 1)
        pnl_amt = round((p_exit - p_entry) * 50 * 100, 0)
        dispatch_res = await dispatcher.dispatch_sell_execution(
            symbol=sym,
            strategy=strat_used,
            action_type="TAKE_PROFIT_1",
            entry_price=p_entry,
            exit_price=p_exit,
            shares_lot=50,
            realized_pnl_amt=pnl_amt,
            realized_pnl_pct=pnl_pct,
            holding_duration="1 Hari Bursa"
        )
        return {
            "status": "SUCCESS",
            "message": f"Notifikasi SELL (Realisasi) untuk #{sym.replace('.JK', '')} berhasil dikirim ke Telegram!",
            "action": "SELL",
            "signal_dispatched": {
                "symbol": sym,
                "strategy": strat_used,
                "action_type": "TAKE_PROFIT_1",
                "entry_price": p_entry,
                "exit_price": p_exit,
                "realized_pnl_pct": pnl_pct,
                "realized_pnl_amt": pnl_amt
            },
            "dispatch_result": dispatch_res
        }

    strat = (req.strategy or "AUTO").upper()
    target_candidate = None
    chosen_strat = strat

    # 1. If strategy is BUY_LAYAK or CONFLUENCE
    if strat in ["BUY_LAYAK", "CONFLUENCE"]:
        try:
            res = await get_institutional_buy_signals(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "BUY_LAYAK"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "BUY_LAYAK"
        except Exception:
            pass

    # 2. If strategy is BPJS
    if not target_candidate and strat in ["BPJS"]:
        try:
            res = await get_bpjs_candidates(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "BPJS"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "BPJS"
        except Exception:
            pass

    # 3. If strategy is BSJP
    if not target_candidate and strat in ["BSJP"]:
        try:
            res = await get_bsjp_candidates(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "BSJP"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "BSJP"
        except Exception:
            pass

    # 4. If strategy is PRE_ARA
    if not target_candidate and strat in ["PRE_ARA"]:
        try:
            res = await get_pre_ara_candidates(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "PRE_ARA"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "PRE_ARA"
        except Exception:
            pass

    # 5. If strategy is AUTO, check in order: BPJS -> PRE_ARA -> BSJP -> BUY_LAYAK
    if not target_candidate and strat == "AUTO":
        try:
            res = await get_bpjs_candidates(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "BPJS"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "BPJS"
        except Exception:
            pass

    # 2. If strategy is PRE_ARA or AUTO (and no candidate yet)
    if not target_candidate and strat in ["PRE_ARA", "AUTO"]:
        try:
            res = await get_pre_ara_candidates(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "PRE_ARA"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "PRE_ARA"
        except Exception:
            pass

    # 3. If strategy is BSJP or AUTO (and no candidate yet)
    if not target_candidate and strat in ["BSJP", "AUTO"]:
        try:
            res = await get_bsjp_candidates(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "BSJP"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "BSJP"
        except Exception:
            pass

    # 4. If strategy is BUY_LAYAK / CONFLUENCE or AUTO (and no candidate yet)
    if not target_candidate and strat in ["BUY_LAYAK", "CONFLUENCE", "AUTO"]:
        try:
            res = await get_institutional_buy_signals(min_score=50.0)
            cands = res.get("candidates", [])
            if req.symbol:
                match = next((c for c in cands if req.symbol.upper() in c["symbol"]), None)
                if match:
                    target_candidate = match
                    chosen_strat = "BUY_LAYAK"
            elif cands:
                target_candidate = cands[0]
                chosen_strat = "BUY_LAYAK"
        except Exception:
            pass

    # If still no candidate, build from live universe metric (e.g. for requested symbol or top stock)
    if not target_candidate:
        metrics = _build_current_universe_metrics()
        sym = req.symbol.upper() if req.symbol else "BUMI.JK"
        if not sym.endswith(".JK"):
            sym += ".JK"
        stock_m = next((m for m in metrics if m["symbol"] == sym), metrics[0] if metrics else None)
        p = float(stock_m["price"] if stock_m else 500.0)
        chosen_strat = "PRE_ARA" if chosen_strat == "AUTO" else chosen_strat
        target_candidate = {
            "symbol": sym,
            "name": stock_m.get("name", sym) if stock_m else sym,
            "sector": stock_m.get("sector", "General") if stock_m else "General",
            "current_price": p,
            "price": p,
            "ai_score": stock_m.get("ai_score", 85.0) if stock_m else 85.0,
            "predicted_tp1_price": round(p * 1.06, 0),
            "ara_ceiling_price": round(p * 1.15, 0),
            "predicted_stop_loss_price": round(p * 0.95, 0),
        }

    # Extract required fields safely
    symbol = target_candidate.get("symbol", "BBCA.JK")
    name = target_candidate.get("name", symbol)
    sector = target_candidate.get("sector", "General")
    entry_p = float(target_candidate.get("current_price", target_candidate.get("price", target_candidate.get("close_price", 1000.0))))
    score = float(target_candidate.get("ai_score", target_candidate.get("bpjs_score", target_candidate.get("pre_ara_score", target_candidate.get("bsjp_score", 75.0)))))

    if chosen_strat == "BPJS":
        tp1 = float(target_candidate.get("target_tp1_price", round(entry_p * 1.035, 0)))
        tp2 = float(target_candidate.get("target_tp2_price", round(entry_p * 1.070, 0)))
        sl = float(target_candidate.get("stop_loss_price", round(entry_p * 0.975, 0)))
        selling_window = "SORE INI: 15:40 - 15:50 WIB (Zero Overnight)"
    elif chosen_strat == "BSJP":
        tp1 = float(target_candidate.get("target_sell_morning_min", round(entry_p * 1.03, 0)))
        tp2 = float(target_candidate.get("target_sell_morning_max", round(entry_p * 1.06, 0)))
        sl = float(target_candidate.get("stop_loss_morning", round(entry_p * 0.97, 0)))
        selling_window = "PAGI H+1: 09:05 - 09:20 WIB (Opening Spike)"
    elif chosen_strat == "PRE_ARA":
        tp1 = float(target_candidate.get("predicted_tp1_price", round(entry_p * 1.08, 0)))
        tp2 = float(target_candidate.get("ara_ceiling_price", round(entry_p * 1.20, 0)))
        sl = float(target_candidate.get("predicted_stop_loss_price", round(entry_p * 0.95, 0)))
        selling_window = "TP1: 09:30 - 10:15 WIB | Plafon ARA: 11:00 - 11:30 / 15:45 WIB"
    else:
        tp1 = float(target_candidate.get("tp1_price", round(entry_p * 1.06, 0)))
        tp2 = float(target_candidate.get("tp2_price", round(entry_p * 1.12, 0)))
        sl = float(target_candidate.get("stop_loss_price", round(entry_p * 0.95, 0)))
        selling_window = "Swing 3 - 15 Hari Bursa (Exit saat mendekati level TP1/TP2)"

    dispatch_res = await dispatcher.dispatch_buy_signal(
        symbol=symbol,
        name=name,
        sector=sector,
        strategy=chosen_strat,
        entry_price=entry_p,
        target_tp1=tp1,
        target_tp2=tp2,
        stop_loss=sl,
        score=score,
        selling_time_window=selling_window,
        force=req.force
    )

    return {
        "status": "SUCCESS",
        "message": f"Notifikasi sinyal {chosen_strat} untuk #{symbol.replace('.JK', '')} berhasil dikirim ke Telegram!",
        "signal_dispatched": {
            "symbol": symbol,
            "name": name,
            "sector": sector,
            "strategy": chosen_strat,
            "entry_price": entry_p,
            "target_tp1": tp1,
            "target_tp2": tp2,
            "stop_loss": sl,
            "score": score,
            "selling_time_window": selling_window
        },
        "dispatch_result": dispatch_res
    }
