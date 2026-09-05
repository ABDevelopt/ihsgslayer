"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Target,
  TrendingUp,
  Activity,
  Percent,
  Lock,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { PreARACandidate } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";
import PositionSizingCard from "@/components/PositionSizingCard";
import PortfolioCapitalToolbar from "@/components/PortfolioCapitalToolbar";

export default function PreARAPage() {
  const [candidates, setCandidates] = useState<PreARACandidate[]>([]);
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

  const fetchPreARA = async (score = minScore) => {
    setLoading(true);
    try {
      const data = await api.getPreARACandidates(Number(score));
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error("Failed to fetch Pre-ARA candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreARA();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-rose-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              PRE-ARA PREDICTOR
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Prediksi Target Harga &amp; Estimasi Waktu Jual (+20% s/d +35% ARA)
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Rocket className="w-6 h-6 text-rose-400" />
            <span>Pre-ARA Hunter — Target Harga &amp; Perkiraan Waktu Jual</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Formula kuantitatif momentum awal mendeteksi emiten di{" "}
            <strong className="text-slate-200">
              fase awal letupan (+0.5% s/d +8.5%)
            </strong>{" "}
            lengkap dengan target harga, estimasi persentase kenaikan, dan panduan jendela waktu jual (*Exit Timing Window*).
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              fetchPreARA(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="60.0">Skor Pre-ARA &ge; 60 (Semua Potensi)</option>
            <option value="70.0">Skor Pre-ARA &ge; 70 (Keyakinan Tinggi)</option>
            <option value="80.0">Skor Pre-ARA &ge; 80 (Sangat Kuat &gt;85%)</option>
          </select>

          <button
            onClick={() => fetchPreARA()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Scan Calon ARA</span>
          </button>
        </div>
      </div>

      {/* 4-Phase Pre-ARA Explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="font-bold text-indigo-400 flex items-center gap-1.5 font-mono">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px]">
              1
            </span>
            <span>Fase Squeeze (VCP)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Konsolidasi 3–10 hari dengan volatilitas mampat &amp; volume mengering tanda suplai habis terserap.
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px]">
              2
            </span>
            <span>Volume Velocity Spike</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Kecepatan volume pagi meledak &ge; 1.2x s/d 30x rata-rata 20 hari tanda Big Money mulai menyapu antrean.
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>Zona Manis (+1% s/d +7%)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Beli saat harga baru menembus level resisten, sisa ruang menuju target ARA masih tebal (+10% s/d +30%).
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="font-bold text-rose-400 flex items-center gap-1.5 font-mono">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[11px]">
              4
            </span>
            <span>Buyer Dominance (HAKA)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ekor bawah tipis (Open = Low), pembeli langsung hajar kanan tanpa memberi kesempatan harga turun.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-rose-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Memindai seluruh 350+ semesta emiten BEI untuk sinyal letupan Calon Top Gainer, Target Harga &amp; Timing Jual...</div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <Rocket className="w-12 h-12 text-rose-400/60 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Belum Ada Emiten yang Memenuhi Seluruh Kriteria Calon ARA pada Filter Ini
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Coba gunakan filter Skor 60 atau pantau kembali saat sesi pembukaan pagi (09:05 - 09:30 WIB).
          </p>
          <button
            onClick={() => {
              setMinScore("60.0");
              fetchPreARA("60.0");
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-lg shadow-rose-500/20"
          >
            <span>Scan dengan Skor 60.0</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {candidates.map((c) => {
            const isSuperHigh = c.pre_ara_score >= 85;
            const targetAraPrice = c.predicted_target_price || c.ara_ceiling_price;
            const targetGainPct = c.predicted_gain_pct || c.distance_to_ara_pct;
            const tp1Price = c.predicted_tp1_price || Math.round(c.current_price * 1.05);
            const tp1GainPct = c.predicted_tp1_gain_pct || 5.0;

            return (
              <div
                key={c.symbol}
                className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-rose-500/50 transition-all space-y-4 shadow-xl"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black font-mono text-white">
                        {c.symbol}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        PRE-ARA: {c.pre_ara_score}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          isSuperHigh
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {c.ara_probability}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.name} &bull; <span className="text-slate-500">{c.sector}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[11px] text-slate-400">Harga Terdeteksi</div>
                    <div className="text-base font-bold text-slate-100">
                      {formatRupiah(c.current_price)}{" "}
                      <span className="text-xs text-emerald-400 font-semibold">
                        (+{c.morning_gain_pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Price & Predicted Gain Showcase Panel */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-slate-900/80 to-cyan-950/30 border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <Target className="w-4 h-4" />
                      <span>PREDIKSI HARGA TARGET &amp; POTENSI CUAN</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Sisa Ruang ARA: +{targetGainPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                    {/* Target 1: Scalping TP1 */}
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Target 1 (Scalping)</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-300 mt-0.5">
                        {formatRupiah(tp1Price)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        +{tp1GainPct}%
                      </div>
                    </div>

                    {/* Target 2: Plafon ARA Maksimal */}
                    <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40">
                      <div className="text-[10px] text-rose-300 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-rose-400" />
                        <span>Target 2 (Kunci ARA)</span>
                      </div>
                      <div className="text-sm font-black text-rose-300 mt-0.5">
                        {formatRupiah(targetAraPrice)}
                      </div>
                      <div className="text-[10px] text-rose-400 font-bold">
                        +{targetGainPct}% Maks
                      </div>
                    </div>

                    {/* Batas Cut Loss */}
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-rose-400" />
                        <span>Batas Cut Loss</span>
                      </div>
                      <div className="text-xs font-bold text-rose-300 mt-0.5">
                        {c.stop_loss}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        R:R {c.risk_reward_ratio}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exit Timing Windows Panel */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span>PERKIRAAN JENDELA WAKTU JUAL (EXIT TIMING)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.holding_duration_guide || "30 Menit s/d 1 Hari"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-0.5">
                      <div className="text-[10px] text-emerald-400 font-sans font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Waktu Jual TP1</span>
                      </div>
                      <div className="font-bold text-emerald-300 text-xs">
                        {c.tp1_target_time || "09:30 - 10:15 WIB"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        Puncak gelombang 1 pagi
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-0.5">
                      <div className="text-[10px] text-rose-400 font-sans font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Waktu Kunci ARA</span>
                      </div>
                      <div className="font-bold text-rose-300 text-xs">
                        {c.ara_target_time || "11:00 - 11:30 / 15:45 WIB"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        Tahan jika antrean Bid tebal
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-0.5">
                      <div className="text-[10px] text-amber-400 font-sans font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Batas Waktu (Time-Stop)</span>
                      </div>
                      <div className="font-bold text-slate-300 text-xs">
                        {c.max_exit_time || "15:45 WIB (Hari H)"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        Zero overnight risk
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-300 font-sans bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0 font-bold font-mono text-[10px]">PANDUAN TAKTIS:</span>
                    <span>{c.exit_strategy_tip || "Kunci 50% profit di TP1 (09:30 - 10:15 WIB), lalu pasang Trailing Stop untuk sisa lot menuju Plafon ARA."}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-rose-400" />
                    <span>Vol. Velocity: {c.volume_velocity_multiplier}x</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Buyer Dominance: {c.buyer_dominance_pct}%</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" />
                    <span>Plafon ARA: {formatRupiah(targetAraPrice)}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{c.safety_status}</span>
                  </span>
                </div>

                {/* Rationale Box */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Analisis Prediksi Calon ARA (DNA Top Gainer Terdeteksi):</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {c.pre_ara_rationale}
                  </p>
                  <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                    {c.pre_ara_signals?.map((sig, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-400 font-sans flex items-start gap-1.5"
                      >
                        <span className="text-rose-400 shrink-0 mt-0.5">&bull;</span>
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pre-ARA Trading Matrix */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-400 font-sans font-medium">
                      Zona Entry Early
                    </div>
                    <div className="text-xs font-bold text-emerald-300 mt-1">
                      {c.entry_zone}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                    <div className="text-[10px] text-rose-400 font-sans font-medium">
                      Batas Cut Loss
                    </div>
                    <div className="text-xs font-bold text-rose-300 mt-1">
                      {c.stop_loss}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                    <div className="text-[10px] text-cyan-400 font-sans font-medium">
                      Target Plafon ARA
                    </div>
                    <div className="text-xs font-bold text-cyan-300 mt-1">
                      {c.target_ara_sell}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Eksekusi 09:05 - 09:30 WIB</span>
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
                          price: c.current_price,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-500/20"
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
