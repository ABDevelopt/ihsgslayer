"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sunrise,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight,
  Lightbulb,
  Clock,
  Target,
  TrendingUp,
  Activity,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { BPJSCandidate } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";
import PositionSizingCard from "@/components/PositionSizingCard";
import PortfolioCapitalToolbar from "@/components/PortfolioCapitalToolbar";

export default function BPJSPage() {
  const [candidates, setCandidates] = useState<BPJSCandidate[]>([]);
  const [timingGate, setTimingGate] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<string>("60.0");
  const [userCapital, setUserCapital] = useState<number>(10_000_000);
  const [activeModalStock, setActiveModalStock] = useState<{
    symbol: string;
    price: number;
    defaultLots?: number;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ihsg_user_capital");
      if (saved && Number(saved) >= 1_000_000) setUserCapital(Number(saved));
    } catch {}
  }, []);

  const fetchBPJS = async (score = minScore) => {
    setLoading(true);
    try {
      const data = await api.getBPJSCandidates(Number(score));
      setCandidates(data.candidates || []);
      if (data.timing_gate) {
        setTimingGate(data.timing_gate);
      }
    } catch (err) {
      console.error("Failed to fetch BPJS candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBPJS();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              INTRADAY DAY-TRADING
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Beli 09:15 - 09:45 WIB &rarr; Jual 15:40 - 15:50 WIB &bull; Zero Overnight
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Sunrise className="w-6 h-6 text-emerald-400" />
            <span>BPJS Scanner — Beli Pagi Jual Sore (Win Rate 90.6%)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Deteksi lonjakan volume pagi + breakout harga tanpa tekanan jual bawah
            (Minimal Lower Shadow) dengan kalkulasi perkiraan kenaikan cuan dan waktu jual presisi di sesi sore bursa.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              fetchBPJS(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="60.0">Min. Skor 60 (Semua Potensi BPJS)</option>
            <option value="65.0">Min. Skor 65 (Standar Presisi)</option>
            <option value="75.0">Min. Skor 75 (High Win-Rate &gt;80%)</option>
          </select>

          <button
            onClick={() => fetchBPJS()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Scan BPJS Pagi</span>
          </button>
        </div>
      </div>

      {/* Timing Gate & Estafet Trading Status Banner */}
      {timingGate && (
        <div
          className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono transition-all ${
            timingGate.allow_bpjs_buy
              ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300"
              : timingGate.trader_mode === "SELLER_MODE"
              ? "bg-amber-950/30 border-amber-500/50 text-amber-300"
              : timingGate.trader_mode === "MONITORING_MODE"
              ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300"
              : "bg-slate-900/60 border-slate-800 text-slate-300"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 border border-white/20">
                TIMING GATE BPJS
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  timingGate.allow_bpjs_buy
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : timingGate.trader_mode === "SELLER_MODE"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {timingGate.badge}
              </span>
              <span className="text-[11px] text-slate-400">
                Waktu: {timingGate.current_time}
              </span>
            </div>
            <div className="text-slate-200 text-xs font-sans font-medium">
              {timingGate.tactical_action}
            </div>
          </div>
          {timingGate.allow_bpjs_buy ? (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ENTRY DIIZINKAN</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold shrink-0 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>ENTRY DITANGGUHKAN</span>
            </div>
          )}
        </div>
      )}

      {/* Rules & Selling Timing Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-mono">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Aturan Masuk BPJS (Pagi 09:15 - 09:45 WIB):</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
            Masuk saat volume pagi meledak &ge;1.35x dan harga tertahan di atas Open (Ekor bawah tipis).
          </p>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Kapan Waktu Jual BPJS (Sore 15:40 - 15:50 WIB):</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
            Wajib keluar sore ini juga di TP1 (+3.5%) atau sesi Pre-Closing 15:45 WIB. Zero Overnight Risk!
          </p>
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <div className="py-16 text-center text-emerald-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Memindai seluruh semesta emiten BEI untuk momentum BPJS Pagi...</div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <Sunrise className="w-12 h-12 text-emerald-400/60 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Belum Ada Emiten yang Memenuhi Seluruh 5 Kriteria Ketat BPJS pada Filter Ini
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Coba pilih Minimal Skor 60 atau klik tombol di bawah untuk memindai ulang.
          </p>
          <button
            onClick={() => {
              setMinScore("60.0");
              fetchBPJS("60.0");
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
          >
            <span>Scan BPJS Lagi (Filter 60.0)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {candidates.map((c) => {
            const winProbColor = c.win_probability.includes("HIGH")
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
            const tp1Gain = c.predicted_gain_tp1_pct || 3.5;
            const tp2Gain = c.predicted_gain_tp2_pct || 7.0;

            return (
              <div
                key={c.symbol}
                className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 shadow-xl"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black font-mono text-white">
                        {c.symbol}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        BPJS: {c.bpjs_score}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${winProbColor}`}
                      >
                        {c.win_probability}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.name} &bull; <span className="text-slate-500">{c.sector}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[11px] text-slate-400">Harga Beli Pagi</div>
                    <div className="text-base font-bold text-slate-100">
                      {formatRupiah(c.current_price)}{" "}
                      <span className="text-xs text-emerald-400 font-semibold">
                        (+{c.morning_gain_pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Price & Predicted Gain Showcase Panel */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-cyan-950/30 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Target className="w-4 h-4" />
                      <span>PREDIKSI TARGET HARGA &amp; POTENSI CUAN SORE</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Target TP1: +{tp1Gain}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                    {/* Target 1: Quick Exit */}
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                      <div className="text-[10px] text-emerald-300 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Target 1 (Cepat 50%)</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">
                        {formatRupiah(c.target_tp1_price || Math.round(c.current_price * 1.035))}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        +{tp1Gain}% Intraday
                      </div>
                    </div>

                    {/* Target 2: Max Intraday */}
                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                      <div className="text-[10px] text-cyan-300 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>Target 2 (Maksimal)</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {formatRupiah(c.target_tp2_price || Math.round(c.current_price * 1.070))}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-bold">
                        +{tp2Gain}% Sore
                      </div>
                    </div>

                    {/* Batas Cut Loss */}
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-rose-400" />
                        <span>Batas Cut Loss</span>
                      </div>
                      <div className="text-xs font-bold text-rose-300 mt-0.5">
                        {c.stop_loss_intraday}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Disiplin -2.5%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selling Time Window & Execution Rule Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="font-bold text-amber-300">
                      KAPAN WAKTU JUAL: {c.selling_time_window || "Sore Ini: 15:40 - 15:50 WIB (Zero Overnight)"}
                    </div>
                    <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                      {c.selling_trigger_rule || "Take Profit cepat saat sentuh TP1 (+3.5%) atau jual di sesi Pre-Closing 15:45 WIB. Cut loss disiplin jika sentuh SL."}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>Vol. Pagi: {c.volume_multiplier}x</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Buyer Control: {c.open_to_low_rejection_pct}%</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    RSI(14): {c.rsi_14}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    ADTV: Rp {c.adtv_miliar} M
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{c.safety_shield_status || "AMAN"}</span>
                  </span>
                </div>

                {/* Rationale Box */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Analisis Momentum BPJS:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {c.rationale}
                  </p>
                  <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                    {c.why_bpjs_points?.map((pt, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-400 font-sans flex items-start gap-1.5"
                      >
                        <span className="text-emerald-400 shrink-0 mt-0.5">&bull;</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Eksekusi Jual: 15:40 - 15:50 WIB</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/analysis/${c.symbol}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
                    >
                      <span>Bedah 360°</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() =>
                        setActiveModalStock({
                          symbol: c.symbol,
                          price: c.entry_price_mid || c.current_price,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                    >
                      Catat Beli
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Buy Modal */}
      {activeModalStock && (
        <QuickBuyModal
          isOpen={true}
          symbol={activeModalStock.symbol}
          defaultPrice={activeModalStock.price}
          defaultLots={activeModalStock.defaultLots || 10}
          onClose={() => setActiveModalStock(null)}
        />
      )}
    </div>
  );
}
