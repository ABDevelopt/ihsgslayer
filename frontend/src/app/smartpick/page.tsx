"use client";


import {
  Activity,
  ArrowRight,
  Clock,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sunset,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import StrategyHubNav from "@/components/StrategyHubNav";
import { ShariaBadge } from "@/components/ShariaBadge";
import { formatRupiah } from "@/lib/utils";

export default function SmartPickPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSmartPick = async () => {
    setLoading(true);
    try {
      const data = await api.getSmartPickStocks();
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error("Failed to load Smart Pick:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartPick();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Swing Hub Navigation */}
      <StrategyHubNav
        hubTitle="Pusat Strategi Swing & Pola Chart Multihari"
        hubBadge="SWING & PATTERNS"
        badgeVariant="amber"
        description="Pusat strategi swing multihari BEI: Konfluensi multi-indikator kuantitatif, BSJP (Beli Sore Jual Pagi), dan deteksi pola chart otomatis."
        tabs={[
          { href: "/confluence", label: "Konfluensi Multi-Strategi", icon: Layers, badge: "Multi-Pilar" },
          { href: "/bsjp", label: "BSJP (Beli Sore Jual Pagi)", icon: Sunset, badge: "H+1 Swing" },
          { href: "/smartpick", label: "Pola Chart Smart Pick", icon: Zap, badge: "VCP & Breakout" },
        ]}
      />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-indigo-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              GEOMETRIC TECHNICAL REBOUND
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Smart Pick 5 Pola Kuantitatif &bull; Prediksi Target Swing &amp; Waktu Jual
            </span>
          </div>
          <h3 className="font-bold text-xl text-indigo-300 flex items-center gap-2 mt-1">
            <Zap className="w-6 h-6 text-indigo-400" />
            <span>Pola Pantulan Teknikal (Smart Pick — Swing Rebound)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Deteksi otomatis 5 pola teknikal probabilitas tinggi:{" "}
            <strong>MA Rebound</strong>, <strong>Breakout Volume</strong>,{" "}
            <strong>Double Bottom</strong>, <strong>Golden Cross</strong>, dan{" "}
            <strong>RSI Oversold Reversal</strong> dengan target harga dan rencana jual swing 3 - 10 hari bursa.
          </p>
        </div>

        <button
          onClick={fetchSmartPick}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Scan Pola Teknikal</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-indigo-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Memindai geometri pola 350+ saham BEI...</div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <Layers className="w-12 h-12 text-indigo-400/60 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Tidak ada pola pantulan teknikal signifikan terdeteksi saat ini.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {candidates.map((c) => {
            const price = c.price || c.current_price || 0;
            const tp1 = c.target_tp1 || Math.round(price * 1.05);
            const tp2 = c.target_tp2 || Math.round(price * 1.10);
            const sl = c.stop_loss || Math.round(price * 0.96);
            const tp1Gain = c.predicted_gain_tp1_pct || 5.0;
            const tp2Gain = c.predicted_gain_tp2_pct || 10.0;

            return (
              <div
                key={c.symbol}
                className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-indigo-500/50 transition-all space-y-4 shadow-xl"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-2xl text-white">
                        {c.symbol}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        AI SCORE: {c.ai_score}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.name} &bull; <span className="text-slate-500">{c.sector}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[11px] text-slate-400">Harga Terdeteksi</div>
                    <div className="text-base font-bold text-slate-100">
                      {formatRupiah(price)}{" "}
                      <span className="text-xs text-emerald-400 font-semibold">
                        (+{c.change_pct || 0}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Price & Predicted Gain Showcase Panel */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/30 via-slate-900/80 to-cyan-950/30 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Target className="w-4 h-4" />
                      <span>PREDIKSI TARGET HARGA &amp; POTENSI SWING</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      TP1: +{tp1Gain}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                    {/* Target 1: TP1 */}
                    <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/40">
                      <div className="text-[10px] text-indigo-300 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3 text-indigo-400" />
                        <span>Target 1 (Resisten)</span>
                      </div>
                      <div className="text-sm font-bold text-indigo-300 mt-0.5">
                        {formatRupiah(tp1)}
                      </div>
                      <div className="text-[10px] text-indigo-400 font-bold">
                        +{tp1Gain}% Swing
                      </div>
                    </div>

                    {/* Target 2: TP2 */}
                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                      <div className="text-[10px] text-cyan-300 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>Target 2 (Extended)</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {formatRupiah(tp2)}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-bold">
                        +{tp2Gain}% Swing
                      </div>
                    </div>

                    {/* Batas Cut Loss */}
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-rose-400" />
                        <span>Batas Cut Loss</span>
                      </div>
                      <div className="text-xs font-bold text-rose-300 mt-0.5">
                        {formatRupiah(sl)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Disiplin -4.0%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selling Time Window & Execution Rule Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="font-bold text-indigo-300">
                      KAPAN WAKTU JUAL: {c.selling_time_window || "Swing 3 - 10 Hari Bursa (Rebound Geometri)"}
                    </div>
                    <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                      {c.selling_trigger_rule || "Jual bertahap saat menyentuh resisten kunci / TP1 (+5.0%), trailing stop sisa 50% ke TP2 (+10.0%)."}
                    </div>
                  </div>
                </div>

                {/* Pattern Badges */}
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {c.active_patterns?.map((p: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3 text-indigo-400" />
                      <span>{p}</span>
                    </span>
                  ))}
                  {c.volume_multiplier && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                      Vol {c.volume_multiplier}x
                    </span>
                  )}
                </div>

                {/* Rationale */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  {c.rationale || "Pola geometri teknikal menunjukkan pantulan kuat dari area support permintaan."}
                </p>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] font-mono text-slate-400">
                    R:R: <span className="text-slate-200 font-bold">{c.risk_reward_ratio || "1 : 2.5"}</span>
                  </span>
                  <Link
                    href={`/analysis/${c.symbol}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
                  >
                    <span>Bedah 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
