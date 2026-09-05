"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  DollarSign,
  Activity,
  Sliders,
  Award,
  Flame,
  ArrowUpRight,
  Info,
  Terminal,
  Cpu,
  Send,
  MessageSquare,
  Smartphone,
  CheckCircle,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { ForwardTestPortfolio, ForwardPosition, BotLogEntry } from "@/lib/types";
import { formatRupiah, formatPercent } from "@/lib/utils";

const STRATEGY_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PRE_ARA: { label: "Pre-ARA Hunter", bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/40" },
  BPJS: { label: "BPJS Pagi", bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40" },
  BSJP: { label: "BSJP Sore", bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/40" },
  CONFLUENCE: { label: "Super Confluence", bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/40" },
  SMARTPICK: { label: "Smart Pick Rebound", bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/40" },
  MANUAL: { label: "Manual Trade", bg: "bg-slate-700/50", text: "text-slate-300", border: "border-slate-600" },
};

export default function ForwardTestStudioPage() {
  const [portfolio, setPortfolio] = useState<ForwardTestPortfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [runningCycle, setRunningCycle] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"positions" | "signals" | "terminal" | "alerts" | "closed" | "chart" | "settings">("positions");
  const [liveCandidates, setLiveCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);

  // Alert Settings State
  const [alertSettings, setAlertSettings] = useState<any>({
    telegram_enabled: true,
    telegram_bot_token: "",
    telegram_chat_id: "",
    whatsapp_enabled: false,
    whatsapp_provider: "fonnte",
    whatsapp_api_token: "",
    whatsapp_target_phone: "",
    enable_pre_ara_alerts: true,
    enable_bpjs_alerts: true,
    enable_bsjp_alerts: true,
    enable_confluence_alerts: true,
    enable_execution_alerts: true,
  });
  const [testingTg, setTestingTg] = useState<boolean>(false);
  const [testingWa, setTestingWa] = useState<boolean>(false);
  const [alertStatusMsg, setAlertStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Manual Open Modal State
  const [openModalVisible, setOpenModalVisible] = useState<boolean>(false);
  const [newSymbol, setNewSymbol] = useState<string>("");
  const [newStrategy, setNewStrategy] = useState<string>("BPJS");
  const [newEntryPrice, setNewEntryPrice] = useState<number>(1000);
  const [newLots, setNewLots] = useState<number>(50);
  const [newTp1, setNewTp1] = useState<number>(1035);
  const [newTp2, setNewTp2] = useState<number>(1070);
  const [newSl, setNewSl] = useState<number>(975);

  // Close Confirmation Modal
  const [closeTarget, setCloseTarget] = useState<ForwardPosition | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getForwardTestStatus();
      setPortfolio(data);
    } catch (err) {
      console.error("Failed to load forward test status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlertSettings = async () => {
    try {
      const cfg = await api.getAlertSettings();
      if (cfg) setAlertSettings(cfg);
    } catch (e) {
      console.error("Failed to load alert settings:", e);
    }
  };

  const fetchLiveSignals = async () => {
    setLoadingCandidates(true);
    try {
      const [preAra, bpjs, bsjp, conf] = await Promise.allSettled([
        api.getPreARACandidates(60),
        api.getBPJSCandidates(60),
        api.getBSJPCandidates(50),
        api.getMultiScreenerConfluence(2, 55),
      ]);

      const pool: any[] = [];
      if (preAra.status === "fulfilled" && preAra.value.candidates) {
        preAra.value.candidates.forEach((c: any) => pool.push({ ...c, strat_code: "PRE_ARA", strat_name: "Pre-ARA Hunter" }));
      }
      if (bpjs.status === "fulfilled" && bpjs.value.candidates) {
        bpjs.value.candidates.forEach((c: any) => pool.push({ ...c, strat_code: "BPJS", strat_name: "BPJS Pagi" }));
      }
      if (bsjp.status === "fulfilled" && bsjp.value.candidates) {
        bsjp.value.candidates.forEach((c: any) => pool.push({ ...c, strat_code: "BSJP", strat_name: "BSJP Sore" }));
      }
      if (conf.status === "fulfilled" && conf.value.candidates) {
        conf.value.candidates.forEach((c: any) => pool.push({ ...c, strat_code: "CONFLUENCE", strat_name: "Super Confluence" }));
      }
      setLiveCandidates(pool);
    } catch (e) {
      console.error("Failed to load live candidate pool:", e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLiveSignals();
    fetchAlertSettings();

    const interval = setInterval(() => {
      fetchStatus();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      await api.syncForwardPrices();
      await fetchStatus();
    } catch (e) {
      console.error("Failed to sync prices:", e);
    } finally {
      setSyncing(false);
    }
  };

  const handleRunAutonomousCycle = async () => {
    setRunningCycle(true);
    try {
      await api.runAutonomousBotCycle();
      await fetchStatus();
      setActiveTab("terminal");
    } catch (e) {
      console.error("Failed to run bot cycle:", e);
    } finally {
      setRunningCycle(false);
    }
  };

  const handleToggleBot = async () => {
    if (!portfolio) return;
    try {
      const nextState = !portfolio.auto_bot_enabled;
      await api.updateBotSettings({ auto_bot_enabled: nextState });
      await fetchStatus();
    } catch (e) {
      console.error("Failed to toggle bot:", e);
    }
  };

  const handleSaveAlertSettings = async () => {
    try {
      await api.updateAlertSettings(alertSettings);
      setAlertStatusMsg({ text: "Pengaturan notifikasi berhasil disimpan!", type: "success" });
      setTimeout(() => setAlertStatusMsg(null), 4000);
    } catch (e: any) {
      setAlertStatusMsg({ text: e.message || "Gagal menyimpan pengaturan", type: "error" });
    }
  };

  const handleTestTelegram = async () => {
    if (!alertSettings.telegram_bot_token || !alertSettings.telegram_chat_id) {
      alert("Harap masukkan Telegram Bot Token dan Chat ID terlebih dahulu.");
      return;
    }
    setTestingTg(true);
    try {
      await api.testTelegramAlert({
        bot_token: alertSettings.telegram_bot_token,
        chat_id: alertSettings.telegram_chat_id,
      });
      setAlertStatusMsg({ text: "Notifikasi Panduan Taktis berhasil terkirim ke Telegram!", type: "success" });
      setTimeout(() => setAlertStatusMsg(null), 5000);
    } catch (e: any) {
      setAlertStatusMsg({ text: e.message || "Gagal mengirim ke Telegram", type: "error" });
    } finally {
      setTestingTg(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!alertSettings.whatsapp_api_token || !alertSettings.whatsapp_target_phone) {
      alert("Harap masukkan WhatsApp API Token dan Nomor Tujuan terlebih dahulu.");
      return;
    }
    setTestingWa(true);
    try {
      await api.testWhatsAppAlert({
        provider: alertSettings.whatsapp_provider || "fonnte",
        api_token: alertSettings.whatsapp_api_token,
        target_phone: alertSettings.whatsapp_target_phone,
      });
      setAlertStatusMsg({ text: "Notifikasi Panduan Taktis berhasil terkirim ke WhatsApp!", type: "success" });
      setTimeout(() => setAlertStatusMsg(null), 5000);
    } catch (e: any) {
      setAlertStatusMsg({ text: e.message || "Gagal mengirim ke WhatsApp", type: "error" });
    } finally {
      setTestingWa(false);
    }
  };

  const handleExecuteCandidate = async (c: any) => {
    try {
      const entryP = c.current_price || c.entry_price || c.price || 1000;
      const tp1 = c.target_tp1_price || c.target_sell_morning_min || c.target_tp1 || Math.round(entryP * 1.035);
      const tp2 = c.predicted_target_price || c.target_sell_morning_max || c.target_tp2 || Math.round(entryP * 1.070);
      const sl = c.predicted_stop_loss_price || c.stop_loss_morning || c.stop_loss_price || c.stop_loss || Math.round(entryP * 0.975);

      await api.openForwardPosition({
        symbol: c.symbol,
        strategy: c.strat_code || "BPJS",
        entry_price: entryP,
        shares_lot: portfolio?.bot_settings?.default_lot_per_trade || 50,
        target_tp1: Number(tp1),
        target_tp2: Number(tp2),
        stop_loss: Number(sl),
        name: c.name || c.symbol,
        sector: c.sector || "General",
        selling_time_window: c.selling_time_window || "",
        notes: `Auto-Executed from ${c.strat_name || "Screener"}`
      });

      await fetchStatus();
      setActiveTab("positions");
    } catch (e: any) {
      alert(e.message || "Gagal membuka posisi forward test");
    }
  };

  const handleClosePosition = async (pos: ForwardPosition) => {
    try {
      await api.closeForwardPosition({
        position_id: pos.id,
        close_price: pos.current_price,
        exit_reason: "MANUAL",
        notes: "Ditutup manual oleh trader di Forward Test Studio."
      });
      setCloseTarget(null);
      await fetchStatus();
    } catch (e: any) {
      alert(e.message || "Gagal menutup posisi.");
    }
  };

  const handleResetPortfolio = async () => {
    if (!confirm("Apakah Anda yakin ingin me-reset seluruh portofolio Forward Test kembali ke modal awal Rp 100.000.000?")) return;
    try {
      await api.resetForwardPortfolio(100_000_000);
      await fetchStatus();
    } catch (e) {
      console.error("Failed to reset:", e);
    }
  };

  const p = portfolio;
  const openCount = p?.open_positions?.length || 0;
  const closedCount = p?.closed_positions?.length || 0;
  const logs = p?.bot_logs || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-cyan-500/40 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              <span>QUANT AUTONOMOUS FORWARD BOT v2</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Daemon Worker &bull; 30s Loop &bull; Telegram &amp; WhatsApp Playbooks
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>Studio Forward Test &amp; Notifikasi Taktis Beli-Jual</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sistem menjalankan bot otonom di background dan mengirimkan notifikasi taktis *step-by-step* (langkah beli, alokasi lot, target TP1, trailing stop, hingga jam jual bursa) langsung ke Telegram dan WhatsApp Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleBot}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all shadow-md ${
              p?.auto_bot_enabled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10"
                : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {p?.auto_bot_enabled ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>BOT: AKTIF (OTONOM)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-400" />
                <span>BOT: OFF (MANUAL)</span>
              </>
            )}
          </button>

          <button
            onClick={handleRunAutonomousCycle}
            disabled={runningCycle}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${runningCycle ? "animate-spin" : ""}`} />
            <span>{runningCycle ? "Mengeksekusi..." : "Jalankan 1 Siklus Bot"}</span>
          </button>

          <button
            onClick={handleSyncPrices}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Sinkron..." : "Sinkronkan Harga"}</span>
          </button>

          <button
            onClick={() => setOpenModalVisible(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono flex items-center gap-1 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Input Trade</span>
          </button>

          <button
            onClick={handleResetPortfolio}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
            title="Reset Portofolio Forward Test"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Nilai Portofolio (Equity)</div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {formatRupiah(p?.portfolio_equity || 100_000_000)}
          </div>
          <div className="text-[11px] font-mono flex items-center gap-1">
            <span className="text-slate-500">Kas:</span>
            <span className="text-slate-300 font-bold">{formatRupiah(p?.cash_balance || 0)}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-emerald-500/30 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Total Realized PnL (Forward)</div>
          <div className={`text-2xl font-black font-mono ${(p?.total_realized_pnl_amt || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(p?.total_realized_pnl_amt || 0) >= 0 ? "+" : ""}{formatRupiah(p?.total_realized_pnl_amt || 0)}
          </div>
          <div className="text-[11px] font-mono flex items-center gap-1">
            <span className="text-slate-500">Return:</span>
            <span className={`font-bold ${(p?.total_realized_pnl_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {(p?.total_realized_pnl_pct || 0) >= 0 ? "+" : ""}{p?.total_realized_pnl_pct || 0}%
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-cyan-500/30 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Forward Win Rate</div>
          <div className="text-2xl font-black font-mono text-cyan-300">
            {p?.win_rate_pct || 0}% <span className="text-xs font-normal text-slate-400">({p?.winning_trades_count || 0}W / {p?.losing_trades_count || 0}L)</span>
          </div>
          <div className="text-[11px] font-mono flex items-center gap-1">
            <span className="text-slate-500">Profit Factor:</span>
            <span className="text-cyan-400 font-bold">{p?.profit_factor || 0}x</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-amber-500/30 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Floating PnL ({openCount} Posisi)</div>
          <div className={`text-2xl font-black font-mono ${(p?.total_floating_pnl_amt || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(p?.total_floating_pnl_amt || 0) >= 0 ? "+" : ""}{formatRupiah(p?.total_floating_pnl_amt || 0)}
          </div>
          <div className="text-[11px] font-mono flex items-center gap-1">
            <span className="text-slate-500">Floating %:</span>
            <span className={`font-bold ${(p?.total_floating_pnl_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {(p?.total_floating_pnl_pct || 0) >= 0 ? "+" : ""}{p?.total_floating_pnl_pct || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex gap-1.5 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 w-fit flex-wrap">
        {[
          { key: "positions" as const, label: `Posisi Aktif (${openCount})`, icon: TrendingUp },
          { key: "alerts" as const, label: "Notifikasi & Playbook Taktis (TG/WA)", icon: Send },
          { key: "terminal" as const, label: `Terminal Bot & Log (${logs.length})`, icon: Terminal },
          { key: "signals" as const, label: `Sinyal Live Siap Eksekusi (${liveCandidates.length})`, icon: Zap },
          { key: "closed" as const, label: `Riwayat Selesai (${closedCount})`, icon: Target },
          { key: "chart" as const, label: "Kurva Ekuitas Forward", icon: Activity },
          { key: "settings" as const, label: "Parameter Bot", icon: Sliders },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeTab === key
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Status Message Alert */}
      {alertStatusMsg && (
        <div className={`p-4 rounded-xl font-mono text-xs flex items-center gap-2 border ${
          alertStatusMsg.type === "success" ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40" : "bg-rose-950/60 text-rose-300 border-rose-500/40"
        }`}>
          {alertStatusMsg.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{alertStatusMsg.text}</span>
        </div>
      )}

      {/* TAB: NOTIFIKASI & PLAYBOOK TAKTIS (TELEGRAM & WHATSAPP) */}
      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Telegram & WhatsApp Configuration */}
          <div className="lg:col-span-7 space-y-6">
            {/* Telegram Setup Card */}
            <div className="p-6 rounded-2xl bg-cardBg border border-cyan-500/40 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                    TG
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 font-mono">Integrasi Telegram Bot</h4>
                    <p className="text-[11px] text-slate-400">Kirim notifikasi playbook lengkap + tombol tautan analisis instan.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.telegram_enabled}
                    onChange={(e) => setAlertSettings({ ...alertSettings, telegram_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Telegram Bot Token (dari @BotFather):</label>
                  <input
                    type="text"
                    placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    value={alertSettings.telegram_bot_token}
                    onChange={(e) => setAlertSettings({ ...alertSettings, telegram_bot_token: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Telegram Chat ID / Group ID / Channel ID:</label>
                  <input
                    type="text"
                    placeholder="Contoh: 987654321 atau -1001234567890"
                    value={alertSettings.telegram_chat_id}
                    onChange={(e) => setAlertSettings({ ...alertSettings, telegram_chat_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Gunakan @userinfobot di Telegram untuk melihat Chat ID Anda.</span>
                  <button
                    onClick={handleTestTelegram}
                    disabled={testingTg}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${testingTg ? "animate-spin" : ""}`} />
                    <span>{testingTg ? "Mengirim..." : "Tes Kirim ke Telegram"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Setup Card */}
            <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold">
                    WA
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100 font-mono">Integrasi WhatsApp Gateway</h4>
                    <p className="text-[11px] text-slate-400">Kirim instruksi taktis langsung ke nomor WhatsApp pribadi atau grup.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.whatsapp_enabled}
                    onChange={(e) => setAlertSettings({ ...alertSettings, whatsapp_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Provider Gateway:</label>
                    <select
                      value={alertSettings.whatsapp_provider}
                      onChange={(e) => setAlertSettings({ ...alertSettings, whatsapp_provider: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="fonnte">Fonnte (Rekomendasi)</option>
                      <option value="wablas">Wablas Gateway</option>
                      <option value="custom_webhook">Custom REST Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Nomor WhatsApp Tujuan:</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      value={alertSettings.whatsapp_target_phone}
                      onChange={(e) => setAlertSettings({ ...alertSettings, whatsapp_target_phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">API Token / Secret Key:</label>
                  <input
                    type="text"
                    placeholder="Token API dari dashboard gateway"
                    value={alertSettings.whatsapp_api_token}
                    onChange={(e) => setAlertSettings({ ...alertSettings, whatsapp_api_token: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Mendukung format Markdown WhatsApp resmi (*bold*, _italic_).</span>
                  <button
                    onClick={handleTestWhatsApp}
                    disabled={testingWa}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Smartphone className={`w-3.5 h-3.5 ${testingWa ? "animate-spin" : ""}`} />
                    <span>{testingWa ? "Mengirim..." : "Tes Kirim ke WhatsApp"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveAlertSettings}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm font-mono shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Seluruh Pengaturan Notifikasi</span>
            </button>
          </div>

          {/* Right Column: Live Playbook Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-100 font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Preview Format Pesan Step-by-Step</span>
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LIVE FORMAT
                </span>
              </div>

              {/* Sample Playbook Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-3 leading-relaxed text-slate-200 max-h-[520px] overflow-y-auto">
                <div className="text-cyan-300 font-bold">🎯 SINYAL &amp; PANDUAN TAKTIS: #JECC</div>
                <div className="text-[11px] text-slate-400">
                  ⚡ <strong>Strategi:</strong> PRE-ARA HUNTER (Skor AI: 88/100)<br />
                  🏢 <strong>Emiten:</strong> Jembo Cable Company Tbk (Industrial)
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5 text-[11px]">
                  <div>• <strong>Harga Beli (Entry):</strong> Rp 665</div>
                  <div>• <strong>Target TP1 (50%):</strong> Rp 700 (<span className="text-emerald-400 font-bold">+5.3%</span>)</div>
                  <div>• <strong>Target TP2 (ARA):</strong> Rp 805 (<span className="text-cyan-400 font-bold">+21.1%</span>)</div>
                  <div>• <strong>Batas Cut Loss:</strong> Rp 645 (<span className="text-rose-400 font-bold">-3.0%</span>)</div>
                  <div>• <strong>Risk-Reward:</strong> 1 : 2.8</div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="text-emerald-400 font-bold">🟢 LANGKAH-LANGKAH BELI (ENTRY):</div>
                  <div className="pl-2 border-l border-emerald-500/40 space-y-1 text-slate-300">
                    <div>1. <strong>Alokasi Modal:</strong> Pasang 10% - 20% modal kas (misal: 50 Lot).</div>
                    <div>2. <strong>Cara Beli:</strong> Antre di area Rp 665 - 670. Jika momentum volume &gt; 2.5x, boleh HAKA 1 fraksi.</div>
                    <div>3. <strong>Pasang Pengaman:</strong> Pasang Auto-Order Cut Loss di harga <strong>Rp 645</strong>.</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="text-rose-400 font-bold">🔴 LANGKAH-LANGKAH JUAL (EXIT):</div>
                  <div className="pl-2 border-l border-rose-500/40 space-y-1 text-slate-300">
                    <div>1. <strong>Kunci Profit TP1 (+5.3%):</strong> Jual 50% lot di harga Rp 700 (09:30 - 10:15 WIB).</div>
                    <div>2. <strong>Riding Plafon ARA (+21.1%):</strong> Pasang Trailing Stop di Rp 685 untuk sisa lot menuju Rp 805.</div>
                    <div>3. <strong>Batas Waktu:</strong> Pagi 09:30 - 10:15 / Plafon ARA 15:45 WIB.</div>
                    <div>4. <strong>Aturan:</strong> Tutup posisi jika antrean ARA terbongkar di sesi 2.</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-400 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  <span>Tombol Telegram: [🔍 Buka Analisis #JECC di IHSG Slayer]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: POSISI AKTIF LIVE */}
      {activeTab === "positions" && (
        <div className="space-y-4">
          {openCount === 0 ? (
            <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
              <Bot className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-slate-200 font-bold text-sm">Tidak Ada Posisi Forward Test yang Sedang Terbuka</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Buka tab &quot;Sinyal Live Siap Eksekusi&quot; untuk langsung menguji kandidat Pre-ARA / BPJS / BSJP, atau aktifkan Auto-Bot agar bot membuka posisi otomatis.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={handleRunAutonomousCycle}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono inline-flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Jalankan 1 Siklus Pemindaian Bot</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {p?.open_positions.map((pos) => {
                const strat = STRATEGY_BADGES[pos.strategy] || STRATEGY_BADGES.MANUAL;
                const isFloatingProfit = pos.floating_pnl_amt >= 0;

                return (
                  <div
                    key={pos.id}
                    className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4 shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/analysis/${pos.symbol}`}
                            className="text-2xl font-black font-mono text-white hover:text-cyan-300 transition-colors"
                          >
                            {pos.symbol}
                          </Link>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${strat.bg} ${strat.text} ${strat.border}`}>
                            {strat.label}
                          </span>
                          {pos.breakeven_lock_active && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>[BREAKEVEN LOCKED]</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-sans">
                          {pos.name} &bull; <span className="text-slate-500">{pos.sector}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-[11px] text-slate-400">Harga Terkini</div>
                        <div className="text-base font-black text-slate-100">
                          {formatRupiah(pos.current_price)}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400">Harga Beli</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">{formatRupiah(pos.entry_price)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Ukuran Lot</div>
                        <div className="text-xs font-bold text-cyan-300 mt-0.5">{pos.shares_lot} Lot ({pos.total_shares} lbr)</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Modal Terpasang</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">{formatRupiah(pos.invested_capital)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Floating PnL</div>
                        <div className={`text-xs font-black mt-0.5 ${isFloatingProfit ? "text-emerald-400" : "text-rose-400"}`}>
                          {isFloatingProfit ? "+" : ""}{formatRupiah(pos.floating_pnl_amt)} ({isFloatingProfit ? "+" : ""}{pos.floating_pnl_pct}%)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                        <span className="text-[9px] text-emerald-400 block">Target TP1:</span>
                        <span className="font-bold text-emerald-300">{formatRupiah(pos.target_tp1)}</span>
                        <span className="text-[9px] text-emerald-400 block font-normal">+{pos.predicted_gain_tp1_pct}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                        <span className="text-[9px] text-cyan-400 block">Target TP2:</span>
                        <span className="font-bold text-cyan-300">{formatRupiah(pos.target_tp2)}</span>
                        <span className="text-[9px] text-cyan-400 block font-normal">+{pos.predicted_gain_tp2_pct}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30">
                        <span className="text-[9px] text-rose-400 block">Cut Loss (SL):</span>
                        <span className="font-bold text-rose-300">{formatRupiah(pos.stop_loss)}</span>
                        <span className="text-[9px] text-rose-400 block font-normal">{pos.predicted_stop_loss_pct}%</span>
                      </div>
                    </div>

                    {pos.trailing_stop_active && (
                      <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[11px] font-mono flex items-center justify-between text-indigo-300">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Trailing Stop Aktif: {formatRupiah(pos.trailing_stop_price)}</span>
                        </div>
                        <span className="text-[9px] opacity-75">Puncak: {formatRupiah(pos.highest_price)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Masuk: {pos.entry_time}</span>
                      </div>
                      <button
                        onClick={() => setCloseTarget(pos)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
                      >
                        Tutup Posisi (Jual)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: TERMINAL AKTIVITAS BOT LIVE */}
      {activeTab === "terminal" && (
        <div className="p-6 rounded-2xl bg-cardBg border border-cyan-500/40 space-y-4 shadow-xl">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-base text-slate-100 font-mono flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <span>Terminal Log Audit Bot Kuantitatif Otonom</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Feed aktivitas real-time dari background worker yang memindai pergerakan harga BEI setiap 30 detik.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAutonomousCycle}
                disabled={runningCycle}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Play className="w-3 h-3" />
                <span>Jalankan Siklus Sekarang</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-8">Belum ada log aktivitas bot.</div>
            ) : (
              logs.map((log) => {
                const levelColor =
                  log.level === "TRADE"
                    ? "text-cyan-300 bg-cyan-950/60 border-cyan-500/40"
                    : log.level === "SUCCESS"
                    ? "text-emerald-300 bg-emerald-950/60 border-emerald-500/40"
                    : log.level === "WARN" || log.level === "ALERT"
                    ? "text-rose-300 bg-rose-950/60 border-rose-500/40"
                    : "text-slate-300 bg-slate-900/60 border-slate-800";

                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${levelColor}`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">[{log.timestamp}]</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-900/80 border border-slate-700">
                          {log.action}
                        </span>
                        {log.symbol && (
                          <span className="text-xs font-bold text-cyan-400">[{log.symbol}]</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-200">{log.message}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: SINYAL LIVE SIAP EKSEKUSI */}
      {activeTab === "signals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs font-mono text-slate-400">
              Menampilkan {liveCandidates.length} kandidat live dari seluruh screener aktif untuk forward testing 1-click:
            </div>
            <button
              onClick={fetchLiveSignals}
              disabled={loadingCandidates}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1 border border-slate-700"
            >
              <RefreshCw className={`w-3 h-3 ${loadingCandidates ? "animate-spin" : ""}`} />
              <span>Refresh Sinyal</span>
            </button>
          </div>

          {loadingCandidates ? (
            <div className="py-16 text-center text-cyan-400 font-mono space-y-3">
              <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>Memindai seluruh sinyal live bursa...</div>
            </div>
          ) : liveCandidates.length === 0 ? (
            <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
              <Zap className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-slate-200 font-bold text-sm">Belum Ada Sinyal Live yang Terdeteksi</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Buka tab screener (Pre-ARA / BPJS / BSJP) untuk memicu pemindaian universe saham.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveCandidates.map((c, idx) => {
                const strat = STRATEGY_BADGES[c.strat_code] || STRATEGY_BADGES.MANUAL;
                const price = c.current_price || c.entry_price || c.price || 0;
                const tp1 = c.target_tp1_price || c.target_sell_morning_min || c.target_tp1 || Math.round(price * 1.035);
                const tp2 = c.predicted_target_price || c.target_sell_morning_max || c.target_tp2 || Math.round(price * 1.070);

                return (
                  <div
                    key={`${c.symbol}-${idx}`}
                    className="p-5 rounded-2xl bg-cardBg border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xl text-white">{c.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${strat.bg} ${strat.text} ${strat.border}`}>
                            {strat.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5 truncate max-w-[180px]">
                          {c.name || c.symbol}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-bold text-slate-100">{formatRupiah(price)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-center">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Target 1:</span>
                        <span className="text-emerald-400 font-bold">{formatRupiah(tp1)}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Target 2:</span>
                        <span className="text-cyan-400 font-bold">{formatRupiah(tp2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteCandidate(c)}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Eksekusi ke Forward Test</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: RIWAYAT TRADE SELESAI */}
      {activeTab === "closed" && (
        <div className="space-y-4">
          {closedCount === 0 ? (
            <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
              <Target className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-slate-200 font-bold text-sm">Belum Ada Trade Forward Test yang Selesai</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Trade yang ditutup secara otomatis (TP/SL) atau manual akan tercatat di audit log ini.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 px-3">Emiten</th>
                    <th className="pb-3 px-3">Strategi</th>
                    <th className="pb-3 px-3">Waktu Masuk</th>
                    <th className="pb-3 px-3">Waktu Keluar</th>
                    <th className="pb-3 px-3">Beli</th>
                    <th className="pb-3 px-3">Jual</th>
                    <th className="pb-3 px-3">Realized PnL</th>
                    <th className="pb-3 px-3">Alasan Exit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {p?.closed_positions.map((pos) => {
                    const isWin = (pos.realized_pnl_amt || 0) > 0;
                    const strat = STRATEGY_BADGES[pos.strategy] || STRATEGY_BADGES.MANUAL;

                    return (
                      <tr key={pos.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{pos.symbol}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{pos.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${strat.bg} ${strat.text} ${strat.border}`}>
                            {strat.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{pos.entry_time}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{pos.close_time || "-"}</td>
                        <td className="py-3 px-3 text-slate-200">{formatRupiah(pos.entry_price)}</td>
                        <td className="py-3 px-3 text-slate-200">{formatRupiah(pos.close_price || pos.current_price)}</td>
                        <td className={`py-3 px-3 font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                          {isWin ? "+" : ""}{formatRupiah(pos.realized_pnl_amt || 0)} ({isWin ? "+" : ""}{pos.realized_pnl_pct || 0}%)
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.exit_reason?.includes("PROFIT") ? "bg-emerald-500/20 text-emerald-300" :
                            pos.exit_reason?.includes("LOSS") ? "bg-rose-500/20 text-rose-300" : "bg-cyan-500/20 text-cyan-300"
                          }`}>
                            {pos.exit_reason || "MANUAL"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: KURVA EKUITAS FORWARD */}
      {activeTab === "chart" && (
        <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-base text-slate-100 font-mono flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Kurva Pertumbuhan Ekuitas Forward Test (Realized + Floating)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Progres portofolio out-of-sample real-time dibanding modal awal Rp 100.000.000.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p?.equity_history || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 11 }}
                  formatter={(v: any) => [formatRupiah(Number(v)), "Ekuitas"]}
                />
                <ReferenceLine y={p?.initial_capital || 100_000_000} stroke="#f59e0b" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="equity" stroke="#06b6d4" fill="url(#eqG)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB: PARAMETER BOT */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-5 shadow-xl max-w-3xl">
          <h4 className="font-bold text-base text-slate-100 font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Konfigurasi Bot Auto-Forward Execution</span>
          </h4>
          <p className="text-xs text-slate-400">
            Atur aturan eksekusi otomatis bot Forward Test saat memindai sinyal kuantitatif.
          </p>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">Auto Take Profit (TP1 &amp; TP2)</div>
                <div className="text-slate-400 text-[11px] font-sans">Otomatis jual saat harga menyentuh target profit kuantitatif.</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">AKTIF</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">Auto Stop Loss (-2.5% ~ -3.0%)</div>
                <div className="text-slate-400 text-[11px] font-sans">Disiplin cut loss otomatis tanpa ragu jika level risiko tertembus.</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">AKTIF</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">Auto Time-Stop (BPJS 15:45 WIB)</div>
                <div className="text-slate-400 text-[11px] font-sans">Tutup posisi intraday sebelum bursa tutup (Zero Overnight).</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">AKTIF</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">Trailing Stop (2.0% dari Puncak)</div>
                <div className="text-slate-400 text-[11px] font-sans">Kunci profit saat harga melonjak tinggi dan berbalik arah.</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">AKTIF</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Open Modal */}
      {openModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-100 font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Input Trade Forward Test Manual</span>
              </h3>
              <button onClick={() => setOpenModalVisible(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Kode Saham (BEI):</label>
                <input
                  type="text"
                  placeholder="Misal: BBCA.JK"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Strategi:</label>
                  <select
                    value={newStrategy}
                    onChange={(e) => setNewStrategy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="BPJS">BPJS Pagi</option>
                    <option value="BSJP">BSJP Sore</option>
                    <option value="PRE_ARA">Pre-ARA Hunter</option>
                    <option value="CONFLUENCE">Super Confluence</option>
                    <option value="SMARTPICK">Smart Pick</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ukuran Lot:</label>
                  <input
                    type="number"
                    value={newLots}
                    onChange={(e) => setNewLots(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Harga Beli (Entry):</label>
                <input
                  type="number"
                  value={newEntryPrice}
                  onChange={(e) => {
                    const ep = Number(e.target.value);
                    setNewEntryPrice(ep);
                    setNewTp1(Math.round(ep * 1.035));
                    setNewTp2(Math.round(ep * 1.070));
                    setNewSl(Math.round(ep * 0.975));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Target TP1:</label>
                  <input
                    type="number"
                    value={newTp1}
                    onChange={(e) => setNewTp1(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Target TP2:</label>
                  <input
                    type="number"
                    value={newTp2}
                    onChange={(e) => setNewTp2(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Stop Loss:</label>
                  <input
                    type="number"
                    value={newSl}
                    onChange={(e) => setNewSl(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpenModalVisible(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs font-mono"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    const sym = newSymbol.includes(".JK") ? newSymbol : `${newSymbol}.JK`;
                    await api.openForwardPosition({
                      symbol: sym,
                      strategy: newStrategy,
                      entry_price: newEntryPrice,
                      shares_lot: newLots,
                      target_tp1: newTp1,
                      target_tp2: newTp2,
                      stop_loss: newSl,
                      notes: "Manual Entry Forward Test"
                    });
                    setOpenModalVisible(false);
                    await fetchStatus();
                  } catch (e: any) {
                    alert(e.message || "Gagal membuka posisi.");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20"
              >
                Buka Posisi Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {closeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 font-mono flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              <span>Tutup Posisi {closeTarget.symbol}?</span>
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Posisi {closeTarget.shares_lot} lot {closeTarget.symbol} akan dijual pada harga terkini <strong>{formatRupiah(closeTarget.current_price)}</strong> dan hasil penjualan akan dikembalikan ke saldo kas portofolio.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCloseTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs font-mono"
              >
                Batal
              </button>
              <button
                onClick={() => handleClosePosition(closeTarget)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs font-mono shadow-lg shadow-rose-500/20"
              >
                Ya, Jual Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
