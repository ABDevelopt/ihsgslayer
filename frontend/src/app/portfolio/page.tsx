"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  PieChart,
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
  Zap
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { formatRupiah, formatPercent } from "@/lib/utils";
import { useToast } from "@/components/Toast";

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recFilter, setRecFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  
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
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat portofolio:", err);
      showToast(err.message || "Gagal memuat data portofolio.", "error");
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
  const recSummary = data?.recommendation_summary || {};
  const sectorAllocations = data?.sector_allocation || [];

  // Filtered holdings
  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      const matchSearch =
        h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.sector.toLowerCase().includes(searchQuery.toLowerCase());
      
      const act = h.recommendation.action;
      let matchRec = true;
      if (recFilter === "TP") matchRec = act === "TAKE_PROFIT" || act === "TAKE_PROFIT_SOON";
      else if (recFilter === "HOLD") matchRec = act === "HOLD";
      else if (recFilter === "BUY") matchRec = act === "ADD_LOT" || act === "BUY";
      else if (recFilter === "CUT_LOSS") matchRec = act === "CUT_LOSS" || act === "REDUCE";

      const matchSector = sectorFilter === "ALL" || h.sector === sectorFilter;

      return matchSearch && matchRec && matchSector;
    });
  }, [holdings, searchQuery, recFilter, sectorFilter]);

  // Handle Add Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol || !formPrice || !formLot) {
      showToast("Mohon isi kode saham, harga beli, dan jumlah lot.", "error");
      return;
    }
    setSubmittingAdd(true);
    try {
      const p = parseFloat(formPrice);
      const res = await api.addPortfolioHolding({
        symbol: formSymbol.trim().toUpperCase(),
        entry_price: p,
        shares_lot: parseInt(formLot, 10),
        target_tp1: formTp1 ? parseFloat(formTp1) : undefined,
        stop_loss: formSl ? parseFloat(formSl) : undefined,
        notes: formNotes || undefined
      });
      showToast(res.message || "Saham berhasil ditambahkan ke portofolio.", "success");
      setIsAddOpen(false);
      // Reset form
      setFormSymbol("");
      setFormPrice("");
      setFormLot("10");
      setFormTp1("");
      setFormSl("");
      setFormNotes("");
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal menambahkan saham.", "error");
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
      showToast(res.message || "Penjualan berhasil dicatat.", "success");
      setIsSellOpen(false);
      setSelectedHolding(null);
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal mengeksekusi penjualan.", "error");
    } finally {
      setSubmittingSell(false);
    }
  };

  // Handle Delete
  const handleDeleteHolding = async (holding: HoldingItem) => {
    if (!confirm(`Hapus posisi #${holding.symbol} dari portofolio?`)) return;
    try {
      const res = await api.deletePortfolioHolding(holding.id);
      showToast(res.message || "Posisi dihapus.", "success");
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus posisi.", "error");
    }
  };

  // Handle Reset Demo
  const handleResetDemo = async () => {
    if (!confirm("Reset portofolio ke 4 saham contoh acuan awal (BBCA, ADRO, TLKM, BRIS)?")) return;
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
              AI PORTFOLIO ADVISOR
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Evaluasi Harian 4 Pilar & Rekomendasi Aksi Riil
            </span>
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-slate-100 flex items-center gap-2 mt-1.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>Portofolio Saham & Rekomendasi Harian</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Sistem penasihat kuantitatif yang memantau setiap saham Anda setiap hari secara otomatis.
            Mengkombinasikan sinyal Teknikal, Bandarmologi, AI Score, serta toleransi Stop Loss & Target TP
            untuk memandu keputusan: <strong className="text-emerald-300">Take Profit</strong>,{" "}
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
            <span>{refreshing ? "Menganalisis..." : "Refresh"}</span>
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
            <span>Saham: {summary.stock_ratio_pct || 0}%</span>
            <span>Kas: {summary.cash_ratio_pct || 0}%</span>
          </div>
        </div>

        {/* Floating PnL */}
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Floating PnL (Unrealized)</span>
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
            <span className="text-slate-500">dari modal Rp {formatRupiah(summary.total_invested || 0)}</span>
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
          <div className="text-[11px] text-slate-500 font-mono">
            {data?.closed_trades_count || 0} transaksi berhasil ditutup
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

      {/* Action Recommendation Summary Bar */}
      <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-mono text-slate-300 font-bold">
            Ringkasan Rekomendasi Hari Ini ({summary.evaluation_date || "-"} • {summary.evaluation_time || "-"}):
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

      {/* Holdings List / Cards */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            Menganalisis indikator teknikal & bandarmologi portofolio secara real-time...
          </p>
        </div>
      ) : filteredHoldings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-mono text-slate-300 font-bold">
            Tidak ada saham yang sesuai dengan filter
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ganti filter rekomendasi di atas atau tambahkan saham baru ke dalam portofolio Anda.
          </p>
          <button
            onClick={() => {
              setRecFilter("ALL");
              setSectorFilter("ALL");
              setSearchQuery("");
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHoldings.map((h) => {
            const isProfit = h.floating_pnl_rp >= 0;
            const rec = h.recommendation;
            const isRecSell = rec.action === "TAKE_PROFIT" || rec.action === "CUT_LOSS" || rec.action === "REDUCE";
            const isRecHold = rec.action === "HOLD";
            const isRecBuy = rec.action === "ADD_LOT";

            const bannerBg =
              rec.action === "TAKE_PROFIT"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : rec.action === "TAKE_PROFIT_SOON"
                ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                : rec.action === "CUT_LOSS" || rec.action === "REDUCE"
                ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                : rec.action === "ADD_LOT"
                ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200"
                : "bg-blue-950/40 border-blue-500/40 text-blue-200";

            const badgeBg =
              rec.action === "TAKE_PROFIT"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : rec.action === "TAKE_PROFIT_SOON"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : rec.action === "CUT_LOSS" || rec.action === "REDUCE"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : rec.action === "ADD_LOT"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-blue-500/20 text-blue-300 border-blue-500/40";

            return (
              <div
                key={h.id}
                className="p-5 rounded-2xl bg-cardBg border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-4"
              >
                {/* Stock Header & Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/analysis/${h.symbol}`}
                      className="text-lg font-bold font-mono text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>{h.symbol}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </Link>
                    <ShariaBadge isSharia={h.is_sharia} />
                    <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                      {h.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {h.sector}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Floating PnL Pill */}
                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 ${
                        isProfit
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{formatPercent(h.floating_pnl_pct)}</span>
                      <span className="font-normal opacity-80">({formatRupiah(h.floating_pnl_rp)})</span>
                    </div>

                    {/* Quick Delete */}
                    <button
                      onClick={() => handleDeleteHolding(h)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Hapus posisi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quantitative Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="text-[10px] text-slate-400">Harga Beli & Lot</div>
                    <div className="font-bold text-slate-200 mt-0.5">
                      {formatRupiah(h.entry_price)} &bull; {h.shares_lot} Lot
                    </div>
                    <div className="text-[10px] text-slate-500">Modal: {formatRupiah(h.invested_capital)}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="text-[10px] text-slate-400">Harga Terkini</div>
                    <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <span>{formatRupiah(h.current_price)}</span>
                      <span className={`text-[10px] ${h.day_change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        ({h.day_change_pct >= 0 ? "+" : ""}{h.day_change_pct}%)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Nilai: {formatRupiah(h.market_value)}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="text-[10px] text-slate-400">Target TP1</div>
                    <div className="font-bold text-cyan-300 mt-0.5">
                      {formatRupiah(h.target_tp1)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {h.distance_tp1_pct > 0 ? `${h.distance_tp1_pct}% lagi` : "Sudah Terlampaui"}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="text-[10px] text-slate-400">Batas Stop Loss</div>
                    <div className="font-bold text-rose-300 mt-0.5">
                      {formatRupiah(h.stop_loss)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {h.distance_sl_pct > 0 ? `${h.distance_sl_pct}% batas aman` : "TERKENA STOP LOSS"}
                    </div>
                  </div>

                  {/* 4 Multi-Analysis Pillars Badges */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="text-[10px] text-slate-400">Teknikal & RSI</div>
                    <div className="font-bold text-slate-300 mt-0.5 text-[11px] truncate">
                      {h.technical_indicators.trend_bias.replace("BULLISH_", "").replace("BEARISH_", "")}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      RSI 14: {h.technical_indicators.rsi_14} ({h.technical_indicators.rsi_status})
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900">
                    <div className="text-[10px] text-slate-400">Bandar & AI Score</div>
                    <div className="font-bold text-slate-300 mt-0.5 text-[11px] truncate">
                      {h.bandarmologi.status}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      AI Score: <span className="text-amber-300 font-bold">{h.ai_score.score}</span>
                    </div>
                  </div>
                </div>

                {/* Daily Action Recommendation Banner */}
                <div className={`p-4 rounded-xl border ${bannerBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold font-mono border ${badgeBg}`}>
                        {rec.action_label}
                      </span>
                      <span className="text-[10px] font-mono opacity-70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Rekomendasi Hari Ini: {rec.recommended_time}</span>
                      </span>
                      {rec.urgency === "HIGH" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-sans leading-relaxed pt-0.5">
                      {rec.rationale}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleOpenSell(h)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                        isRecSell
                          ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      <span>Jual / Ambil Profit</span>
                    </button>

                    <button
                      onClick={() => {
                        setFormSymbol(h.symbol);
                        setFormPrice(h.current_price.toString());
                        setFormLot("10");
                        setFormTp1(h.target_tp1.toString());
                        setFormSl(h.stop_loss.toString());
                        setIsAddOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all"
                    >
                      <span>Tambah Lot</span>
                    </button>

                    <Link
                      href={`/analysis/${h.symbol}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-mono"
                      title="Analisis 360°"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sektor Allocation & Diversification Overview */}
      {sectorAllocations.length > 0 && (
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Distribusi Alokasi Sektor Portofolio</span>
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Kepatuhan Syariah: <strong className="text-emerald-400">{summary.sharia_ratio_pct || 100}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {sectorAllocations.map((sec: any) => (
              <div
                key={sec.sector}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-bold">{sec.sector}</span>
                  <span className="text-emerald-400 font-bold">{sec.pct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, sec.pct)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Nilai: {formatRupiah(sec.market_value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Tambah Saham ke Portofolio */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Tambah Saham ke Portofolio</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Kode Saham (Emiten):</label>
                <input
                  type="text"
                  placeholder="Contoh: BBCA, ASII, ADRO"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Harga Beli Rata-Rata (Rp):</label>
                  <input
                    type="number"
                    placeholder="Contoh: 9800"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    min={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Jumlah Lot (1 Lot = 100):</label>
                  <input
                    type="number"
                    value={formLot}
                    onChange={(e) => setFormLot(e.target.value)}
                    required
                    min={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target TP1 (Opsional):</label>
                  <input
                    type="number"
                    placeholder="Auto +7%"
                    value={formTp1}
                    onChange={(e) => setFormTp1(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Stop Loss (Opsional):</label>
                  <input
                    type="number"
                    placeholder="Auto -5%"
                    value={formSl}
                    onChange={(e) => setFormSl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Catatan Strategi (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Swing break out resistance MA20"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {submittingAdd ? "Menyimpan..." : "Simpan ke Portofolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Eksekusi Jual / Realisasi PnL */}
      {isSellOpen && selectedHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2 font-sans">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Eksekusi Jual #{selectedHolding.symbol}</span>
              </h3>
              <button
                onClick={() => setIsSellOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSellSubmit} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Harga Beli:</span>
                  <span className="text-slate-200 font-bold">{formatRupiah(selectedHolding.entry_price)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Lot Dimiliki:</span>
                  <span className="text-slate-200 font-bold">{selectedHolding.shares_lot} Lot</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target TP1 / Stop Loss:</span>
                  <span className="text-slate-300">
                    TP {formatRupiah(selectedHolding.target_tp1)} &bull; SL {formatRupiah(selectedHolding.stop_loss)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Jumlah Lot yang Dijual (Maks: {selectedHolding.shares_lot}):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={selectedHolding.shares_lot}
                    value={sellLot}
                    onChange={(e) => setSellLot(parseInt(e.target.value, 10))}
                    className="flex-1 accent-emerald-400 h-1.5"
                  />
                  <span className="font-bold text-emerald-400 w-16 text-right">{sellLot} Lot</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Harga Jual Eksekusi (Rp):</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                  required
                  min={1}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Realized PnL Preview */}
              {(() => {
                const totalCost = selectedHolding.entry_price * sellLot * 100 * 1.0015;
                const netProceeds = sellPrice * sellLot * 100 * 0.9975;
                const pnl = netProceeds - totalCost;
                const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                const isWin = pnl >= 0;

                return (
                  <div className={`p-3 rounded-xl border ${isWin ? "bg-emerald-950/40 border-emerald-500/30" : "bg-rose-950/40 border-rose-500/30"}`}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Estimasi Realized PnL:</span>
                      <span className={`font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                        {formatRupiah(pnl)} ({formatPercent(pnlPct)})
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-slate-400 block mb-1">Alasan Penjualan:</label>
                <input
                  type="text"
                  value={sellReason}
                  onChange={(e) => setSellReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSellOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSell}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {submittingSell ? "Mengeksekusi..." : "Konfirmasi Jual"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
