"""
Tactical Playbook Generator for IHSG Slayer.
Generates comprehensive, professional, step-by-step execution instructions
for both BUY (Entry) and SELL (Exit) phases across all quantitative trading strategies.
"""

from typing import Dict, Any, Optional


class TacticalPlaybookGenerator:
    """
    Generates step-by-step tactical trading playbooks formatted for Telegram (HTML)
    and WhatsApp (Markdown) with clear, actionable buy and sell steps.
    """

    @classmethod
    def generate_buy_playbook(
        cls,
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
        extra_metrics: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete step-by-step BUY playbook.
        """
        sym = symbol.replace(".JK", "").upper()
        gain_tp1 = round(((target_tp1 - entry_price) / entry_price) * 100.0, 1)
        gain_tp2 = round(((target_tp2 - entry_price) / entry_price) * 100.0, 1)
        risk_pct = round(((stop_loss - entry_price) / entry_price) * 100.0, 1)
        rr_ratio = round(abs(gain_tp1 / (risk_pct if risk_pct != 0 else -1)), 1)

        # Strategy-specific tactic details
        strat_key = strategy.upper()
        if "PRE_ARA" in strat_key or "ARA" in strat_key:
            strat_label = "PRE-ARA HUNTER"
            time_window = selling_time_window or "TP1: 09:30 - 10:15 WIB | Plafon ARA: 11:00 - 11:30 / 15:45 WIB"
            buy_step_2 = f"Antre beli di area Rp {entry_price:,.0f} s/d Rp {round(entry_price * 1.01):,.0f}. Jika momentum volume melonjak > 2.5x, boleh Hajar Kanan (HAKA) maksimal 1-2 fraksi di atas."
            sell_step_1 = f"<b>Kunci Profit TP1 (+{gain_tp1}%):</b> Saat harga menyentuh Rp {target_tp1:,.0f}, jual 50% porsi lot Anda (09:30 - 10:15 WIB)."
            sell_step_2 = f"<b>Riding Plafon ARA (+{gain_tp2}%):</b> Pasang Trailing Stop di Rp {round(entry_price * 1.03):,.0f} untuk sisa 50% lot menuju target ARA Rp {target_tp2:,.0f}."
            time_stop_note = "Jika antrean Bid ARA terbongkar di sesi 2 (15:00 - 15:45 WIB), segera tutup seluruh sisa posisi."
        elif "BPJS" in strat_key:
            strat_label = "BPJS (BELI PAGI JUAL SORE)"
            time_window = selling_time_window or "SORE INI: 15:40 - 15:50 WIB (Zero Overnight Risk)"
            buy_step_2 = f"Beli di area Rp {entry_price:,.0f} s/d Rp {round(entry_price * 1.008):,.0f} pada jam 09:15 - 09:45 WIB setelah konfirmasi Open=Low dan lonjakan volume pagi."
            sell_step_1 = f"<b>Take Profit Kilat (+{gain_tp1}%):</b> Jual 50% lot jika menyentuh TP1 Rp {target_tp1:,.0f} di sesi 1."
            sell_step_2 = f"<b>Exit Sesi Sore (+{gain_tp2}%):</b> Jual sisa 50% lot di sesi Pre-Closing (15:40 - 15:50 WIB) mendekati TP2 Rp {target_tp2:,.0f}."
            time_stop_note = "Wajib ZERO OVERNIGHT. Tidak boleh menyimpan posisi menginap apa pun alasannya."
        elif "BSJP" in strat_key:
            strat_label = "BSJP (BELI SORE JUAL PAGI)"
            time_window = selling_time_window or "PAGI H+1: 09:05 - 09:20 WIB (Opening Spike)"
            buy_step_2 = f"Beli pada jam 15:45 - 15:55 WIB (sesi Pre-Closing) di harga penutupan Rp {entry_price:,.0f}."
            sell_step_1 = f"<b>Jual Lonjakan Pembukaan (+{gain_tp1}%):</b> Pasang antrean jual di TP1 Rp {target_tp1:,.0f} pada jam 08:55 WIB sebelum bursa buka."
            sell_step_2 = f"<b>Eksekusi Sisa Lot (+{gain_tp2}%):</b> Jika harga terus terbang ke TP2 Rp {target_tp2:,.0f}, kawal dengan trailing stop hingga jam 09:20 WIB."
            time_stop_note = "Maksimal hold sampai jam 09:30 WIB pagi H+1. Hindari overholding saat volume pembukaan mulai reda."
        else:
            strat_label = "SUPER CONFLUENCE & SWING"
            time_window = selling_time_window or "Swing 3 - 10 Hari Bursa (Exit di Area Resisten Kunci)"
            buy_step_2 = f"Akumulasi bertahap di area demand Rp {entry_price:,.0f} s/d Rp {round(entry_price * 1.015):,.0f} saat terjadi pullback wajar."
            sell_step_1 = f"<b>Take Profit Parsial (+{gain_tp1}%):</b> Jual 50% porsi saat menyentuh resisten pertama Rp {target_tp1:,.0f}."
            sell_step_2 = f"<b>Swing ke Target Maksimal (+{gain_tp2}%):</b> Pasang Trailing Stop di titik impas (Break-Even) dan hold sisa 50% lot menuju Rp {target_tp2:,.0f}."
            time_stop_note = "Hold selama tren MA20 terjaga. Evaluasi jika terbentuk sinyal distribusi institusional."

        tg_lines = [
            f"[SINYAL &amp; PANDUAN TAKTIS] #{sym}",
            f"<b>[STRATEGI]</b> {strat_label} (Skor AI: {score:.1f}/100)",
            f"<b>[EMITEN]</b> {name} ({sector})",
            "────────────────────────────",
            "<b>[PARAMETER HARGA]</b>",
            f"• <b>Harga Beli (Entry):</b> Rp {entry_price:,.0f}",
            f"• <b>Target TP1 (50%):</b> Rp {target_tp1:,.0f} (<b>+{gain_tp1}%</b>)",
            f"• <b>Target TP2 (Sisa):</b> Rp {target_tp2:,.0f} (<b>+{gain_tp2}%</b>)",
            f"• <b>Batas Cut Loss (SL):</b> Rp {stop_loss:,.0f} (<b>{risk_pct}%</b>)",
            f"• <b>Risk-Reward Ratio:</b> 1 : {rr_ratio}",
            "────────────────────────────",
            "<b>[ENTRY PLAYBOOK - LANGKAH BELI]</b>",
            "1. <b>Alokasi Modal:</b> Pasang 10% - 20% dari total modal kas (misal: 30 - 50 Lot).",
            f"2. <b>Cara Beli:</b> {buy_step_2}",
            f"3. <b>Pasang Pengaman:</b> Pasang Auto-Order Cut Loss di harga <b>Rp {stop_loss:,.0f}</b>.",
            "────────────────────────────",
            "<b>[EXIT PLAYBOOK - LANGKAH JUAL]</b>",
            f"1. {sell_step_1}",
            f"2. {sell_step_2}",
            f"3. <b>Batas Waktu (Time-Stop):</b> {time_window}",
            f"4. <b>Aturan Disiplin:</b> {time_stop_note}",
            f"5. <b>Skenario Darurat:</b> Jika harga menembus Rp {stop_loss:,.0f}, eksekusi Cut Loss tanpa kompromi.",
            "────────────────────────────",
            f"<a href=\"http://43.163.98.53/analysis/{symbol}\">[TERMINAL] Buka Analisis #{sym} di IHSG Slayer</a>"
        ]
        telegram_html = "\n".join(tg_lines)

        wa_lines = [
            f"[SINYAL & PANDUAN TAKTIS] #{sym}",
            f"*[STRATEGI]* {strat_label} (Skor AI: {score:.0f}/100)",
            f"*[EMITEN]* {name} ({sector})",
            "────────────────────────────",
            "*[PARAMETER HARGA]*",
            f"• *Harga Beli (Entry):* Rp {entry_price:,.0f}",
            f"• *Target TP1 (50%):* Rp {target_tp1:,.0f} (*+{gain_tp1}%*)",
            f"• *Target TP2 (Sisa):* Rp {target_tp2:,.0f} (*+{gain_tp2}%*)",
            f"• *Batas Cut Loss (SL):* Rp {stop_loss:,.0f} (*{risk_pct}%*)",
            f"• *Risk-Reward Ratio:* 1 : {rr_ratio}",
            "────────────────────────────",
            "*[ENTRY PLAYBOOK - LANGKAH BELI]*",
            "1. *Alokasi Modal:* Pasang 10% - 20% modal kas (misal: 30 - 50 Lot).",
            f"2. *Cara Beli:* {buy_step_2}",
            f"3. *Pasang Pengaman:* Pasang Auto-Order Cut Loss di harga *Rp {stop_loss:,.0f}*.",
            "────────────────────────────",
            "*[EXIT PLAYBOOK - LANGKAH JUAL]*",
            f"1. {sell_step_1.replace('<b>', '*').replace('</b>', '*')}",
            f"2. {sell_step_2.replace('<b>', '*').replace('</b>', '*')}",
            f"3. *Batas Waktu:* {time_window}",
            f"4. *Aturan Disiplin:* {time_stop_note}",
            f"5. *Skenario Darurat:* Jika sentuh Rp {stop_loss:,.0f}, eksekusi Cut Loss.",
            "────────────────────────────",
            f"[TERMINAL] http://localhost:3300/analysis/{symbol}"
        ]
        whatsapp_md = "\n".join(wa_lines)

        return {
            "symbol": sym,
            "strategy": strat_label,
            "telegram_html": telegram_html,
            "whatsapp_md": whatsapp_md,
            "entry_price": entry_price,
            "target_tp1": target_tp1,
            "target_tp2": target_tp2,
            "stop_loss": stop_loss,
            "selling_time_window": time_window,
        }

    @classmethod
    def generate_sell_playbook(
        cls,
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
        Generate a step-by-step execution report when a SELL action occurs.
        """
        sym = symbol.replace(".JK", "").upper()
        is_profit = realized_pnl_pct >= 0

        if "PROFIT_1" in action_type:
            action_title = "[TP1 HIT] TAKE PROFIT 1 BERHASIL (Kunci 50% Lot)"
            action_guide = f"Langkah Anda Selanjutnya: Amankan 50% modal kas. Pasang Trailing Stop di Rp {round(entry_price * 1.02):,.0f} untuk sisa 50% posisi menuju target maksimal."
        elif "PROFIT_2" in action_type or "ARA" in action_type:
            action_title = "[TP2 HIT] TAKE PROFIT 2 / ARA MAXIMAL TERCAPAI"
            action_guide = "Langkah Anda Selanjutnya: Seluruh posisi telah berhasil direalisasikan menjadi profit penuh. Dana kas kembali likuid 100%."
        elif "TRAILING" in action_type:
            action_title = "[TRAILING STOP] PROFIT DIAMANKAN DARI PUNCAK"
            action_guide = "Langkah Anda Selanjutnya: Seluruh sisa lot terjual otomatis setelah harga terkoreksi dari puncak tertinggi. Keuntungan terkunci sempurna."
        elif "TIME" in action_type:
            action_title = "[TIME STOP] PENUTUPAN SESI (Zero Overnight)"
            action_guide = "Langkah Anda Selanjutnya: Posisi ditutup sesuai jadwal waktu jual strategi (Pre-Closing). Portofolio bebas risiko menginap."
        else:
            action_title = "[STOP LOSS] CUT LOSS DIEKSEKUSI (Proteksi Modal)"
            action_guide = "Langkah Anda Selanjutnya: Modal terlindungi dari risiko penurunan lebih dalam. Dana kas kembali aman untuk peluang berikutnya."

        tg_lines = [
            f"<b>[EKSEKUSI JUAL] #{sym}</b>",
            "────────────────────────────",
            f"<b>Status:</b> {action_title}",
            f"<b>Strategi:</b> {strategy}",
            f"<b>Harga Beli:</b> Rp {entry_price:,.0f} ({shares_lot} Lot)",
            f"<b>Harga Jual:</b> Rp {exit_price:,.0f}",
            f"<b>Realized PnL:</b> {'+' if is_profit else ''}Rp {realized_pnl_amt:,.0f} (<b>{'+' if is_profit else ''}{realized_pnl_pct}%</b>)",
            f"<b>Durasi Hold:</b> {holding_duration}" if holding_duration else "",
            "────────────────────────────",
            "<b>[INSTRUKSI TINDAKAN]</b>",
            f"{action_guide}",
            "────────────────────────────",
            "<a href=\"http://43.163.98.53/forward-test\">[PORTFOLIO] Lihat Status Portofolio di IHSG Slayer</a>"
        ]
        telegram_html = "\n".join([l for l in tg_lines if l])

        wa_lines = [
            f"*[EKSEKUSI JUAL] #{sym}*",
            "────────────────────────────",
            f"*Status:* {action_title}",
            f"*Strategi:* {strategy}",
            f"*Harga Beli:* Rp {entry_price:,.0f} ({shares_lot} Lot)",
            f"*Harga Jual:* Rp {exit_price:,.0f}",
            f"*Realized PnL:* {'+' if is_profit else ''}Rp {realized_pnl_amt:,.0f} (*{'+' if is_profit else ''}{realized_pnl_pct}%*)",
            f"*Durasi Hold:* {holding_duration}" if holding_duration else "",
            "────────────────────────────",
            "*[INSTRUKSI TINDAKAN]*",
            f"{action_guide}",
            "────────────────────────────",
            "🔗 *Portofolio:* http://43.163.98.53/forward-test"
        ]
        whatsapp_md = "\n".join([l for l in wa_lines if l])

        return {
            "symbol": sym,
            "action_type": action_type,
            "telegram_html": telegram_html,
            "whatsapp_md": whatsapp_md,
            "realized_pnl_amt": realized_pnl_amt,
            "realized_pnl_pct": realized_pnl_pct,
        }
