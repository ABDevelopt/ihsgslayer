"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  DollarSign,
  Activity,
  Layers,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  Zap,
  ListFilter,
  History,
  LayoutDashboard,
  ShieldAlert,
  Percent
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { formatRupiah, formatPercent } from "@/lib/utils";
import { useToast } from "@/components/Toast";

const PIE_COLORS = ["#10b981", "#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];

interface HoldingItem {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  is_sharia: boolean;
  shares_lot: number;
  entry_price: number;
  current_price: number;
  day_change_pct: number;
  entry_date: string;
  target_tp1: number;
  target_tp2: number;
  stop_loss: number;
  invested_capital: number;
  market_value: number;
  floating_pnl_rp: number;
  floating_pnl_pct: number;
  distance_tp1_pct: number;
  distance_sl_pct: number;
  notes: string;
  technical_indicators: {
    ma20: number;
    ma50: number;
    rsi_14: number;
    rsi_status: string;
    macd_cross: string;
    trend_bias: string;
  };
  bandarmologi: {
    status: string;
    volume_ratio: number;
    foreign_flow: string;
    is_accumulating: boolean;
  };
  ai_score: {
    score: number;
    safety_badge: string;
    is_gorengan: boolean;
  };
  recommendation: {
    action: string;
    action_label: string;
    action_color: string;
    urgency: string;
    rationale: string;
    recommended_date: string;
    recommended_time: string;
  };
}

export default function PortfolioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<"dashboard" | "holdings" | "history">("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recFilter, setRecFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [pieMode, setPieMode] = useState<"asset" | "stock">("stock");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isSellOpen, setIsSellOpen] = useState<boolean>(false);
  const [selectedHolding, setSelectedHolding] = useState<HoldingItem | null>(null);

  // Add form state
  const [formSymbol, setFormSymbol] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formLot, setFormLot] = useState<string>("10");
  const [formTp1, setFormTp1] = useState<string>("");
  const [formSl, setFormSl] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [submittingAdd, setSubmittingAdd] = useState<boolean>(false);

  // Sell form state
  const [sellLot, setSellLot] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [sellReason, setSellReason] = useState<string>("Ambil Profit Target TP1");
  const [submittingSell, setSubmittingSell] = useState<boolean>(false);

  const { showToast } = useToast();

  const fetchPortfolio = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getPortfolioAdvisor();
      if (res && res.status === "success" && res.data) {
        setData(res.data);
      } else {
        showToast("Format respons data portofolio tidak sesuai", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal memuat data portofolio", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const summary = data?.summary || {};
  const holdings: HoldingItem[] = data?.holdings || [];
  const closedTrades: any[] = data?.closed_trades || [];
  const recSummary = data?.recommendation_summary || {};
  const sectorAlloc: any[] = data?.sector_allocation || [];
  const equityHistory: any[] = data?.equity_history || [];

  // Filtered holdings for the list tab
  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      const matchSearch =
        h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.sector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSector = sectorFilter === "ALL" || h.sector === sectorFilter;

      let matchRec = true;
      if (recFilter === "TP") {
        matchRec = h.recommendation.action === "TAKE_PROFIT" || h.recommendation.action === "TAKE_PROFIT_SOON";
      } else if (recFilter === "HOLD") {
        matchRec = h.recommendation.action === "HOLD";
      } else if (recFilter === "BUY") {
        matchRec = h.recommendation.action === "ADD_LOT";
      } else if (recFilter === "CUT_LOSS") {
        matchRec = h.recommendation.action === "CUT_LOSS" || h.recommendation.action === "REDUCE";
      }

      return matchSearch && matchSector && matchRec;
    });
  }, [holdings, searchQuery, sectorFilter, recFilter]);

  // Chart data 1: Asset allocation Pie
  const assetPieData = useMemo(() => {
    if (!summary.total_nav) return [];
    if (pieMode === "asset") {
      return [
        { name: "Kas RDN", value: summary.cash_balance || 0, color: "#10b981" },
        { name: "Saham Terbuka", value: summary.total_market_value || 0, color: "#6366f1" }
      ];
    }
    // Stock-by-stock breakdown + remaining cash
    const items = holdings.map((h, i) => ({
      name: h.symbol.replace(".JK", ""),
      value: h.market_value,
      color: PIE_COLORS[i % PIE_COLORS.length]
    }));
    if (summary.cash_balance > 0) {
      items.push({
        name: "Kas RDN",
        value: summary.cash_balance,
        color: "#10b981"
      });
    }
    return items;
  }, [summary, holdings, pieMode]);

  // Chart data 2: PnL Performance per stock
  const pnlBarData = useMemo(() => {
    return holdings.map((h) => ({
      symbol: h.symbol.replace(".JK", ""),
      pnl_pct: h.floating_pnl_pct,
      pnl_rp: h.floating_pnl_rp,
      is_positive: h.floating_pnl_pct >= 0
    })).sort((a, b) => b.pnl_pct - a.pnl_pct);
  }, [holdings]);

  // Chart data 3: TP vs SL proximity
  const proximityData = useMemo(() => {
    return holdings.map((h) => ({
      symbol: h.symbol.replace(".JK", ""),
      distance_tp1: Math.max(0, h.distance_tp1_pct),
      distance_sl: Math.abs(h.distance_sl_pct),
      current_price: h.current_price,
      tp1: h.target_tp1,
      sl: h.stop_loss
    }));
  }, [holdings]);

  // Closed trades statistics
  const closedStats = useMemo(() => {
    if (!closedTrades.length) return { winRate: 0, totalPnl: 0, winCount: 0, lossCount: 0 };
    const wins = closedTrades.filter((t) => (t.realized_pnl_rp || 0) > 0);
    const winRate = Math.round((wins.length / closedTrades.length) * 100);
    const totalPnl = closedTrades.reduce((s, t) => s + (t.realized_pnl_rp || 0), 0);
    return {
      winRate,
      totalPnl,
      winCount: wins.length,
      lossCount: closedTrades.length - wins.length
    };
  }, [closedTrades]);

  // Handle Add Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol || !formPrice || !formLot) {
      showToast("Mohon lengkapi kode saham, harga beli, dan lot", "error");
      return;
    }
    setSubmittingAdd(true);
    try {
      const res = await api.addPortfolioHolding({
        symbol: formSymbol,
        entry_price: parseFloat(formPrice),
        shares_lot: parseInt(formLot, 10),
        target_tp1: formTp1 ? parseFloat(formTp1) : undefined,
        stop_loss: formSl ? parseFloat(formSl) : undefined,
        notes: formNotes || undefined
      });
      showToast(res.message || "Saham berhasil ditambahkan ke portofolio", "success");
      setIsAddOpen(false);
      setFormSymbol("");
      setFormPrice("");
      setFormLot("10");
      setFormTp1("");
      setFormSl("");
      setFormNotes("");
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal menambahkan posisi", "error");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Sell Modal
  const handleOpenSell = (holding: HoldingItem) => {
    setSelectedHolding(holding);
    setSellLot(holding.shares_lot);
    setSellPrice(holding.current_price);
    setSellReason(
      holding.floating_pnl_pct >= 0
        ? "Realisasi Profit Sesuai Target TP"
        : "Disiplin Cut Loss Manajemen Risiko"
    );
    setIsSellOpen(true);
  };

  // Handle Sell Submit
  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHolding) return;
    setSubmittingSell(true);
    try {
      const res = await api.sellPortfolioHolding({
        holding_id: selectedHolding.id,
        exit_price: sellPrice,
        shares_lot: sellLot,
        reason: sellReason
      });
      showToast(res.message || "Penjualan berhasil dicatat", "success");
      setIsSellOpen(false);
      setSelectedHolding(null);
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal mengeksekusi penjualan", "error");
    } finally {
      setSubmittingSell(false);
    }
  };

  // Handle Delete
  const handleDeleteHolding = async (holding: HoldingItem) => {
    if (!confirm(`Hapus posisi #${holding.symbol} dari portofolio?`)) return;
    try {
      const res = await api.deletePortfolioHolding(holding.id);
      showToast(res.message || "Posisi dihapus", "success");
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus posisi", "error");
    }
  };

  // Handle Reset Demo
  const handleResetDemo = async () => {
    if (!confirm("Reset portofolio ke acuan trading journal awal?")) return;
    try {
      const res = await api.resetDemoPortfolio();
      showToast(res.message || "Portofolio di-reset ke acuan awal.", "success");
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal reset.", "error");
    }
  };

  // Unique sectors
  const availableSectors = Array.from(new Set(holdings.map((h) => h.sector)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              AI QUANTITATIVE PORTFOLIO
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Integrasi Data Jurnal Riil & Evaluasi Multi-Pilar Terkini
            </span>
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-slate-100 flex items-center gap-2 mt-1.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>Dasbor Portofolio Saham & AI Advisor</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Dasbor portofolio interaktif berbasis data riil. Memantau valuasi ekuitas, visualisasi alokasi kas vs saham,
            kinerja PnL per emiten, serta panduan harian 4 pilar: <strong className="text-emerald-300">Take Profit</strong>,{" "}
            <strong className="text-blue-300">Hold</strong>, <strong className="text-cyan-300">Tambah Lot</strong>, atau{" "}
            <strong className="text-rose-300">Cut Loss</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => fetchPortfolio(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Refresh evaluasi terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{refreshing ? "Menganalisis..." : "Refresh Data"}</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all"
            title="Reset acuan portofolio ke contoh awal"
          >
            Reset Contoh
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all ml-auto sm:ml-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Saham</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total NAV */}
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Total Nilai Portofolio (NAV)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatRupiah(summary.total_nav || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Kas: {formatRupiah(summary.cash_balance || 0)} ({summary.cash_ratio_pct || 0}%)</span>
            <span>Saham: {summary.stock_ratio_pct || 0}%</span>
          </div>
        </div>

        {/* Floating PnL */}
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Floating PnL (Saham Terbuka)</span>
            {(summary.floating_pnl_rp || 0) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              (summary.floating_pnl_rp || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatRupiah(summary.floating_pnl_rp || 0)}
          </div>
          <div className="text-[11px] font-mono flex items-center gap-1">
            <span
              className={`font-bold ${
                (summary.floating_pnl_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatPercent(summary.floating_pnl_pct || 0)}
            </span>
            <span className="text-slate-500">dari modal saham Rp {formatRupiah(summary.total_invested || 0)}</span>
          </div>
        </div>

        {/* Realized PnL */}
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Profit Terealisasi (Closed)</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              (summary.total_realized_pnl_rp || 0) >= 0 ? "text-cyan-300" : "text-rose-400"
            }`}
          >
            {formatRupiah(summary.total_realized_pnl_rp || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>{data?.closed_trades_count || closedTrades.length} posisi closed</span>
            <span className="text-emerald-400 font-bold">Win Rate {closedStats.winRate}%</span>
          </div>
        </div>

        {/* Portfolio Health Score */}
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1.5">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Skor Kesehatan Portofolio</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300">
              {summary.portfolio_health_score || 0}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
            <span className="ml-auto text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {summary.portfolio_health_grade || "OPTIMAL"}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, summary.portfolio_health_score || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              viewTab === "dashboard"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dasbor & Grafik Interaktif</span>
          </button>

          <button
            onClick={() => setViewTab("holdings")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              viewTab === "holdings"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Daftar Posisi & Analisis 4-Pilar ({holdings.length})</span>
          </button>

          <button
            onClick={() => setViewTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              viewTab === "history"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Realisasi Trade ({closedTrades.length})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 ml-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Update Terakhir: {summary.evaluation_date || "-"} • {summary.evaluation_time || "-"}</span>
        </div>
      </div>

      {/* TAB 1: DASBOR & GRAFIK INTERAKTIF */}
      {viewTab === "dashboard" && (
        <div className="space-y-6">
          {/* Top Charts Row: Asset Allocation & PnL Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Donut Allocation */}
            <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-400" />
                    <span>Komposisi & Alokasi Portofolio</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Distribusi modal kas cair vs bobot emiten saham
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPieMode("stock")}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      pieMode === "stock" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Per Saham
                  </button>
                  <button
                    onClick={() => setPieMode("asset")}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                      pieMode === "asset" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Kas vs Saham
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                {assetPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={assetPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {assetPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "11px" }}
                        formatter={(val: any) => [formatRupiah(Number(val)), "Nilai"]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-mono text-slate-500">
                    Tidak ada data alokasi
                  </div>
                )}
              </div>

              <div className="mt-2 pt-3 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 block">Total Ekuitas</span>
                  <span className="text-slate-200 font-bold">{formatRupiah(summary.total_nav || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Kas Siap Pakai</span>
                  <span className="text-emerald-400 font-bold">{formatRupiah(summary.cash_balance || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Saham Terbuka</span>
                  <span className="text-indigo-400 font-bold">{formatRupiah(summary.total_market_value || 0)}</span>
                </div>
              </div>
            </div>

            {/* Chart 2: PnL Performance per stock */}
            <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Floating PnL per Emiten (%)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Imbal hasil berjalan posisi aktif terhadap harga beli awal
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  {holdings.length} Saham Aktif
                </span>
              </div>

              <div className="h-64 w-full">
                {pnlBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pnlBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="symbol" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "11px" }}
                        formatter={(val: any, name: any, item: any) => [
                          `${formatPercent(Number(val))} (${formatRupiah(item.payload.pnl_rp)})`,
                          "Floating PnL"
                        ]}
                      />
                      <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                      <Bar dataKey="pnl_pct" radius={[4, 4, 0, 0]}>
                        {pnlBarData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.is_positive ? "#10b981" : "#f43f5e"}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-mono text-slate-500">
                    Tidak ada posisi saham aktif
                  </div>
                )}
              </div>

              <div className="mt-2 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Total Floating:</span>
                <span className={`font-bold ${(summary.floating_pnl_rp || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatRupiah(summary.floating_pnl_rp || 0)} ({formatPercent(summary.floating_pnl_pct || 0)})
                </span>
              </div>
            </div>
          </div>

          {/* Full-Width Chart: Portfolio Equity Growth Curve */}
          <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Kurva Pertumbuhan Ekuitas & NAV Portofolio</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Progres akumulasi modal dari modal awal Rp 100.000.000 hingga valuasi saat ini
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  Total Realized: <strong className="text-cyan-300">{formatRupiah(summary.total_realized_pnl_rp || 0)}</strong>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {equityHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: "#64748b" }}
                      tickLine={false}
                      tickFormatter={(d) => String(d).slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#64748b" }}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}Jt`}
                    />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(val: any, name: any, item: any) => [
                        `${formatRupiah(Number(val))} (NAV: ${item.payload.nav})`,
                        item.payload.label || "Nilai Portofolio"
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="portfolio_value"
                      name="Ekuitas"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#portfolioGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs font-mono text-slate-500">
                  Data kurva ekuitas belum tersedia
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Target Proximity & Sector Exposure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Target Proximity */}
            <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>Matriks Jarak ke Target TP1 vs Stop Loss</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Persentase kenaikan yang dibutuhkan menuju TP1 vs toleransi batas Cut Loss
                </p>
              </div>

              <div className="space-y-3">
                {proximityData.map((item) => (
                  <div key={item.symbol} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200">#{item.symbol}</span>
                      <span className="text-slate-400">Harga: {formatRupiah(item.current_price)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-1.5 flex justify-between">
                        <span className="text-emerald-400">Target TP1: {formatRupiah(item.tp1)}</span>
                        <span className="text-emerald-300 font-bold">+{item.distance_tp1.toFixed(1)}%</span>
                      </div>
                      <div className="bg-rose-950/20 border border-rose-500/20 rounded p-1.5 flex justify-between">
                        <span className="text-rose-400">Stop Loss: {formatRupiah(item.sl)}</span>
                        <span className="text-rose-300 font-bold">-{item.distance_sl.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector Exposure */}
            <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  <span>Eksposur Saham per Sektor Industri</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Diversifikasi penempatan modal pada sektor bursa BEI
                </p>
              </div>

              <div className="space-y-3">
                {sectorAlloc.map((sec, idx) => (
                  <div key={sec.sector} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">{sec.sector}</span>
                      <span className="text-slate-400">
                        {formatRupiah(sec.market_value)} ({sec.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, sec.pct)}%`,
                          backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Kepatuhan Syariah: <strong className="text-emerald-300">{summary.sharia_ratio_pct || 100}%</strong> dari saham portofolio memenuhi kaidah ISSI/DES.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR POSISI & ANALISIS 4-PILAR */}
      {viewTab === "holdings" && (
        <div className="space-y-6">
          {/* Action Recommendation Summary Bar */}
          <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono text-slate-300 font-bold">
                Filter Rekomendasi Hari Ini:
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setRecFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  recFilter === "ALL"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Semua ({holdings.length})
              </button>

              <button
                onClick={() => setRecFilter("TP")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  recFilter === "TP"
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                    : "bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ambil Profit / TP ({(recSummary.TAKE_PROFIT || 0) + (recSummary.TAKE_PROFIT_SOON || 0)})</span>
              </button>

              <button
                onClick={() => setRecFilter("HOLD")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  recFilter === "HOLD"
                    ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                    : "bg-slate-900 text-blue-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Pertahankan / Hold ({recSummary.HOLD || 0})</span>
              </button>

              <button
                onClick={() => setRecFilter("BUY")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  recFilter === "BUY"
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-900 text-cyan-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tambah Lot / Buy ({recSummary.ADD_LOT || 0})</span>
              </button>

              <button
                onClick={() => setRecFilter("CUT_LOSS")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  recFilter === "CUT_LOSS"
                    ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                    : "bg-slate-900 text-rose-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cut Loss ({(recSummary.CUT_LOSS || 0) + (recSummary.REDUCE || 0)})</span>
              </button>
            </div>
          </div>

          {/* Search & Sector Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode saham / sektor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {availableSectors.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-mono">Sektor:</span>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Sektor</option>
                  {availableSectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Holdings Cards List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Memproses evaluasi multi-analisis 4 pilar saham...</span>
            </div>
          ) : filteredHoldings.length === 0 ? (
            <div className="p-12 text-center bg-cardBg rounded-2xl border border-slate-800 space-y-3">
              <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-mono text-slate-400">Tidak ada saham yang sesuai dengan filter.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Saham Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHoldings.map((h) => {
                const rec = h.recommendation;
                const tech = h.technical_indicators;
                const bandar = h.bandarmologi;
                const ai = h.ai_score;

                const isProfit = h.floating_pnl_rp >= 0;

                return (
                  <div
                    key={h.id}
                    className="p-5 rounded-2xl bg-cardBg border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                  >
                    {/* Card Header: Stock identity + Quick numbers */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                          {h.symbol.replace(".JK", "").slice(0, 4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-100 font-mono">
                              {h.symbol.replace(".JK", "")}
                            </span>
                            {h.is_sharia && <ShariaBadge isSharia={true} />}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {h.sector}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{h.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Current price & day change */}
                        <div className="text-right font-mono">
                          <div className="text-base font-bold text-slate-100">
                            {formatRupiah(h.current_price)}
                          </div>
                          <div
                            className={`text-xs flex items-center gap-0.5 justify-end font-semibold ${
                              h.day_change_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {h.day_change_pct >= 0 ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            <span>{formatPercent(h.day_change_pct)} Hari Ini</span>
                          </div>
                        </div>

                        {/* Floating PnL */}
                        <div className="text-right font-mono pl-4 border-l border-slate-800">
                          <div
                            className={`text-base font-bold ${
                              isProfit ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatRupiah(h.floating_pnl_rp)}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              isProfit ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatPercent(h.floating_pnl_pct)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Banner Recommended by AI */}
                    <div
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                        rec.action === "TAKE_PROFIT" || rec.action === "TAKE_PROFIT_SOON"
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                          : rec.action === "ADD_LOT"
                          ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
                          : rec.action === "HOLD"
                          ? "bg-blue-950/30 border-blue-500/40 text-blue-200"
                          : "bg-rose-950/30 border-rose-500/40 text-rose-200"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {rec.action === "TAKE_PROFIT" || rec.action === "TAKE_PROFIT_SOON" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : rec.action === "ADD_LOT" ? (
                          <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        ) : rec.action === "HOLD" ? (
                          <Target className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                              {rec.action_label}
                            </span>
                            <span className="text-[10px] font-mono opacity-80">
                              Urgensi: <strong>{rec.urgency}</strong>
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed opacity-90 mt-1">{rec.rationale}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenSell(h)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1 transition-all"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                          <span>Jual / Realisasi</span>
                        </button>
                        <button
                          onClick={() => handleDeleteHolding(h)}
                          className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-rose-900/40 text-slate-500 hover:text-rose-300 border border-slate-800 transition-all"
                          title="Hapus dari daftar pantau portofolio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 4-Pillar Grid Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                      {/* 1. Teknikal & Tren */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                          <span>1. TEKNIKAL & TREN</span>
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bias Tren:</span>
                          <span className="font-bold text-slate-200">{tech.trend_bias}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">RSI (14):</span>
                          <span
                            className={`font-bold ${
                              tech.rsi_14 > 70
                                ? "text-rose-400"
                                : tech.rsi_14 < 35
                                ? "text-emerald-400"
                                : "text-slate-300"
                            }`}
                          >
                            {tech.rsi_14} ({tech.rsi_status})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">MACD:</span>
                          <span className="text-slate-300">{tech.macd_cross}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>MA20: {tech.ma20}</span>
                          <span>MA50: {tech.ma50}</span>
                        </div>
                      </div>

                      {/* 2. Bandarmologi & Flow */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                          <span>2. BANDARMOLOGI</span>
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Status Akum:</span>
                          <span
                            className={`font-bold ${
                              bandar.is_accumulating ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {bandar.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rasio Volume:</span>
                          <span className="text-slate-200 font-bold">{bandar.volume_ratio}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Foreign Flow:</span>
                          <span className="text-slate-300">{bandar.foreign_flow}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>Institusi dominan dalam 5 hari</span>
                        </div>
                      </div>

                      {/* 3. AI Score & Shield */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                          <span>3. AI SCORE & SHIELD</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Skor AI:</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {ai.score} / 100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Proteksi Fraud:</span>
                          <span className="font-bold text-slate-300">{ai.safety_badge}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gorengan:</span>
                          <span className={ai.is_gorengan ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {ai.is_gorengan ? "WASPADA TINGGI" : "AMAN (BLUECHIP/SOLID)"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>Audit anomali orderbook lolos</span>
                        </div>
                      </div>

                      {/* 4. Target & Risiko Proximity */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                          <span>4. TARGET & CUT LOSS</span>
                          <Target className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Beli / Posisi:</span>
                          <span className="text-slate-300">
                            {formatRupiah(h.entry_price)} ({h.shares_lot} lot)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Target TP1:</span>
                          <span className="text-emerald-400 font-bold">
                            {formatRupiah(h.target_tp1)} ({h.distance_tp1_pct > 0 ? `+${h.distance_tp1_pct}%` : `${h.distance_tp1_pct}%`})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Stop Loss:</span>
                          <span className="text-rose-400 font-bold">
                            {formatRupiah(h.stop_loss)} ({h.distance_sl_pct}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>Modal: {formatRupiah(h.invested_capital)}</span>
                          <span>NAV: {formatRupiah(h.market_value)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RIWAYAT REALISASI TRADE */}
      {viewTab === "history" && (
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-mono font-bold text-sm text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Log Transaksi Ditutup & Realisasi Profit/Loss</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Rekaman historis penjualan saham dari trading journal riil
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Win Rate: <strong className="text-emerald-400">{closedStats.winRate}%</strong> ({closedStats.winCount}W / {closedStats.lossCount}L)
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Total PnL: <strong className="text-cyan-300">{formatRupiah(closedStats.totalPnl)}</strong>
              </span>
            </div>
          </div>

          {closedTrades.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              Belum ada riwayat transaksi yang ditutup.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="pb-2.5 font-bold">Emiten</th>
                    <th className="pb-2.5 font-bold">Tanggal Masuk</th>
                    <th className="pb-2.5 font-bold">Tanggal Keluar</th>
                    <th className="pb-2.5 font-bold text-right">Harga Beli</th>
                    <th className="pb-2.5 font-bold text-right">Harga Jual</th>
                    <th className="pb-2.5 font-bold text-right">Volume</th>
                    <th className="pb-2.5 font-bold text-right">Realisasi (Rp)</th>
                    <th className="pb-2.5 font-bold text-right">Return (%)</th>
                    <th className="pb-2.5 font-bold pl-3">Alasan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {closedTrades.map((t, idx) => {
                    const isWin = (t.realized_pnl_rp || 0) >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-2.5 font-bold text-slate-200">
                          {t.symbol.replace(".JK", "")}
                        </td>
                        <td className="py-2.5 text-slate-400">{t.entry_date || "-"}</td>
                        <td className="py-2.5 text-slate-400">{t.exit_date || "-"}</td>
                        <td className="py-2.5 text-right text-slate-300">{formatRupiah(t.entry_price)}</td>
                        <td className="py-2.5 text-right text-slate-300">{formatRupiah(t.exit_price)}</td>
                        <td className="py-2.5 text-right text-slate-400">{t.shares_lot} lot</td>
                        <td className={`py-2.5 text-right font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                          {formatRupiah(t.realized_pnl_rp)}
                        </td>
                        <td className={`py-2.5 text-right font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                          {formatPercent(t.realized_pnl_pct)}
                        </td>
                        <td className="py-2.5 pl-3 text-slate-400 text-[11px] max-w-xs truncate">
                          {t.notes || "Realisasi Portofolio"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH SAHAM */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cardBg border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Tambah Saham ke Portofolio</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Kode Saham (Contoh: BBCA, ASII, BMRI)
                </label>
                <input
                  type="text"
                  required
                  placeholder="BBCA"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Harga Beli (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="9500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Jumlah Lot (1 lot = 100 lb)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formLot}
                    onChange={(e) => setFormLot(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Target TP1 (Opsional, +7%)
                  </label>
                  <input
                    type="number"
                    placeholder="Otomatis"
                    value={formTp1}
                    onChange={(e) => setFormTp1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Stop Loss (Opsional, -5%)
                  </label>
                  <input
                    type="number"
                    placeholder="Otomatis"
                    value={formSl}
                    onChange={(e) => setFormSl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Catatan Rencana Transaksi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Swing akumulasi breakout MA20"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {formPrice && formLot && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Estimasi Modal Diperlukan:</span>
                    <span className="text-slate-200 font-bold">
                      {formatRupiah(parseFloat(formPrice || "0") * parseInt(formLot || "0", 10) * 100 * 1.0015)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Kas Tersedia:</span>
                    <span>{formatRupiah(summary.cash_balance || 0)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingAdd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  <span>Simpan Saham</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JUAL SAHAM */}
      {isSellOpen && selectedHolding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cardBg border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>Jual Posisi #{selectedHolding.symbol}</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Maksimal tersedia: {selectedHolding.shares_lot} lot
                </span>
              </div>
              <button
                onClick={() => setIsSellOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSellSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Jumlah Lot Dijual
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedHolding.shares_lot}
                    value={sellLot}
                    onChange={(e) => setSellLot(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Alasan Penjualan / Eksekusi
                </label>
                <select
                  value={sellReason}
                  onChange={(e) => setSellReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Realisasi Target Profit TP1">Realisasi Target Profit TP1</option>
                  <option value="Realisasi Target Profit TP2">Realisasi Target Profit TP2</option>
                  <option value="Disiplin Cut Loss Manajemen Risiko">Disiplin Cut Loss Manajemen Risiko</option>
                  <option value="Rebalancing Portofolio / Amankan Kas">Rebalancing Portofolio / Amankan Kas</option>
                  <option value="Trailing Stop Kena Batas">Trailing Stop Kena Batas</option>
                </select>
              </div>

              {/* Realization preview */}
              {(() => {
                const grossProceeds = sellPrice * sellLot * 100;
                const netProceeds = grossProceeds * (1 - 0.0025);
                const costBasis = selectedHolding.entry_price * sellLot * 100;
                const estPnl = netProceeds - costBasis;
                const estPnlPct = costBasis > 0 ? (estPnl / costBasis) * 100 : 0;
                return (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Perkiraan Kas Diterima:</span>
                      <span className="text-slate-200 font-bold">{formatRupiah(netProceeds)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Estimasi Realized PnL:</span>
                      <span className={`font-bold ${estPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatRupiah(estPnl)} ({formatPercent(estPnlPct)})
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSellOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSell}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingSell ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                  <span>Konfirmasi Jual</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
