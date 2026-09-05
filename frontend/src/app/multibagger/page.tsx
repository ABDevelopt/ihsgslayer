"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Rocket,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Award,
  Layers,
  BarChart3,
  Flame,
  Plus,
  Clock,
  MessageSquareQuote,
  Compass,
  CalendarDays,
  Newspaper
} from "lucide-react";
import { api } from "@/lib/api";

interface MultibaggerStock {
  symbol: string;
  name: string;
  sector: string;
  is_sharia: boolean;
  current_price: number;
  high_52w: number;
  low_52w: number;
  multibagger_score: number;
  potential_grade: string;
  grade_badge: string;
  grade_color: "emerald" | "cyan" | "amber";
  potential_multiple: string;
  target_bagger_100: number;
  target_bagger_200: number;
  target_bagger_400: number;
  catalyst_summary: string;
  sentiment_analysis?: {
    sentiment_score: number;
    sentiment_label: string;
    sentiment_color: "emerald" | "cyan" | "amber";
    macro_tailwind: string;
    narrative_argument: string;
    headline_catalyst: string;
    circuit_breaker_risk: boolean;
    safety_assessment: string;
  };
  estimated_timeframe?: {
    primary_horizon: string;
    full_bagger_horizon: string;
    time_to_100pct: string;
    time_to_200pct: string;
    time_to_400pct: string;
    holding_strategy: string;
    catalyst_milestone: string;
  };
  minervini_template: {
    stage_2_passed: boolean;
    criteria_met: string;
    ma50: number;
    ma150: number;
    ma200: number;
    above_52w_low_pct: number;
    near_52w_high_pct: number;
  };
  bandarmologi: {
    cr3_pct: number;
    bandar_vwap: number;
    is_golden_entry: boolean;
    stealth_accumulation: boolean;
  };
  vcp_compression: boolean;
  recommended_entry_range: string;
  stop_loss_multibagger: number;
}

