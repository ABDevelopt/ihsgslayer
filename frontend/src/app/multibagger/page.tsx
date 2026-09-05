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
  Plus
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
      {/* Hero Header */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
                <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                MULTIBAGGER HUNTER v3.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {candidates.length} Saham Terdeteksi
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Minervini Stage 2 + Peter Lynch Runway + Institutional Bandarmologi
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Screening Saham Calon Bagger (2x &ndash; 5x)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Algoritma mendeteksi saham small &ndash; mid cap yang berada di fase awal akumulasi institusi (Bandar CR3 &gt; 55%),
              lolos kriteria tren <span className="text-indigo-300 font-semibold">Mark Minervini Stage 2</span>,
              kontraksi volatilitas (<span className="text-cyan-300 font-semibold">VCP</span>), serta memiliki landasan valuasi pertumbuhan teruji.
            </p>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 shrink-0 self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Memindai Pasar BEI..." : "Segarkan Screener"}
          </button>
        </div>

        {/* 4 Pilar Metodologi Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">1. Minervini Stage 2</p>
              <p className="text-[10px] text-slate-400">Harga &gt; MA50 &gt; MA150 &gt; MA200 &amp; uptrend terkonfirmasi.</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">2. Stealth Accumulation</p>
              <p className="text-[10px] text-slate-400">Top 3 Broker konsentrasi &gt; 55% di harga bawah sebelum markup.</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">3. VCP Compression</p>
              <p className="text-[10px] text-slate-400">Penyusutan volume transaksi tanda pasokan penjual telah habis.</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">4. Small-Mid Cap Runway</p>
              <p className="text-[10px] text-slate-400">Market cap terjangkau memiliki ruang lompat 100% &ndash; 400% lebih leluasa.</p>
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
          <p className="text-xs font-mono text-slate-400">Menjalankan kalkulasi 4-Pilar Multibagger...</p>
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
                className="group relative rounded-3xl bg-cardBg border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 p-5 flex flex-col justify-between"
              >
                {/* Header Card */}
                <div className="space-y-4">
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

                  {/* Target Projections Carousel/Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Proyeksi Target Bagger</span>
                      <span className="text-emerald-400 font-bold">{stock.potential_multiple}</span>
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">+100% (2x)</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          Rp {stock.target_bagger_100.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">+200% (3x)</span>
                        <span className="text-xs font-bold font-mono text-cyan-400">
                          Rp {stock.target_bagger_200.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">+400% (5x)</span>
                        <span className="text-xs font-bold font-mono text-indigo-400">
                          Rp {stock.target_bagger_400.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Pillar Status Checklist */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
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

                    <div className="flex items-start justify-between text-slate-300 gap-2">
                      <span className="text-[10px] text-slate-500 shrink-0">Katalis:</span>
                      <span className="text-[10px] text-slate-300 text-right line-clamp-2">
                        {stock.catalyst_summary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStock(stock)}
                    className="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Detail Kriteria
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

      {/* Modal Detail Kriteria */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white font-mono">
                    {selectedStock.symbol.replace(".JK", "")}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                    Skor: {selectedStock.multibagger_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedStock.name} &bull; {selectedStock.sector}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="text-slate-400 hover:text-white text-lg font-mono p-1"
              >
                &times;
              </button>
            </div>

            {/* Pillar Breakdown Details */}
            <div className="space-y-3 text-xs">
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

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-4 h-4 text-emerald-400" /> 3. Kontraksi Volatilitas (VCP) &amp; Katalis
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
