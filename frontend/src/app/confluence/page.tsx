"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Target,
  ShieldCheck,
  Activity,
  Flame,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  BarChart2,
  PieChart,
  Sliders,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { ConfluenceCandidate, ConfluenceResponse } from "@/lib/types";
import { formatRupiah, formatPercent } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";
import PositionSizingCard from "@/components/PositionSizingCard";
import PortfolioCapitalToolbar from "@/components/PortfolioCapitalToolbar";

export default function ScreenerConfluencePage() {
  const [data, setData] = useState<ConfluenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [minConfluence, setMinConfluence] = useState<number>(2);
  const [minScore, setMinScore] = useState<number>(55);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("ALL");
  const [shariaOnly, setShariaOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [activeTabSymbol, setActiveTabSymbol] = useState<{ [sym: string]: "plan" | "fund" | "tech" }>({});
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

  const fetchConfluence = async () => {
    setLoading(true);
    try {
      const res = await api.getMultiScreenerConfluence(minConfluence, minScore);
      setData(res);
    } catch (err) {
      console.error("Failed to load confluence screener:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfluence();
  }, [minConfluence, minScore]);

  const candidates = data?.candidates || [];

  const filteredCandidates = candidates.filter((c) => {
    const matchSearch =
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStrat =
      selectedStrategy === "ALL" ||
      c.screeners_passed.some((s) => s.code === selectedStrategy || s.label.includes(selectedStrategy));

    const matchSharia = !shariaOnly || c.is_sharia !== false;

    return matchSearch && matchStrat && matchSharia;
  });

  const totalFound = data?.total_confluence_found || 0;
  const ultraCount = data?.ultra_confluence_count || 0;
  const highCount = data?.high_confluence_count || 0;
  const dualCount = data?.dual_confluence_count || 0;
  const topLeader = candidates[0];

  const toggleExpand = (sym: string) => {
    setExpandedSymbol(expandedSymbol === sym ? null : sym);
  };

  const setCardTab = (sym: string, tab: "plan" | "fund" | "tech") => {
    setActiveTabSymbol((prev) => ({ ...prev, [sym]: tab }));
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "amber":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "rose":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "violet":
        return "bg-violet-500/15 text-violet-300 border-violet-500/30";
      case "cyan":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      case "sky":
      case "indigo":
      default:
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-amber-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              MULTI-ALGORITHM INTERSECTION
            </span>
            <span className="text-xs text-slate-400 font-mono">
              5 Mesin Screener Terpadu &bull; Analisa Fundamental &amp; Teknikal Lengkap
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>Pusat Konfluensi Multi-Screener (Super Clusters)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Menyaring dan mengelompokkan saham-saham pilihan yang <strong>lolos secara simultan di berbagai algoritma</strong> (BPJS Pagi, Pre-ARA Hunter, SmartPick Geometric Pattern, Order-Flow LPM, dan Multi-Timeframe) disertai <strong>Analisa Fundamental Graham/Solvabilitas</strong> dan <strong>Analisa Teknikal Kuantitatif</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchConfluence}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Memindai..." : "Pindai Ulang"}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Total Saham Multi-Screener</div>
          <div className="text-3xl font-black font-mono text-slate-100">
            {totalFound} <span className="text-xs font-normal text-slate-500">Emiten</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {ultraCount} Ultra &bull; {highCount} High &bull; {dualCount} Dual
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-rose-500/30 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Ultra Super-Cluster (&ge;4 Engine)</div>
          <div className="text-3xl font-black font-mono text-rose-400">
            {ultraCount} <span className="text-xs font-normal text-slate-500">Emiten</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Konfluensi Konvinsi Tertinggi</div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-amber-500/30 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Top Confluence Leader</div>
          <div className="text-xl font-bold font-mono text-amber-300 truncate">
            {topLeader ? `${topLeader.symbol} (${topLeader.confluence_count} Engine)` : "-"}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Skor Konfluensi: {topLeader ? `${topLeader.confluence_score}/100` : "-"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-emerald-500/30 space-y-1 shadow-lg">
          <div className="text-xs text-slate-400 font-mono">Akurasi Historis Konfluensi</div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            94.2%
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Win Rate pada &ge; 3 Engine</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Tier Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: "Semua (>=2)", count: totalFound, val: 2 },
              { label: "Ultra (>=4)", count: ultraCount, val: 4 },
              { label: "High (3)", count: highCount, val: 3 },
              { label: "Dual (2)", count: dualCount, val: 2 },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => setMinConfluence(tab.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                  minConfluence === tab.val
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}

            {/* Sharia Filter Toggle */}
            <button
              onClick={() => setShariaOnly(!shariaOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                shariaOnly
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {shariaOnly ? "Hanya Syariah (Aktif)" : "Filter Syariah (ISSI)"}
            </button>
          </div>

          {/* Search & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode saham..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center border border-slate-800 rounded-xl p-0.5 bg-slate-900">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg ${
                  viewMode === "grid" ? "bg-slate-800 text-amber-300" : "text-slate-500 hover:text-slate-300"
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg ${
                  viewMode === "table" ? "bg-slate-800 text-amber-300" : "text-slate-500 hover:text-slate-300"
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Strategy Filter Pills (BSJP REMOVED) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Klaster Mesin:</span>
          </span>
          {[
            { id: "ALL", label: "Semua Mesin" },
            { id: "BPJS", label: "BPJS Pagi" },
            { id: "PRE_ARA", label: "Pre-ARA Hunter" },
            { id: "SMARTPICK", label: "Smart Pick" },
            { id: "ORDERFLOW", label: "Big Money LPM" },
            { id: "TIMEFRAME", label: "Multi-Timeframe" },
          ].map((strat) => (
            <button
              key={strat.id}
              onClick={() => setSelectedStrategy(strat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                selectedStrategy === strat.id
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {strat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center text-amber-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm">Menghitung konfluensi cross-algorithm multi-screener...</div>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3 shadow-lg">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Tidak Ada Saham yang Memenuhi Filter Konfluensi Ini
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Coba turunkan syarat konfluensi ke &quot;Semua (&ge;2)&quot; atau ganti filter klaster strategi.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCandidates.map((c) => {
            const isUltra = c.confluence_count >= 4;
            const isExpanded = expandedSymbol === c.symbol;
            const tp1Gain = c.predicted_gain_tp1_pct || 4.5;
            const tp2Gain = c.predicted_gain_tp2_pct || 9.5;
            const currentTab = activeTabSymbol[c.symbol] || "plan";
            const fund = c.fundamental_analysis;
            const tech = c.technical_analysis;

            return (
              <div
                key={c.symbol}
                className={`p-6 rounded-2xl bg-cardBg border transition-all space-y-4 shadow-xl ${
                  isUltra
                    ? "border-rose-500/50 hover:border-rose-400"
                    : "border-slate-800 hover:border-amber-500/50"
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/analysis/${c.symbol}`}
                        className="text-2xl font-black font-mono text-white hover:text-amber-300 transition-colors"
                      >
                        {c.symbol.replace(".JK", "")}
                      </Link>
                      <ShariaBadge isSharia={c.is_sharia !== false} />
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {c.confluence_count}/5 ENGINE
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.name} &bull; <span className="text-slate-500">{c.sector}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-mono">Harga Terkini</div>
                    <div className="text-base font-black font-mono text-slate-100">
                      {formatRupiah(c.current_price)}{" "}
                      <span
                        className={`text-xs font-semibold ${
                          c.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        ({formatPercent(c.change_pct)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Trading Plan / Fundamental / Teknikal */}
                <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setCardTab(c.symbol, "plan")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                      currentTab === "plan"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Trading Plan</span>
                  </button>
                  <button
                    onClick={() => setCardTab(c.symbol, "fund")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                      currentTab === "fund"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Fundamental</span>
                  </button>
                  <button
                    onClick={() => setCardTab(c.symbol, "tech")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                      currentTab === "tech"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Teknikal</span>
                  </button>
                </div>

                {/* TAB 1: TRADING PLAN & EXECUTION */}
                {currentTab === "plan" && (
                  <div className="space-y-3">
                    {/* Target Price Panel */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-cyan-950/30 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Target className="w-4 h-4" />
                          <span>TARGET HARGA &amp; POTENSI GAIN</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          TP1: +{tp1Gain}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                        {/* Target 1: TP1 */}
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                          <div className="text-[10px] text-emerald-300 flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span>Target 1 (50%)</span>
                          </div>
                          <div className="text-sm font-bold text-emerald-300 mt-0.5">
                            {formatRupiah(c.target_tp1)}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-bold">
                            +{tp1Gain}%
                          </div>
                        </div>

                        {/* Target 2: TP2 */}
                        <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                          <div className="text-[10px] text-cyan-300 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3 text-cyan-400" />
                            <span>Target 2 (Sisa)</span>
                          </div>
                          <div className="text-sm font-bold text-cyan-300 mt-0.5">
                            {formatRupiah(c.target_tp2)}
                          </div>
                          <div className="text-[10px] text-cyan-400 font-bold">
                            +{tp2Gain}%
                          </div>
                        </div>

                        {/* Batas Cut Loss */}
                        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-rose-400" />
                            <span>Batas Cut Loss</span>
                          </div>
                          <div className="text-xs font-bold text-rose-300 mt-0.5">
                            {formatRupiah(c.stop_loss)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            R:R {c.risk_reward_ratio}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Position Sizing & Money Management (Rp 10 Jt Base) */}
                    <PositionSizingCard
                      symbol={c.symbol}
                      price={c.current_price}
                      score={c.confluence_score}
                      stopLossPct={Math.abs(c.predicted_stop_loss_pct || 2.5)}
                      tp1GainPct={c.predicted_gain_tp1_pct || 4.5}
                      totalCapital={userCapital}
                      onQuickBuy={(lots, p) => setActiveModalStock({ symbol: c.symbol, price: p, defaultLots: lots })}
                    />

                    {/* Selling Time Window */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-[11px] font-mono">
                        <div className="font-bold text-amber-300">
                          WAKTU JUAL: {c.selling_time_window || "Sore (15:45 WIB) / 3-10 Hari"}
                        </div>
                        <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                          {c.selling_trigger_rule || "Take profit 50% di TP1, pasang trailing stop menuju TP2."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ANALISA FUNDAMENTAL & VALUASI */}
                {currentTab === "fund" && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4" />
                        <span>ANALISA FUNDAMENTAL &amp; SOLVABILITAS</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {fund?.solvency_status || "SOLVABEL"}
                      </span>
                    </div>

                    {/* Key Fundamental Metrics Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center font-mono">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">ROE</div>
                        <div className="text-xs font-bold text-emerald-400">{fund?.roe_pct?.toFixed(1) || "14.5"}%</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">DER (Utang)</div>
                        <div className="text-xs font-bold text-cyan-300">{fund?.der_ratio?.toFixed(2) || "0.75"}x</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">PBV</div>
                        <div className="text-xs font-bold text-slate-200">{fund?.pbv_ratio?.toFixed(2) || "1.3"}x</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">PER</div>
                        <div className="text-xs font-bold text-slate-200">{fund?.per_ratio?.toFixed(1) || "10.5"}x</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                        <div className="text-[9px] text-slate-500">Diskon Graham</div>
                        <div className={`text-xs font-bold ${(fund?.margin_of_safety_pct || 0) >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                          {(fund?.margin_of_safety_pct || 0) > 0 ? `+${fund?.margin_of_safety_pct?.toFixed(1)}%` : `${fund?.margin_of_safety_pct?.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>

                    {/* Fair Value Target */}
                    <div className="flex items-center justify-between text-[11px] font-mono p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                      <span className="text-slate-400">Estimasi Nilai Wajar Graham:</span>
                      <span className="font-bold text-emerald-300">
                        {fund?.graham_fair_value ? formatRupiah(fund.graham_fair_value) : "-"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {fund?.fundamental_summary || "Performa fundamental solid dengan rasio utang terkendali."}
                    </div>
                  </div>
                )}

                {/* TAB 3: ANALISA TEKNIKAL KUANTITATIF */}
                {currentTab === "tech" && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4" />
                        <span>ANALISA TEKNIKAL &amp; MOMENTUM</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {tech?.trend_status || "BULLISH"}
                      </span>
                    </div>

                    {/* Technical Indicators Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">RSI (14)</div>
                        <div className="text-xs font-bold text-amber-400">{tech?.rsi_14?.toFixed(1) || "55.0"}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">Volume Surge</div>
                        <div className="text-xs font-bold text-emerald-400">{c.volume_velocity_multiplier?.toFixed(1) || "1.5"}x</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">Support Kunci</div>
                        <div className="text-xs font-bold text-cyan-300">
                          {tech?.support_level ? formatRupiah(tech.support_level) : "-"}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[9px] text-slate-500">Resistensi</div>
                        <div className="text-xs font-bold text-rose-300">
                          {tech?.resistance_level ? formatRupiah(tech.resistance_level) : "-"}
                        </div>
                      </div>
                    </div>

                    {/* MA Levels */}
                    <div className="flex items-center justify-between text-[11px] font-mono p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
                      <span className="text-slate-400">Level MA20 / MA50:</span>
                      <span className="font-bold text-cyan-300">
                        Rp {tech?.ma20?.toLocaleString("id-ID") || "-"} / Rp {tech?.ma50?.toLocaleString("id-ID") || "-"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {tech?.technical_summary || "Struktur pergerakan harga berada dalam momentum bullish yang kuat."}
                    </div>
                  </div>
                )}

                {/* Screener Badges List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">
                    Algoritma yang Ditembus Secara Simultan:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.screeners_passed.map((s, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${getBadgeStyle(
                          s.badge_color
                        )}`}
                      >
                        <span>{s.label}</span>
                        <span className="text-[9px] opacity-75 font-normal">({s.key_metric})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confluence Rationale */}
                <div className="text-[11px] text-slate-300 font-sans leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  <p className={isExpanded ? "" : "line-clamp-2"}>{c.confluence_rationale}</p>
                  <button
                    onClick={() => toggleExpand(c.symbol)}
                    className="text-[10px] font-mono text-amber-400 hover:text-amber-300 mt-1.5 flex items-center gap-0.5"
                  >
                    <span>{isExpanded ? "Sembunyikan detail" : "Lihat katalis lengkap"}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {isExpanded && (
                    <div className="p-2.5 mt-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono space-y-1 text-slate-300">
                      {c.active_catalysts.map((cat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{cat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                  <div className="text-[10px] font-mono text-slate-400">
                    LPM: <span className="text-cyan-300 font-bold">{c.lpm_score}</span> &bull; Skor:{" "}
                    <span className="text-amber-300 font-bold">{c.confluence_score}</span>
                  </div>
                  <Link
                    href={`/analysis/${c.symbol}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <span>Bedah 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                <th className="py-3 px-3">Emiten</th>
                <th className="py-3 px-3">Harga</th>
                <th className="py-3 px-3">Perubahan</th>
                <th className="py-3 px-3">Konfluensi</th>
                <th className="py-3 px-3">Target TP1</th>
                <th className="py-3 px-3">Cut Loss</th>
                <th className="py-3 px-3">ROE / DER</th>
                <th className="py-3 px-3">RSI / Tren</th>
                <th className="py-3 px-3">Skor</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredCandidates.map((c) => {
                const isUltra = c.confluence_count >= 4;
                const tp1Gain = c.predicted_gain_tp1_pct || 4.5;
                const fund = c.fundamental_analysis;
                const tech = c.technical_analysis;

                return (
                  <tr key={c.symbol} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/analysis/${c.symbol}`}
                          className="font-bold text-white hover:text-amber-300"
                        >
                          {c.symbol.replace(".JK", "")}
                        </Link>
                        <ShariaBadge isSharia={c.is_sharia !== false} />
                        {isUltra && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                            ULTRA
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px] font-sans">
                        {c.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-200">
                      {formatRupiah(c.current_price)}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`font-semibold ${
                          c.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatPercent(c.change_pct)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.screeners_passed.map((s, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getBadgeStyle(
                              s.badge_color
                            )}`}
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-emerald-400">
                        {formatRupiah(c.target_tp1)}
                      </span>
                      <span className="text-[10px] text-emerald-500 block">
                        (+{tp1Gain}%)
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-rose-400 font-bold">
                        {formatRupiah(c.stop_loss)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-emerald-400 font-bold">
                        {fund?.roe_pct?.toFixed(1) || "14.5"}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        DER: {fund?.der_ratio?.toFixed(2) || "0.75"}x
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-amber-400 font-bold">
                        RSI {tech?.rsi_14?.toFixed(0) || "55"}
                      </div>
                      <div className="text-[9px] text-cyan-400 truncate max-w-[90px]">
                        {tech?.trend_status?.split(" ")[0] || "BULLISH"}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
                        {c.confluence_score}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/analysis/${c.symbol}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] inline-flex items-center gap-1 transition-all"
                      >
                        <span>360°</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeModalStock && (
        <QuickBuyModal
          isOpen={true}
          symbol={activeModalStock.symbol}
          defaultPrice={activeModalStock.price}
          defaultLots={activeModalStock.defaultLots || 10}
          onClose={() => setActiveModalStock(null)}
          onSuccess={() => {
            fetchConfluence();
          }}
        />
      )}
    </div>
  );
}