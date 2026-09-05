"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Lock,
  RefreshCw,
  Info,
  ChevronRight,
  Flame,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/components/Toast";

const API_BASE = "http://127.0.0.1:8000/api/v1";

interface IntradayPhase {
  phase_key: string;
  phase_name: string;
  badge: string;
  badge_color: string;
  status: string;
  trader_mode?: "SELLER_MODE" | "BUYER_MODE_BPJS" | "MONITORING_MODE";
  allow_bpjs_buy?: boolean;
  bpjs_gate_status?: string;
  current_time: string;
  tactical_action: string;
  prohibited_action: string;
  recommended_focus: string;
  is_exit_window: boolean;
  is_fomo_danger: boolean;
  is_friday?: boolean;
  friday_shield?: any;
}

interface StockFadeItem {
  symbol: string;
  open_price: number;
  high_price: number;
  low_price: number;
  current_price: number;
  morning_gap_pct: number;
  peak_gain_pct: number;
  current_gain_pct: number;
  pullback_from_high_pct: number;
  upper_shadow_ratio: number;
  fade_risk: string;
  verdict: string;
  badge: string;
  badge_color: string;
}

export default function IntradayRadarWidget() {
  const [radar, setRadar] = useState<{ current_phase?: IntradayPhase } | null>(null);
  const [screener, setScreener] = useState<{ fading_stocks?: StockFadeItem[]; healthy_retests?: StockFadeItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [activeTab, setActiveTab] = useState<"fading" | "retest">("fading");
  const { showToast } = useToast();

  const fetchRadarData = useCallback(async () => {
    try {
      const [resRadar, resScreener] = await Promise.all([
        fetch(`${API_BASE}/intraday/radar`),
        fetch(`${API_BASE}/intraday/fade-screener`),
      ]);
      if (resRadar.ok) setRadar(await resRadar.json());
      if (resScreener.ok) setScreener(await resScreener.json());
    } catch (e) {
      console.error("Error fetching intraday radar:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRadarData();
    const interval = setInterval(fetchRadarData, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [fetchRadarData]);

  const handleLockBreakeven = async () => {
    setLocking(true);
    try {
      const res = await fetch(`${API_BASE}/intraday/lock-breakeven?min_gain_pct=2.0`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Berhasil mengunci breakeven!", "success");
      } else {
        showToast("Gagal mengunci breakeven", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Koneksi gagal", "error");
    } finally {
      setLocking(false);
    }
  };

  const phase = radar?.current_phase;
  const isEuphoria = phase?.phase_key === "MORNING_EUPHORIA";
  const isRetest = phase?.phase_key === "MORNING_PULLBACK_RETEST";
  const isClosing = phase?.phase_key === "CLOSING_ACCUMULATION";

  const badgeColorClass =
    phase?.badge_color === "rose"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
      : phase?.badge_color === "emerald"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : phase?.badge_color === "cyan"
      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
      : phase?.badge_color === "amber"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
      : "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <div className="p-5 rounded-2xl bg-cardBg border border-indigo-500/30 shadow-xl space-y-4">
      {/* Top Banner & Active Phase */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-indigo-400" />
              RADAR SIKLUS INTRADAY
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${badgeColorClass}`}>
              {phase?.badge || "[MEMUAT FASE...]"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Waktu: {phase?.current_time || "--:--:-- WIB"}
            </span>
          </div>
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <span>{phase?.phase_name || "Siklus Waktu & Proteksi Puncak Pagi"}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            {phase?.tactical_action}
          </p>
        </div>

        {/* Action Button: Breakeven Lock */}
        <button
          onClick={handleLockBreakeven}
          disabled={locking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          {locking ? "Mengunci..." : "Kunci Laba Breakeven (+0.4% Fee)"}
        </button>
      </div>

      {/* Estafet Mode Trading Relay Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
        {[
          {
            time: "09:00 - 09:15 WIB",
            mode: "SELLER MODE (JUAL BSJP)",
            desc: "TP saham kemarin, dilarang beli BPJS",
            active: phase?.trader_mode === "SELLER_MODE",
            color: "amber",
          },
          {
            time: "09:15 - 09:45 WIB",
            mode: "BUYER MODE (ENTRY BPJS)",
            desc: "Beli saham Open=Low & VWAP confirmed",
            active: phase?.trader_mode === "BUYER_MODE_BPJS",
            color: "cyan",
          },
          {
            time: "09:45 - 10:30 WIB",
            mode: "MONITORING MODE (BREAKEVEN)",
            desc: "Kunci SL ke modal + 0.4% fee",
            active: phase?.trader_mode === "MONITORING_MODE",
            color: "indigo",
          },
          {
            time: "15:40 - 15:50 WIB",
            mode: "CLOSING RELAY (ZERO OVERNIGHT)",
            desc: "Tutup scalping 100% Cash & akumulasi BSJP",
            active: phase?.phase_key === "PRE_CLOSING_EXIT" || phase?.phase_key === "CLOSING_ACCUMULATION",
            color: "emerald",
          },
        ].map((step, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
              step.active
                ? step.color === "amber"
                  ? "bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10"
                  : step.color === "cyan"
                  ? "bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10"
                  : step.color === "indigo"
                  ? "bg-indigo-950/40 border-indigo-400 ring-1 ring-indigo-400/50 shadow-lg shadow-indigo-500/10"
                  : "bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900/40 border-slate-800/80 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>{step.time}</span>
              {step.active && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-white animate-pulse">
                  AKTIF SEKARANG
                </span>
              )}
            </div>
            <div className={`font-bold text-[11px] ${step.active ? "text-slate-100" : "text-slate-400"}`}>
              {step.mode}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{step.desc}</div>
          </div>
        ))}
      </div>

      {/* Friday Risk Shield Protocol Banner */}
      {(phase?.is_friday || (typeof window !== "undefined" && new Date().getDay() === 5)) && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-rose-950/40 border border-amber-500/40 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                FRIDAY RISK SHIELD
              </span>
              <span className="font-bold text-slate-100">
                Protokol Perlindungan Hari Jumat: Weekend De-Risking
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Sizing Cap: Max 50%
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Min. Kas: &gt;= 70%
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
            IHSG dan saham cenderung tertekan di hari Jumat karena aksi ambil untung jelang akhir pekan dan rilis data makro AS malam ini. Batasi pembelian baru ke 50% ukuran normal dan likuidasi posisi scalping di sesi sore (Zero Overnight Weekend).
          </div>
        </div>
      )}

      {/* Warning Box: Prohibited Action */}
      {phase?.prohibited_action && (
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase text-rose-400">Peringatan Disiplin: </span>
            {phase.prohibited_action}
          </div>
        </div>
      )}

      {/* Intraday Screener Radar: Fading vs Healthy Retest */}
      <div className="pt-2 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("fading")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "fading"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Waspada Kempis Pagi (Fade Risk)
              {screener?.fading_stocks && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400">
                  {screener.fading_stocks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("retest")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "retest"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Retest Pagi Sehat (Open=Low)
              {screener?.healthy_retests && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
                  {screener.healthy_retests.length}
                </span>
              )}
            </button>
          </div>

          <span className="text-[10px] font-mono text-slate-500">
            Auto-Scan 8 Emiten Teraktif Hari Ini
          </span>
        </div>

        {/* Tab 1: Fading Stocks */}
        {activeTab === "fading" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {screener?.fading_stocks?.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/30 space-y-1.5 hover:border-rose-500/50 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-100">{item.symbol.replace(".JK", "")}</span>
                  <span className="text-[10px] font-mono font-bold text-rose-400 px-1.5 py-0.2 rounded bg-rose-500/10">
                    -{item.pullback_from_high_pct}% dari HOD
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Puncak: Rp {item.high_price.toLocaleString()} (+{item.peak_gain_pct}%)</span>
                  <span>Kini: Rp {item.current_price.toLocaleString()}</span>
                </div>
                <div className="text-[10px] font-mono text-rose-300/80">
                  Ekor Atas: {(item.upper_shadow_ratio * 100).toFixed(0)}% candle · {item.verdict}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Healthy Retests */}
        {activeTab === "retest" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {screener?.healthy_retests?.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-1.5 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-100">{item.symbol.replace(".JK", "")}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10">
                    +{item.current_gain_pct}%
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Open=Low: Rp {item.open_price.toLocaleString()}</span>
                  <span>Kini: Rp {item.current_price.toLocaleString()}</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-300/80">
                  {item.verdict} · Support VWAP Terjaga
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}