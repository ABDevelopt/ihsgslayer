"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Search,
  ArrowRight,
  ArrowLeft,
  Zap,
  FlaskConical,
  Flame,
  Rocket,
  ShieldCheck,
  Sunrise,
  Layers,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { StockRankingItem } from "@/lib/types";
import { useToast } from "@/components/Toast";

export default function LeaderboardPage() {
  const [stockRankings, setStockRankings] = useState<StockRankingItem[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState<boolean>(true);
  const [rankingMinSignals, setRankingMinSignals] = useState<number>(1);
  const [rankingSortBy, setRankingSortBy] = useState<string>("win_rate");
  const [rankingSearch, setRankingSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "SCALPING" | "SWING" | "INVEST">("ALL");
  const [strategyFilter, setStrategyFilter] = useState<string>("");
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const { showToast } = useToast();

  const loadStockRankings = async () => {
    setRankingsLoading(true);
    try {
      const res = await api.getStockRankings(
        rankingMinSignals,
        strategyFilter || undefined,
        categoryFilter !== "ALL" ? categoryFilter : undefined,
        rankingSortBy,
        100
      );
      setStockRankings(res.rankings || []);
    } catch (e) {
      console.error("Failed to load stock rankings:", e);
      showToast("Gagal memuat peringkat saham", "error");
    } finally {
      setRankingsLoading(false);
    }
  };

  const runEvaluateNow = async () => {
    setEvaluating(true);
    try {
      const res = await api.evaluateNow();
      await loadStockRankings();
      showToast(
        res.message || "Audit berhasil: Data audit & peringkat saham diperbarui!",
        "success"
      );
    } catch (err: any) {
      console.error("Failed to run evaluation:", err);
      showToast(err.message || "Gagal sinkronisasi data audit", "error");
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    loadStockRankings();
  }, [categoryFilter, strategyFilter, rankingMinSignals, rankingSortBy]);

  // Client-side search filtering
  const filteredRankings = useMemo(() => {
    if (!rankingSearch.trim()) return stockRankings;
    const q = rankingSearch.trim().toLowerCase();
    return stockRankings.filter(
      (r) =>
        r.symbol?.toLowerCase().includes(q) ||
        r.clean_symbol?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.sector?.toLowerCase().includes(q)
    );
  }, [stockRankings, rankingSearch]);

  // Top highlight stats across current dataset
  const topStats = useMemo(() => {
    if (!stockRankings.length) return null;
    const sortedByWR = [...stockRankings].sort((a, b) => b.win_rate_pct - a.win_rate_pct || b.evaluated_count - a.evaluated_count);
    const sortedByPnL = [...stockRankings].sort((a, b) => b.total_pnl_pct - a.total_pnl_pct);
    const sortedBySignals = [...stockRankings].sort((a, b) => b.total_signals - a.total_signals);
    const sortedByBest = [...stockRankings].sort((a, b) => b.best_trade_pct - a.best_trade_pct);

    return {
      topWR: sortedByWR[0],
      topPnL: sortedByPnL[0],
      topSignals: sortedBySignals[0],
      topBestTrade: sortedByBest[0],
      totalEmitensScanned: stockRankings.length,
    };
  }, [stockRankings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>LEADERBOARD SAHAM &amp; AKURASI AUDIT</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Terpisah Khusus dari Log Audit Transaksi
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
              <Award className="w-7 h-7 text-amber-400" />
              <span>Peringkat Saham dengan Win Rate &amp; Akumulasi Gain Terbesar</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed">
              Halaman ini didedikasikan untuk memeringkat saham-saham di Bursa Efek Indonesia (BEI) yang terbukti menghasilkan akurasi (*win rate*) tertinggi serta akumulasi keuntungan riil terbesar dari evaluasi sinyal kuantitatif sistem (BPJS, Pre-ARA, BSJP, dan Sinyal Buy Layak).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/evaluation"
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-mono font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ke Log Audit Riil</span>
            </Link>
            <button
              onClick={runEvaluateNow}
              disabled={evaluating}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
              <span>{evaluating ? "Sinkronisasi..." : "Sinkronkan Pasar"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Highlight Metric Cards */}
      {topStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Highest Win Rate */}
          <div className="p-4 rounded-2xl bg-cardBg border border-emerald-500/30 space-y-1.5 shadow-lg">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Akurasi Tertinggi</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {topStats.topWR?.win_rate_pct}%
              </span>
              <span className="text-sm font-mono font-bold text-slate-200">
                {topStats.topWR?.clean_symbol}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {topStats.topWR?.win_count} Menang dari {topStats.topWR?.evaluated_count} Trade ({topStats.topWR?.total_pnl_pct > 0 ? "+" : ""}{topStats.topWR?.total_pnl_pct}%)
            </div>
          </div>

          {/* Highest Cumulative PnL */}
          <div className="p-4 rounded-2xl bg-cardBg border border-cyan-500/30 space-y-1.5 shadow-lg">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Akumulasi Gain Terbesar</span>
              <Flame className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-cyan-300">
                +{topStats.topPnL?.total_pnl_pct}%
              </span>
              <span className="text-sm font-mono font-bold text-slate-200">
                {topStats.topPnL?.clean_symbol}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              WR {topStats.topPnL?.win_rate_pct}% &bull; {topStats.topPnL?.evaluated_count} Trade &bull; Rata-rata +{topStats.topPnL?.avg_pnl_pct}%
            </div>
          </div>

          {/* Best Single Trade */}
          <div className="p-4 rounded-2xl bg-cardBg border border-violet-500/30 space-y-1.5 shadow-lg">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Rekor Single Trade Gain</span>
              <Rocket className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-violet-300">
                +{topStats.topBestTrade?.best_trade_pct}%
              </span>
              <span className="text-sm font-mono font-bold text-slate-200">
                {topStats.topBestTrade?.clean_symbol}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Pre-ARA Letupan Plafon &bull; {topStats.topBestTrade?.name}
            </div>
          </div>

          {/* Most Frequent Stock */}
          <div className="p-4 rounded-2xl bg-cardBg border border-amber-500/30 space-y-1.5 shadow-lg">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Frekuensi Sinyal Terbanyak</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-400">
                {topStats.topSignals?.total_signals}
              </span>
              <span className="text-xs text-slate-400 font-mono">Sinyal</span>
              <span className="text-sm font-mono font-bold text-slate-200 ml-auto">
                {topStats.topSignals?.clean_symbol}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {topStats.topSignals?.win_count}W / {topStats.topSignals?.loss_count}L &bull; WR {topStats.topSignals?.win_rate_pct}%
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard Content Panel */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-5 shadow-xl">
        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-slate-800/80 pb-4">
          {/* 3 Pillars Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 w-fit">
            {[
              { id: "ALL", label: "[SEMUA PILAR]" },
              { id: "SCALPING", label: "[SCALPING (INTRADAY)]" },
              { id: "SWING", label: "[SWING TRADING]" },
              { id: "INVEST", label: "[INVESTASI]" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setCategoryFilter(tab.id as any);
                  setStrategyFilter("");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  categoryFilter === tab.id
                    ? tab.id === "SCALPING"
                      ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                      : tab.id === "SWING"
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                      : tab.id === "INVEST"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Strategy Filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500 text-[10px]">Strategi:</span>
              <select
                value={strategyFilter}
                onChange={(e) => setStrategyFilter(e.target.value)}
                aria-label="Filter Strategi"
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-200">Semua Strategi</option>
                <option value="BPJS" className="bg-slate-900 text-slate-200">BPJS (Pagi-Sore)</option>
                <option value="PRE_ARA" className="bg-slate-900 text-slate-200">Pre-ARA Hunter</option>
                <option value="BSJP" className="bg-slate-900 text-slate-200">BSJP (Sore-Pagi)</option>
                <option value="BUY_LAYAK" className="bg-slate-900 text-slate-200">Sinyal BUY / Confluence</option>
              </select>
            </div>

            {/* Min Signals Filter */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500 px-2 text-[10px]">Min Sinyal:</span>
              {[
                { val: 1, label: "Semua (≥1)" },
                { val: 2, label: "≥2" },
                { val: 3, label: "≥3 Konsisten" },
                { val: 5, label: "≥5 Tinggi" },
              ].map((pill) => (
                <button
                  key={pill.val}
                  onClick={() => setRankingMinSignals(pill.val)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    rankingMinSignals === pill.val
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-500 text-[10px]">Urutkan:</span>
              <select
                value={rankingSortBy}
                onChange={(e) => setRankingSortBy(e.target.value)}
                aria-label="Urutkan Peringkat Saham"
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="win_rate" className="bg-slate-900 text-slate-200">Win Rate Tertinggi (%)</option>
                <option value="total_pnl" className="bg-slate-900 text-slate-200">Total Gain Terbesar (%)</option>
                <option value="total_signals" className="bg-slate-900 text-slate-200">Frekuensi Terbanyak</option>
                <option value="avg_pnl" className="bg-slate-900 text-slate-200">Rata-rata PnL (%)</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                placeholder="Cari emiten/sektor..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        {filteredRankings.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Rank 1: Gold / Juara 1 */}
            {filteredRankings[0] && (
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-900/90 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 font-black text-base font-mono shadow-inner">
                      👑 1
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-lg text-amber-300">
                          {filteredRankings[0].clean_symbol}
                        </span>
                        {filteredRankings[0].is_sharia && <ShariaBadge isSharia={true} />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {filteredRankings[0].name}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                    JUARA 1
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-amber-500/20 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
                    <div className="text-xl font-black text-emerald-400">
                      {filteredRankings[0].win_rate_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {filteredRankings[0].win_count}W / {filteredRankings[0].loss_count}L ({filteredRankings[0].total_signals} sinyal)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Total PnL</div>
                    <div className={`text-xl font-black ${filteredRankings[0].total_pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {filteredRankings[0].total_pnl_pct > 0 ? "+" : ""}{filteredRankings[0].total_pnl_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Best: +{filteredRankings[0].best_trade_pct}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {filteredRankings[0].strategies_list?.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/analysis/${filteredRankings[0].clean_symbol}`}
                    className="text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1"
                  >
                    <span>Analisa 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Rank 2: Silver / Juara 2 */}
            {filteredRankings[1] && (
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-400/15 via-slate-900/90 to-slate-900/90 border border-slate-500/60 shadow-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/40 border border-slate-500/50 flex items-center justify-center text-slate-200 font-black text-base font-mono">
                      🥈 2
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-lg text-slate-200">
                          {filteredRankings[1].clean_symbol}
                        </span>
                        {filteredRankings[1].is_sharia && <ShariaBadge isSharia={true} />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {filteredRankings[1].name}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-700/40 text-slate-300 text-[10px] font-mono font-bold border border-slate-600/40">
                    JUARA 2
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
                    <div className="text-xl font-black text-emerald-400">
                      {filteredRankings[1].win_rate_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {filteredRankings[1].win_count}W / {filteredRankings[1].loss_count}L ({filteredRankings[1].total_signals} sinyal)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Total PnL</div>
                    <div className={`text-xl font-black ${filteredRankings[1].total_pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {filteredRankings[1].total_pnl_pct > 0 ? "+" : ""}{filteredRankings[1].total_pnl_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Best: +{filteredRankings[1].best_trade_pct}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {filteredRankings[1].strategies_list?.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/analysis/${filteredRankings[1].clean_symbol}`}
                    className="text-slate-300 hover:text-white font-mono font-bold flex items-center gap-1"
                  >
                    <span>Analisa 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Rank 3: Bronze / Juara 3 */}
            {filteredRankings[2] && (
              <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-700/15 via-slate-900/90 to-slate-900/90 border border-amber-700/50 shadow-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/50 flex items-center justify-center text-amber-400 font-black text-base font-mono">
                      🥉 3
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-lg text-amber-200">
                          {filteredRankings[2].clean_symbol}
                        </span>
                        {filteredRankings[2].is_sharia && <ShariaBadge isSharia={true} />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {filteredRankings[2].name}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-900/30 text-amber-400 text-[10px] font-mono font-bold border border-amber-700/40">
                    JUARA 3
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
                    <div className="text-xl font-black text-emerald-400">
                      {filteredRankings[2].win_rate_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {filteredRankings[2].win_count}W / {filteredRankings[2].loss_count}L ({filteredRankings[2].total_signals} sinyal)
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Total PnL</div>
                    <div className={`text-xl font-black ${filteredRankings[2].total_pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {filteredRankings[2].total_pnl_pct > 0 ? "+" : ""}{filteredRankings[2].total_pnl_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Best: +{filteredRankings[2].best_trade_pct}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {filteredRankings[2].strategies_list?.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/analysis/${filteredRankings[2].clean_symbol}`}
                    className="text-amber-300 hover:text-amber-200 font-mono font-bold flex items-center gap-1"
                  >
                    <span>Analisa 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-3.5">Emiten &amp; Nama Perusahaan</th>
                <th className="py-3 px-3.5">Sektor</th>
                <th className="py-3 px-3.5 text-center">Total Sinyal</th>
                <th className="py-3 px-3.5 text-center">Audit (W / L / P)</th>
                <th className="py-3 px-3.5 text-right">Win Rate (%)</th>
                <th className="py-3 px-3.5 text-right">Total PnL (%)</th>
                <th className="py-3 px-3.5 text-right">Rata-rata PnL</th>
                <th className="py-3 px-3.5 text-right">Max Gain</th>
                <th className="py-3 px-3.5">Strategi Terkait</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {rankingsLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <span>Memuat leaderboard emiten...</span>
                  </td>
                </tr>
              ) : filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    Tidak ada data emiten yang memenuhi kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredRankings.map((stock, idx) => (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3.5 text-center font-bold">
                      {idx === 0 ? (
                        <span className="text-amber-300">🥇 1</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-300">🥈 2</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-500">🥉 3</span>
                      ) : (
                        <span className="text-slate-500">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/analysis/${stock.clean_symbol}`}
                          className="font-mono font-bold text-slate-100 hover:text-amber-400 transition-colors"
                        >
                          {stock.clean_symbol}
                        </Link>
                        {stock.is_sharia && <ShariaBadge isSharia={true} />}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {stock.name}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 text-[11px] truncate max-w-[130px]">
                      {stock.sector || "General"}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold text-slate-200">
                      {stock.total_signals}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="text-emerald-400 font-bold">{stock.win_count}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-rose-400 font-bold">{stock.loss_count}</span>
                      {stock.pending_count > 0 && (
                        <>
                          <span className="text-slate-500"> / </span>
                          <span className="text-amber-400 font-bold" title="Posisi Pending">{stock.pending_count}P</span>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                          stock.win_rate_pct >= 70
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : stock.win_rate_pct >= 50
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {stock.win_rate_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold">
                      <span className={stock.total_pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {stock.total_pnl_pct > 0 ? "+" : ""}{stock.total_pnl_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-300">
                      <span className={stock.avg_pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {stock.avg_pnl_pct > 0 ? "+" : ""}{stock.avg_pnl_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-emerald-400">
                      +{stock.best_trade_pct.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {stock.strategies_list?.map((strat) => (
                          <span
                            key={strat}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              strat === "BPJS"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : strat === "PRE_ARA"
                                ? "bg-violet-500/20 text-violet-300"
                                : strat === "BSJP"
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-indigo-500/15 text-indigo-300"
                            }`}
                          >
                            {strat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <Link
                        href={`/analysis/${stock.clean_symbol}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 transition-all"
                      >
                        <span>360°</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Guidance Box */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-3 shadow-lg">
        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Panduan Penggunaan Data Leaderboard Saham:</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 font-mono">1. Filter Konsistensi (Min Sinyal ≥3)</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Gunakan filter minimal 3 atau 5 sinyal untuk menyaring saham yang konsisten menang berulang kali dari waktu ke waktu, dan memisahkan anomali kemenangan 1 kali lonjakan.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 font-mono">2. Saham Langganan Win Rate Tinggi</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Saham-saham seperti GRPH, MIKA, PPGL, PACK memiliki likuiditas dan pola akumulasi bandar yang sangat klop dengan formula momentum IHSG Slayer. Masukkan ke watchlist utama saat sinyal muncul kembali.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-300 font-mono">3. Konfirmasi Analisis 360°</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Klik tombol "360°" pada setiap baris saham untuk memverifikasi struktur order flow, peta support/resistensi Fibonacci, serta valuasi intrinsik Benjamin Graham sebelum mengeksekusi order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
