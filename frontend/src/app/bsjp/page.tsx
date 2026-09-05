"use client";


import {
  Activity,
  AlertTriangle,
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
import { BSJPCandidate } from "@/lib/types";
import { formatRupiah, formatPercent } from "@/lib/utils";

export default function BSJPPage() {
  const [candidates, setCandidates] = useState<BSJPCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fridayShield, setFridayShield] = useState<any>(null);

  const fetchBSJP = async () => {
    setLoading(true);
    try {
      const data = await api.getBSJPCandidates(50.0);
      setCandidates(data.candidates || []);
      if (data.friday_shield) {
        setFridayShield(data.friday_shield);
      }
    } catch (err) {
      console.error("Failed to fetch BSJP candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBSJP();
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
      <div className="p-6 rounded-2xl bg-cardBg border border-amber-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              OVERNIGHT SWING SCANNER
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Beli Sore: 15:45 - 15:55 WIB &rarr; Jual Pagi: 09:05 - 09:20 WIB Esok
            </span>
          </div>
          <h3 className="font-bold text-xl text-amber-300 flex items-center gap-2 mt-1">
            <Sunset className="w-6 h-6 text-amber-400" />
            <span>BSJP Scanner (Beli Sore Jual Pagi — Prediksi Gap-Up Pagi)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Formula kuantitatif pemburu momentum *pre-closing* (15:45 - 15:55 WIB).
            Mendeteksi akumulasi masif buyer institusi di pucuk sesi 2 untuk langsung dieksekusi take-profit pada lonjakan pembukaan pagi esoknya (+2.5% s/d +6.0%).
          </p>
        </div>

        <button
          onClick={fetchBSJP}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Scan Momentum BSJP</span>
        </button>
      </div>

      {/* Rules & Timing Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Kapan Beli BSJP (Sore 15:45 - 15:55 WIB):</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
            Masuk di sesi Pre-Closing saat akumulasi institusi mencapai &ge;75% candle range harian.
          </p>
        </div>
        <div className="space-y-1">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Kapan Waktu Jual BSJP (Pagi H+1: 09:05 - 09:20 WIB):</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
            Jual cepat pada lonjakan pembukaan esok hari (Morning Spike +2.5% s/d +6.0%). Hindari hold berlebihan!
          </p>
        </div>
      </div>

      {/* Friday Risk Shield Alert Banner */}
      {fridayShield?.is_friday && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-amber-950/40 border border-amber-500/50 shadow-lg space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-500/30 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-mono font-bold text-sm text-amber-300">
                [JUMAT SORE: WEEKEND DE-RISKING - RISIKO OVERNIGHT 65 JAM]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                POSITION SIZING: 50%
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                CASH RESERVE: &ge; 70%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Menahan posisi BSJP pada hari Jumat membawa eksposur risiko akhir pekan selama <span className="font-bold text-amber-300 font-mono">65 Jam</span> (vs 17 Jam pada hari bursa biasa). Rilis data makro AS (Non-Farm Payrolls, Core CPI) pada Jumat malam berpotensi memicu gap-down Senin pagi. Disiplin batasi hanya pada emiten dengan <span className="font-bold text-emerald-400 font-mono">Skor BSJP &ge; 70.0</span> dan pangkas alokasi modal menjadi 50%.
          </p>
        </div>
      )}

      {/* Strategy Feature Explanation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-amber-400 font-bold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">1</span>
            <span>Pre-Closing Accumulation</span>
          </div>
          <p className="text-slate-400 font-sans text-[11px]">
            Volume di atas 1.4x - 4.0x rata-rata 20 hari terpusat di sesi 2.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-amber-400 font-bold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
            <span>Close at High (&ge; 75%)</span>
          </div>
          <p className="text-slate-400 font-sans text-[11px]">
            Penutupan di pucuk rentang harian tanpa tekanan guyuran (Upper shadow &le; 25%).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
            <span>Target Pagi (+2.5% ~ +6%)</span>
          </div>
          <p className="text-slate-400 font-sans text-[11px]">
            Eksekusi jual saat lonjakan pembukaan esok (09:05 - 09:20 WIB).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-rose-400 font-bold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[11px]">4</span>
            <span>Proteksi Stop Loss (-2%)</span>
          </div>
          <p className="text-slate-400 font-sans text-[11px]">
            Batasi risiko ketat jika terjadi anomali gap down di pagi hari.
          </p>
        </div>
      </div>

      {/* Grid of BSJP Cards */}
      {loading ? (
        <div className="py-16 text-center text-amber-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Memindai akumulasi sore seluruh 350+ emiten aktif BEI...</div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <Sunset className="w-12 h-12 text-amber-400/60 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Tidak Ada Emiten yang Memenuhi Kriteria Momentum BSJP Saat Ini
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gunakan BSJP menjelang sesi penutupan bursa pukul 15:30 - 15:50 WIB.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {candidates.map((c) => {
            const entryPrice = c.entry_price || c.close_price || c.current_price || 0;
            const targetMin = c.target_sell_morning_min || c.target_price || Math.round(entryPrice * 1.025);
            const targetMax = c.target_sell_morning_max || Math.round(entryPrice * 1.060);
            const stopLoss = c.stop_loss_morning || Math.round(entryPrice * 0.980);
            const isHighProb = c.gap_up_probability === "HIGH" || c.bsjp_score >= 75.0;
            const tp1Gain = c.predicted_gain_tp1_pct || 2.5;
            const tp2Gain = c.predicted_gain_tp2_pct || 6.0;

            return (
              <div
                key={c.symbol}
                className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-amber-500/50 transition-all space-y-4 shadow-xl"
              >
                {/* Symbol & Score Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-2xl text-amber-300">
                        {c.symbol}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {c.name || c.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-sans mt-0.5">{c.sector}</div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      BSJP: {c.bsjp_score}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                      isHighProb ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                    }`}>
                      GAP-UP: {c.gap_up_probability || "HIGH"}
                    </span>
                    {c.weekend_risk_badge && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        c.is_weekend_qualified
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}>
                        {c.weekend_risk_badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Price & Predicted Gain Showcase Panel */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-cyan-950/30 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Target className="w-4 h-4" />
                      <span>PREDIKSI TARGET HARGA &amp; POTENSI GAP-UP PAGI</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Target 1: +{tp1Gain}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                    {/* Target 1: Quick Morning Scalp */}
                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40">
                      <div className="text-[10px] text-amber-300 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3 text-amber-400" />
                        <span>Target 1 (Spike Pagi)</span>
                      </div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">
                        {formatRupiah(targetMin)}
                      </div>
                      <div className="text-[10px] text-amber-400 font-bold">
                        +{tp1Gain}% Opening
                      </div>
                    </div>

                    {/* Target 2: Extended Morning */}
                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                      <div className="text-[10px] text-cyan-300 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>Target 2 (Lanjut)</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {formatRupiah(targetMax)}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-bold">
                        +{tp2Gain}% Sesi 1
                      </div>
                    </div>

                    {/* Batas Cut Loss */}
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-rose-400" />
                        <span>Batas Cut Loss</span>
                      </div>
                      <div className="text-xs font-bold text-rose-300 mt-0.5">
                        {formatRupiah(stopLoss)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Disiplin -2.0%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selling Time Window & Execution Rule Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="font-bold text-cyan-300">
                      KAPAN WAKTU JUAL: {c.selling_time_window || "Pagi H+1: 09:05 - 09:20 WIB (Morning Opening Spike)"}
                    </div>
                    <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                      {c.selling_trigger_rule || "Jual cepat pada lonjakan pembukaan pagi H+1 (+2.5% s/d +6.0%). Wajib pasang Stop Loss ketat di level SL."}
                    </div>
                  </div>
                </div>

                {/* Technical Highlights / Reasons */}
                {c.reasons && c.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.reasons.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                        &bull; {r}
                      </span>
                    ))}
                    {c.volume_multiplier && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold flex items-center gap-1">
                        <Activity className="w-3 h-3 text-amber-400" />
                        <span>Vol {c.volume_multiplier}x SMA20</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Rationale Text */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  {c.rationale || "Terdeteksi akumulasi masif di akhir sesi perdagangan dengan dominasi pembeli agresif."}
                </p>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Eksekusi Beli: 15:45 - 15:55 WIB</span>
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
