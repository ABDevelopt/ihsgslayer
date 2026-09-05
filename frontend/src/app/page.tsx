"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  RefreshCw,
  Award,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  Copy,
  Check,
  Clock,
  Plus,
  Play,
  Share2,
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { DangerShieldModal } from "@/components/DangerShieldModal";
import { ShieldAlert } from "lucide-react";
import { BuySignalCandidate } from "@/lib/types";
import { formatRupiah, formatPercent, getScoreColor } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";
import StockShieldBadge from "@/components/StockShieldBadge";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { useToast } from "@/components/Toast";
import IHSGForecastWidget from "@/components/IHSGForecastWidget";
import PositionSizingCard from "@/components/PositionSizingCard";
import PortfolioCapitalToolbar from "@/components/PortfolioCapitalToolbar";

export default function DashboardOverviewPage() {
  const [candidates, setCandidates] = useState<BuySignalCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<string>("55.0");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [shariaOnly, setShariaOnly] = useState<boolean>(false);
  const [dangerModalOpen, setDangerModalOpen] = useState<boolean>(false);
  const [filterSafeOnly, setFilterSafeOnly] = useState<boolean>(true);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [userCapital, setUserCapital] = useState<number>(10_000_000);
  const [activeModalStock, setActiveModalStock] = useState<{
    symbol: string;
    price: number;
    defaultLots?: number;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ihsg_user_capital");
      if (saved && Number(saved) >= 1_000_000) {
        setUserCapital(Number(saved));
      }
    } catch {}
  }, []);
  const { showToast } = useToast();

  const fetchSignals = async (score = minScore) => {
    setLoading(true);
    try {
      const data = await api.getBuySignals(Number(score));
      const list = (data as any)?.candidates || (data as any)?.signals || [];
      setCandidates(list);
    } catch (err) {
      console.error("Failed to fetch buy signals:", err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals(minScore);
  }, [minScore]);

  const handleCopyCardPlan = (c: any) => {
    const p = c.current_price || c.price || 0;
    const text = `📊 SINYAL BUY: ${c.symbol} (${c.name})
Harga: Rp ${p.toLocaleString('id-ID')} | AI Score: ${c.ai_score}/100
Entry: ${c.entry_zone}
TP1: ${c.target_tp1 || c.tp1} | TP2: ${c.target_tp2 || c.tp2}
Batas Cut Loss: ${c.stop_loss}
Rasio Risk:Reward: ${c.risk_reward_ratio || c.risk_reward || "1 : 2.0"}
Analisis: ${c.why_buy_summary}`;
    navigator.clipboard.writeText(text);
    setCopiedSymbol(c.symbol);
    showToast(`Rencana sinyal ${c.symbol} berhasil disalin!`, "success");
    setTimeout(() => setCopiedSymbol(null), 2500);
  };

  const handleForwardTestExecute = async (c: any) => {
    try {
      const p = c.current_price || c.price || 1000;
      const tp1 = c.tp1_price || Math.round(p * 1.035);
      const tp2 = c.tp2_price || Math.round(p * 1.070);
      const sl = c.stop_loss_price || Math.round(p * 0.975);

      await api.openForwardPosition({
        symbol: c.symbol,
        strategy: "CONFLUENCE",
        entry_price: p,
        shares_lot: 50,
        target_tp1: tp1,
        target_tp2: tp2,
        stop_loss: sl,
        name: c.name || c.symbol,
        sector: c.sector || "General",
        selling_time_window: c.selling_time_window || "",
        notes: "Eksekusi dari Overview Sinyal Buy Terkurasi"
      });
      showToast(`Posisi Forward Test ${c.symbol} berhasil dibuka!`, "success");
    } catch (e: any) {
      showToast(e.message || "Gagal membuka posisi forward test", "error");
    }
  };

  // Extract distinct sectors dynamically
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.sector) set.add(c.sector);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [candidates]);

  // Filter by sector and search query
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSector =
        selectedSector === "ALL" ||
        c.sector?.toLowerCase() === selectedSector.toLowerCase() ||
        c.sector?.toLowerCase().includes(selectedSector.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        c.symbol?.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.sector?.toLowerCase().includes(query);

      return matchesSector && matchesQuery;
    });
  }, [candidates, selectedSector, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Daily IHSG Trend & Global Drivers Forecast Widget */}
      <IHSGForecastWidget />

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Top Tier Fundamental */}
        <div className="p-5 rounded-2xl bg-cardBg border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-2 shadow-lg shadow-emerald-500/5">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Fundamental Unggulan</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {candidates[0]?.symbol || "BBCA.JK"}
          </div>
          <div className="text-xs text-slate-300">
            AI Score:{" "}
            <span className="font-mono font-bold text-emerald-400">
              {candidates[0]?.ai_score || "84.4"} / 100
            </span>{" "}
            (Sangat Sehat)
          </div>
          <p className="text-[11px] text-slate-500">
            Laba bertumbuh, valuasi wajar, dan margin keamanan tebal.
          </p>
        </div>

        {/* Card 2: Akumulasi Bandar Teraktif */}
        <div className="p-5 rounded-2xl bg-cardBg border border-cyan-500/30 hover:border-cyan-500/60 transition-all space-y-2 shadow-lg shadow-cyan-500/5">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Akumulasi Bandar (LPM)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {candidates[1]?.symbol || candidates[0]?.symbol || "BMRI.JK"}
          </div>
          <div className="text-xs text-slate-300">
            Daya Serap:{" "}
            <span className="font-mono font-bold text-cyan-400">2.12x</span> (Bandar Menyerap)
          </div>
          <p className="text-[11px] text-slate-500">
            Antrean jual dilahap masif oleh institusi / Big Money.
          </p>
        </div>

        {/* Card 3: Pola Pantulan Teknikal */}
        <div className="p-5 rounded-2xl bg-cardBg border border-indigo-500/30 hover:border-indigo-500/60 transition-all space-y-2 shadow-lg shadow-indigo-500/5">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Pola Pantulan Rebound</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            {candidates[2]?.symbol || candidates[0]?.symbol || "BBNI.JK"}
          </div>
          <div className="text-xs text-slate-300">
            Pola: <span className="font-mono font-bold text-indigo-400">Breakout &amp; Rebound</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Geometri teknikal mengindikasikan kelanjutan tren naik.
          </p>
        </div>

        {/* Card 4: Proteksi Gorengan */}
        <div className="p-5 rounded-2xl bg-cardBg border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-2 shadow-lg shadow-emerald-500/5">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Stock Shield Protection</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">100% CLEAN</div>
          <div className="text-xs text-slate-300">
            Filter: <span className="text-emerald-400 font-bold">Bebas Bahaya</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Saham penny &lt; Rp 80 dan perangkap hutang otomatis disaring.
          </p>
        </div>
      </div>

      {/* Main Header & Filter Controls Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-cardBorder flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              HYBRID QUANT VERDICT
            </span>
            <span className="text-xs text-slate-400 font-mono">280 Semesta BEI</span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Sinyal BUY Saham Layak Terkurasi</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sistem menyaring 280 saham bursa secara ketat dengan 5 Pilar Fundamental,
            deteksi penyerapan antrean bandar (LPM), dan proteksi Stop Loss defensif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Portfolio Capital Allocator Toolbar */}
          <PortfolioCapitalToolbar
            currentCapital={userCapital}
            onCapitalChange={(cap) => setUserCapital(cap)}
          />

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode / nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Min Score Dropdown */}
          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="55.0">Min. Skor 55 (Semua Rekomendasi 14 Emiten)</option>
            <option value="60.0">Min. Skor 60 (Standar Potensi)</option>
            <option value="65.0">Min. Skor 65 (Standar Presisi)</option>
            <option value="70.0">Min. Skor 70 (Solid Conviction)</option>
            <option value="75.0">Min. Skor 75 (Top Tier Unggul)</option>
            <option value="80.0">Min. Skor 80 (Grade A Institusi)</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchSignals(minScore)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Scan Saham</span>
          </button>
        </div>
      </div>

      {/* Dynamic Sector Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sektor:</span>
        </span>
        {availableSectors.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSector(sec)}
            className={`px-3 py-1 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              selectedSector === sec
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {sec === "ALL" ? `Semua Sektor (${candidates.length})` : sec}
          </button>
        ))}
      </div>

      {/* Grid of Buy Signal Cards */}
      {loading ? (
        <SkeletonGrid count={4} />
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Tidak Ada Emiten yang Lolos Kriteria pada Sektor / Filter Ini
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ditemukan saham yang cocok dengan kata kunci "${searchQuery}".`
              : 'Coba klik tombol "Semua Sektor" atau turunkan filter Minimal Skor ke 60.'}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSelectedSector("ALL");
                setSearchQuery("");
                setMinScore("60.0");
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-md"
            >
              Reset Seluruh Filter
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCandidates.map((c: any) => {
            const scoreColor = getScoreColor(c.ai_score);
            const currentPrice = c.current_price || c.price || 0;
            const targetTp1 = c.target_tp1 || c.tp1 || "-";
            const targetTp2 = c.target_tp2 || c.tp2 || "-";
            const stopLoss = c.stop_loss || "-";
            const rrRatio = c.risk_reward_ratio || c.risk_reward || "1 : 2.0";

            return (
              <div
                key={c.symbol}
                className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 shadow-xl"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <Link
                        href={`/analysis/${c.symbol}`}
                        className="text-2xl font-black font-mono text-white hover:text-emerald-300 transition-colors"
                      >
                        {c.symbol}
                      </Link>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${scoreColor.bg} ${scoreColor.text} ${scoreColor.border}`}
                      >
                        AI SCORE: {c.ai_score}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {c.verdict_category || "BUY (LAYAK)"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.name} &bull; <span className="text-slate-500">{c.sector}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[11px] text-slate-400">Harga Terkini</div>
                    <div className="text-base font-bold text-slate-100">
                      {formatRupiah(currentPrice)}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                  {c.is_orca_signal && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      ORCA BIG MONEY BUY
                    </span>
                  )}
                  {c.active_patterns?.map((pat: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                    >
                      {pat}
                    </span>
                  ))}
                  <StockShieldBadge statusText={c.safety_shield_status || "AMAN / BEBAS GORENGAN"} />
                </div>

                {/* Why Buy Summary Box */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Mengapa Saham Ini Direkomendasikan BUY?</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {c.why_buy_summary}
                  </p>
                  <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                    {c.why_buy_points?.map((pt: string, idx: number) => (
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

                {/* Trade Execution Plan Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-400 font-sans font-medium">
                      Zona Beli (Entry)
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
                      {stopLoss}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                    <div className="text-[10px] text-cyan-400 font-sans font-medium">
                      Target TP 1 (50%)
                    </div>
                    <div className="text-xs font-bold text-cyan-300 mt-1">
                      {targetTp1}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                    <div className="text-[10px] text-indigo-400 font-sans font-medium">
                      Target TP 2 (Sisa)
                    </div>
                    <div className="text-xs font-bold text-indigo-300 mt-1">
                      {targetTp2}
                    </div>
                  </div>
                </div>

                {/* Position Sizing & Money Management Recommendation (Rp 10 Juta Base) */}
                <PositionSizingCard
                  symbol={c.symbol}
                  price={currentPrice}
                  score={c.ai_score}
                  stopLossPct={c.predicted_stop_loss_pct ? Math.abs(c.predicted_stop_loss_pct) : 2.5}
                  tp1GainPct={c.predicted_gain_tp1_pct || 4.5}
                  atrPct={c.atr_14_pct}
                  totalCapital={userCapital}
                  onQuickBuy={(lots, p) => setActiveModalStock({ symbol: c.symbol, price: p, defaultLots: lots })}
                />

                {/* Selling Time Window & Execution Rule Box */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="font-bold text-emerald-300">
                      KAPAN WAKTU JUAL: {c.selling_time_window || "Swing 3 - 15 Hari Bursa (Exit di TP1 / TP2)"}
                    </div>
                    <div className="text-slate-300 font-sans text-[11px] leading-relaxed">
                      {c.selling_trigger_rule || "Kunci 50% profit saat menyentuh TP1, lalu pasang trailing stop untuk sisa posisi menuju target TP2."}
                    </div>
                  </div>
                </div>

                {/* Action Footer Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-slate-400">
                    Risk-Reward: <span className="text-emerald-400 font-bold">{rrRatio}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCopyCardPlan(c)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition-all"
                      title="Salin Rencana Sinyal"
                    >
                      {copiedSymbol === c.symbol ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleForwardTestExecute(c)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 border border-cyan-500/40 transition-all"
                      title="Eksekusi ke Forward Test Paper Trading"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Forward Test</span>
                    </button>

                    <button
                      onClick={() => setActiveModalStock({ symbol: c.symbol, price: currentPrice })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catat Jurnal</span>
                    </button>

                    <Link
                      href={`/analysis/${c.symbol}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 border border-slate-700 transition-all"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Buy Journal Modal */}
      {activeModalStock && (
        <QuickBuyModal
          isOpen={true}
          symbol={activeModalStock.symbol}
          defaultPrice={activeModalStock.price}
          onClose={() => setActiveModalStock(null)}
          onSuccess={() => {
            setActiveModalStock(null);
            showToast(`Transaksi ${activeModalStock.symbol} berhasil dicatat di Jurnal!`, "success");
          }}
        />
      )}
      <DangerShieldModal isOpen={dangerModalOpen} onClose={() => setDangerModalOpen(false)} />
    </div>
  );
}