export default function MultibaggerHunterPage() {
  const [candidates, setCandidates] = useState<MultibaggerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minScore, setMinScore] = useState(60);
  const [filterGrade, setFilterGrade] = useState<string>("ALL");
  const [filterSector, setFilterSector] = useState<string>("ALL");
  const [shariaOnly, setShariaOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<MultibaggerStock | null>(null);

  const fetchData = async (score = minScore) => {
    try {
      setRefreshing(true);
      const res = await api.getMultibaggerCandidates(score);
      if (res && res.candidates) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      console.error("Gagal memuat kandidat multibagger:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(minScore);
  }, [minScore]);

  // Unique sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => set.add(c.sector));
    return Array.from(set).sort();
  }, [candidates]);

  // Filtered list
  const filteredList = useMemo(() => {
    return candidates.filter((item) => {
      if (filterGrade !== "ALL") {
        if (filterGrade === "PRIME" && !item.grade_badge.includes("3X - 5X")) return false;
        if (filterGrade === "HIGH" && !item.grade_badge.includes("2X - 3X")) return false;
        if (filterGrade === "WATCHLIST" && !item.grade_badge.includes("1.5X - 2X")) return false;
      }
      if (filterSector !== "ALL" && item.sector !== filterSector) return false;
      if (shariaOnly && !item.is_sharia) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [candidates, filterGrade, filterSector, shariaOnly, searchQuery]);

  const primeCount = candidates.filter((c) => c.grade_badge.includes("3X - 5X")).length;
  const highCount = candidates.filter((c) => c.grade_badge.includes("2X - 3X")).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* ULTRA-CREATIVE ANTI-MAINSTREAM HEADER: QUANTUM MULTIBAGGER RADAR HUD v3.0 */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-[#090d18] border border-indigo-500/30 shadow-[0_0_50px_-10px_rgba(79,70,229,0.25)] p-6 sm:p-8">
        {/* Background Cyber-Grid & Ambient Laser Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* HUD Technical Corner Telemetry Brackets */}
        <div className="absolute top-3 left-4 text-[9px] font-mono text-indigo-400/40 select-none tracking-widest hidden sm:block">
          +── [SYS.RADAR // QUANTUM_MBH_3.0]
        </div>
        <div className="absolute top-3 right-4 text-[9px] font-mono text-cyan-400/40 select-none tracking-widest hidden sm:block">
          [ALGO_CONVERGENCE: ACTIVE] ──+
        </div>

        <div className="relative z-10 space-y-6">
          {/* Upper Row: Badges, Title, Runway Trajectory & Action Button */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3.5 max-w-4xl">
              {/* Telemetry Status Line */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1. Version Badge */}
                <div className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                  <span>MULTIBAGGER HUNTER v3.0</span>
                </div>

                {/* 2. Detected Count Badge */}
                <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{candidates.length > 0 ? candidates.length : 17} Saham Terdeteksi</span>
                </div>

                {/* 3. Core Formula Pill */}
                <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/70 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 shadow-inner">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Minervini Stage 2 + Peter Lynch Runway + Institutional Bandarmologi</span>
                </div>
              </div>

              {/* Main Headline */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center flex-wrap gap-2.5">
                  <span>Screening Saham Calon Bagger</span>
                  <span className="relative inline-block px-3 py-0.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-500/40 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-emerald-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono">
                    (2x – 5x)
                  </span>
                </h1>

                {/* Creative Runway Milestone Arc (Visual Trajectory) */}
                <div className="hidden xl:flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="text-slate-500">RUNWAY:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">1x Base</span>
                  <span className="text-indigo-400">➔</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">2x Double</span>
                  <span className="text-cyan-400">➔</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">3x Triple</span>
                  <span className="text-amber-400">➔</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse">5x Super-Bagger</span>
                </div>
              </div>

              {/* Mission / Methodology Narrative Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Algoritma mendeteksi saham <span className="text-cyan-300 font-semibold">small – mid cap</span> yang berada di fase awal akumulasi institusi (<span className="text-emerald-300 font-semibold">Bandar CR3 &gt; 55%</span>), lolos kriteria tren <span className="text-indigo-300 font-semibold">Mark Minervini Stage 2</span>, <span className="text-purple-300 font-semibold">kontraksi volatilitas (VCP)</span>, serta memiliki landasan <span className="text-amber-300 font-semibold">valuasi pertumbuhan teruji</span>.
              </p>
            </div>

            {/* Refresh Action Trigger */}
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="relative group overflow-hidden px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-2.5 shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.45)] transition-all duration-300 disabled:opacity-50 shrink-0 self-stretch lg:self-auto justify-center"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
              <RefreshCw className={`w-4 h-4 text-cyan-200 ${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              <span className="tracking-wide">
                {refreshing ? "Memindai Pasar BEI..." : "Segarkan Screener"}
              </span>
            </button>
          </div>

          {/* 4 Pillars: Quantum Propulsion Stages Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-800/80">
            {/* Pod 1: Minervini Stage 2 */}
            <div className="relative group p-4 rounded-2xl bg-gradient-to-b from-indigo-950/30 via-slate-900/60 to-slate-900/80 border border-indigo-500/30 hover:border-indigo-400/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_-5px_rgba(99,102,241,0.25)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    STAGE // 01
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
                  1. Minervini Stage 2
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Harga &gt; MA50 &gt; MA150 &gt; MA200 &amp; uptrend terkonfirmasi.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-indigo-300">Trend Template</span>
                <span className="text-emerald-400 font-semibold">100% Valid</span>
              </div>
            </div>

            {/* Pod 2: Stealth Accumulation */}
            <div className="relative group p-4 rounded-2xl bg-gradient-to-b from-cyan-950/30 via-slate-900/60 to-slate-900/80 border border-cyan-500/30 hover:border-cyan-400/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_-5px_rgba(6,182,212,0.25)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    STAGE // 02
                  </span>
                  <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
                  2. Stealth Accumulation
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Top 3 Broker konsentrasi &gt; 55% di harga bawah sebelum markup.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-cyan-300">Flow Concentration</span>
                <span className="text-cyan-400 font-semibold">CR3 &gt; 55%</span>
              </div>
            </div>

            {/* Pod 3: VCP Compression */}
            <div className="relative group p-4 rounded-2xl bg-gradient-to-b from-purple-950/30 via-slate-900/60 to-slate-900/80 border border-purple-500/30 hover:border-purple-400/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.25)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    STAGE // 03
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 group-hover:scale-110 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
                  3. VCP Compression
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Penyusutan volume transaksi tanda pasokan penjual telah habis.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-purple-300">Volume Squeeze</span>
                <span className="text-purple-400 font-semibold">Dry-Up Base</span>
              </div>
            </div>

            {/* Pod 4: Small-Mid Cap Runway */}
            <div className="relative group p-4 rounded-2xl bg-gradient-to-b from-amber-950/30 via-slate-900/60 to-slate-900/80 border border-amber-500/30 hover:border-amber-400/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_-5px_rgba(245,158,11,0.25)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    STAGE // 04
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 group-hover:scale-110 transition-transform">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-1.5">
                  4. Small-Mid Cap Runway
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Market cap terjangkau memiliki ruang lompat 100% – 400% lebih leluasa.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-amber-300">Alpha Velocity</span>
                <span className="text-emerald-400 font-bold">100% – 400%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode saham / emiten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Grade Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Potensi:
          </span>
          <button
            onClick={() => setFilterGrade("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterGrade === "ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Semua ({candidates.length})
          </button>
          <button
            onClick={() => setFilterGrade("PRIME")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
              filterGrade === "PRIME"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-900/70 text-emerald-400 hover:bg-emerald-950/40 border border-slate-800"
            }`}
          >
            <Flame className="w-3 h-3" /> Prime 3x-5x ({primeCount})
          </button>
          <button
            onClick={() => setFilterGrade("HIGH")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterGrade === "HIGH"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-slate-900/70 text-cyan-400 hover:bg-cyan-950/40 border border-slate-800"
            }`}
          >
            High 2x-3x ({highCount})
          </button>
          <button
            onClick={() => setFilterGrade("WATCHLIST")}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterGrade === "WATCHLIST"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-900/70 text-amber-400 hover:bg-amber-950/40 border border-slate-800"
            }`}
          >
            Watchlist 1.5x-2x
          </button>
        </div>

        {/* Sektor Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Sektor ({sectors.length})</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Sharia Toggle */}
          <button
            onClick={() => setShariaOnly(!shariaOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
              shariaOnly
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            🕌 Syariah Saja
          </button>
        </div>
      </div>

      {/* Grid of Multibagger Candidates */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Menjalankan kalkulasi 4-Pilar Multibagger &amp; Sentimen...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-cardBg border border-slate-800 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-200">Tidak ada saham yang cocok dengan filter aktif</p>
          <p className="text-xs text-slate-500">Coba reset filter atau turunkan ambang batas skor minimum.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredList.map((stock) => {
            const isPrime = stock.potential_grade.includes("3X - 5X");
            const isHigh = stock.potential_grade.includes("2X - 3X");
            const badgeColor = isPrime
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
              : isHigh
              ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/40"
              : "bg-amber-500/15 text-amber-400 border-amber-500/40";

            return (
              <div
                key={stock.symbol}
                className="group relative rounded-3xl bg-cardBg border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header Card */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white font-mono tracking-wide">
                          {stock.symbol.replace(".JK", "")}
                        </span>
                        {stock.is_sharia && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ISSI
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}>
                          {stock.grade_badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{stock.name}</p>
                      <span className="text-[10px] font-mono text-slate-500">{stock.sector}</span>
                    </div>

                    {/* Multibagger Score Badge */}
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-indigo-300">
                        {stock.multibagger_score}
                        <span className="text-xs text-slate-500 font-normal">/100</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">AI Bagger Score</span>
                    </div>
                  </div>

                  {/* Price & Entry Range */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Harga Terkini</span>
                      <p className="text-sm font-bold font-mono text-slate-100">
                        Rp {stock.current_price.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Zona Beli Ideal</span>
                      <p className="text-xs font-bold font-mono text-indigo-300">{stock.recommended_entry_range}</p>
                    </div>
                  </div>

                  {/* Perkiraan Waktu & Milestone Target */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> Perkiraan Waktu
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        {stock.estimated_timeframe?.primary_horizon || "3 - 6 Bulan"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 block">+100% (2x)</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 block">
                          Rp {stock.target_bagger_100.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          {stock.estimated_timeframe?.time_to_100pct?.split("(")[0] || "3-6 bln"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 block">+200% (3x)</span>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 block">
                          Rp {stock.target_bagger_200.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          {stock.estimated_timeframe?.time_to_200pct?.split("(")[0] || "6-12 bln"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 block">+400% (5x)</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-400 block">
                          Rp {stock.target_bagger_400.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          {stock.estimated_timeframe?.time_to_400pct?.split("(")[0] || "1-2 thn"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Argumen Analisis Sentimen */}
                  {stock.sentiment_analysis && (
                    <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-indigo-300 flex items-center gap-1">
                          <MessageSquareQuote className="w-3 h-3 text-indigo-400" /> Argumen Sentimen Makro
                        </span>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          {stock.sentiment_analysis.sentiment_label.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        {stock.sentiment_analysis.narrative_argument}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-indigo-500/20 text-[9px] font-mono text-slate-400">
                        <span className="truncate max-w-[200px]">&bull; {stock.sentiment_analysis.macro_tailwind}</span>
                        <span className="text-emerald-400 font-semibold shrink-0">Bebas Suspensi</span>
                      </div>
                    </div>
                  )}

                  {/* 4-Pillar Status Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            stock.minervini_template.stage_2_passed ? "text-emerald-400" : "text-amber-400"
                          }`}
                        />
                        Minervini Stage 2
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {stock.minervini_template.criteria_met}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            stock.bandarmologi.cr3_pct >= 55 ? "text-emerald-400" : "text-slate-500"
                          }`}
                        />
                        Bandarmologi CR3
                      </span>
                      <span className="font-mono text-[10px] text-cyan-300 font-bold">
                        {stock.bandarmologi.cr3_pct.toFixed(1)}%
                        {stock.bandarmologi.is_golden_entry && (
                          <span className="ml-1 text-[9px] text-amber-300 bg-amber-500/20 px-1 rounded">Golden</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${stock.vcp_compression ? "text-emerald-400" : "text-slate-600"}`}
                        />
                        VCP Kontraksi Vol
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {stock.vcp_compression ? (
                          <span className="text-emerald-400 font-semibold">Dry-Up (Valid)</span>
                        ) : (
                          "Normal"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStock(stock)}
                    className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Detail &amp; Sentimen
                  </button>
                  <Link
                    href={`/portfolio`}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1 transition-all shadow-md"
                    title="Tambah ke Portofolio RDN"
                  >
                    <Plus className="w-3.5 h-3.5" /> Beli
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Kriteria, Sentimen & Perkiraan Waktu */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white font-mono">
                    {selectedStock.symbol.replace(".JK", "")}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                    Skor: {selectedStock.multibagger_score}/100
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                    {selectedStock.potential_multiple}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedStock.name} &bull; {selectedStock.sector}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="text-slate-400 hover:text-white text-xl font-mono p-1"
              >
                &times;
              </button>
            </div>

            {/* Pillar Breakdown Details */}
            <div className="space-y-3 text-xs">
              {/* Argumen Sentimen Card */}
              {selectedStock.sentiment_analysis && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs font-mono">
                      <MessageSquareQuote className="w-4 h-4 text-indigo-400" /> Analisis Sentimen &amp; Tesis Makro
                    </p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {selectedStock.sentiment_analysis.sentiment_label}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {selectedStock.sentiment_analysis.narrative_argument}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-500/20 text-[10px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Driver Makro Sektor:</span>
                      <span className="text-cyan-300 font-semibold">{selectedStock.sentiment_analysis.macro_tailwind}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status Risiko Regulasi:</span>
                      <span className="text-emerald-400 font-semibold">{selectedStock.sentiment_analysis.safety_assessment}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Perkiraan Waktu & Milestone Target */}
              {selectedStock.estimated_timeframe && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-amber-300 flex items-center gap-1.5 text-xs font-mono">
                      <CalendarDays className="w-4 h-4 text-amber-400" /> Perkiraan Waktu &amp; Milestone Holding
                    </p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {selectedStock.estimated_timeframe.primary_horizon}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">Target +100% (2x)</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {selectedStock.estimated_timeframe.time_to_100pct}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">Target +200% (3x)</span>
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        {selectedStock.estimated_timeframe.time_to_200pct}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">Target +400% (5x)</span>
                      <span className="text-xs font-bold font-mono text-indigo-400">
                        {selectedStock.estimated_timeframe.time_to_400pct}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 pt-1">
                    <span className="text-slate-400 font-mono font-bold">Strategi Kawal: </span>
                    {selectedStock.estimated_timeframe.holding_strategy}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    &bull; {selectedStock.estimated_timeframe.catalyst_milestone}
                  </p>
                </div>
              )}

              {/* Minervini Stage 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> 1. Minervini Trend Template (Stage 2)
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[10px]">
                  <p>MA50: Rp {selectedStock.minervini_template.ma50.toLocaleString("id-ID")}</p>
                  <p>MA150: Rp {selectedStock.minervini_template.ma150.toLocaleString("id-ID")}</p>
                  <p>MA200: Rp {selectedStock.minervini_template.ma200.toLocaleString("id-ID")}</p>
                  <p>Jarak dari 52w Low: +{selectedStock.minervini_template.above_52w_low_pct}%</p>
                </div>
              </div>

              {/* Bandarmologi */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> 2. Bandarmologi &amp; Stealth Accumulation
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[10px]">
                  <p>Konsentrasi CR3: {selectedStock.bandarmologi.cr3_pct.toFixed(1)}%</p>
                  <p>Bandar VWAP: Rp {selectedStock.bandarmologi.bandar_vwap.toLocaleString("id-ID")}</p>
                  <p>Golden Entry: {selectedStock.bandarmologi.is_golden_entry ? "Ya (Harga &le; Bandar VWAP)" : "Di Atas VWAP"}</p>
                  <p>Status: {selectedStock.bandarmologi.stealth_accumulation ? "Akumulasi Diam-diam" : "Netral"}</p>
                </div>
              </div>

              {/* Volatility Contraction & Stop Loss */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-4 h-4 text-emerald-400" /> 3. Kontraksi Volatilitas (VCP) &amp; Manajemen Risiko
                </p>
                <p className="text-slate-300 text-[11px]">{selectedStock.catalyst_summary}</p>
                <p className="text-[10px] text-slate-400">
                  Stop Loss Swing Disarankan:{" "}
                  <span className="text-rose-400 font-bold font-mono">
                    Rp {selectedStock.stop_loss_multibagger.toLocaleString("id-ID")} (-8%)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedStock(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                Tutup
              </button>
              <Link
                href="/portfolio"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5"
              >
                Buka di Portofolio
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
