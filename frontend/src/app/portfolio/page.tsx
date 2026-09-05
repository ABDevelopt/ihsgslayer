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
  Percent,
  Compass,
  Calculator,
  Flame,
  Award,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  RotateCcw,
  Scan,
  ChevronDown,
  PackageOpen,
  Cpu,
  Crosshair,
  Star,
  GanttChartSquare,
  ArrowRight
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
    grade?: string;
    cr3_pct?: number;
    cr5_pct?: number;
    bandar_vwap?: number;
    distance_to_bandar_pct?: number;
    is_golden_entry?: boolean;
    volume_ratio: number;
    foreign_flow: string;
    top_buyers?: string[];
    is_accumulating: boolean;
    summary_desc?: string;
  };
  ai_score: {
    score: number;
    safety_badge: string;
    is_gorengan: boolean;
  };
  odds_maker?: {
    win_probability_pct: number;
    loss_probability_pct: number;
    expected_value_pct: number;
    risk_reward_ratio: string;
    risk_reward_num: number;
    half_kelly_max_allocation_pct: number;
    odds_grade: string;
    grade_color: string;
    assessment: string;
    tested_regime: string;
    is_golden_entry_applied: boolean;
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
  const [viewTab, setViewTab] = useState<"dashboard" | "holdings" | "history" | "cashflows" | "screener">("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [recFilter, setRecFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [pieMode, setPieMode] = useState<"asset" | "stock">("stock");

  // Screener Integration state
  const [screenerTab, setScreenerTab] = useState<"confluence" | "bpjs" | "bsjp" | "pre_ara" | "smart_pick" | "multibagger" | "buy_signals">("confluence");
  const [screenerData, setScreenerData] = useState<Record<string, any>>({});
  const [screenerLoading, setScreenerLoading] = useState<boolean>(false);
  const [screenerLoaded, setScreenerLoaded] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isSellOpen, setIsSellOpen] = useState<boolean>(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [selectedHolding, setSelectedHolding] = useState<HoldingItem | null>(null);

  // Top-Up form
  const [topUpAmount, setTopUpAmount] = useState<string>("5000000");
  const [topUpNotes, setTopUpNotes] = useState<string>("Setor Kas RDN via BCA");
  const [submittingTopUp, setSubmittingTopUp] = useState<boolean>(false);

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1000000");
  const [withdrawNotes, setWithdrawNotes] = useState<string>("Tarik Saldo ke Rekening Pribadi");
  const [submittingWithdraw, setSubmittingWithdraw] = useState<boolean>(false);

  // Add form state
  const [formSymbol, setFormSymbol] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formLot, setFormLot] = useState<string>("10");
  const [formTp1, setFormTp1] = useState<string>("");
  const [formSl, setFormSl] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [submittingAdd, setSubmittingAdd] = useState<boolean>(false);
  const [calculatingRiskParity, setCalculatingRiskParity] = useState<boolean>(false);
  const [riskParityInfo, setRiskParityInfo] = useState<any>(null);

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

  // Fetch a single screener's data
  const fetchScreener = async (tab: string, forceRefresh = false) => {
    if (screenerLoaded[tab] && !forceRefresh) return;
    setScreenerLoading(true);
    try {
      let res: any = null;
      if (tab === "confluence") res = await api.getMultiScreenerConfluence(2, 55);
      else if (tab === "bpjs") res = await api.getBPJSCandidates(60);
      else if (tab === "bsjp") res = await api.getBSJPCandidates(50);
      else if (tab === "pre_ara") res = await api.getPreARACandidates(65);
      else if (tab === "smart_pick") res = await api.getSmartPickStocks();
      else if (tab === "multibagger") res = await api.getMultibaggerCandidates(60);
      else if (tab === "buy_signals") res = await api.getBuySignals(68);
      if (res) {
        setScreenerData(prev => ({ ...prev, [tab]: res }));
        setScreenerLoaded(prev => ({ ...prev, [tab]: true }));
      }
    } catch (err: any) {
      showToast(err.message || `Gagal memuat screener ${tab}`, "error");
    } finally {
      setScreenerLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const summary = data?.summary || {};
  const holdings: HoldingItem[] = data?.holdings || [];
  const closedTrades: any[] = data?.closed_trades || [];
  const cashFlows: any[] = data?.cash_flows || [];
  const recSummary = data?.recommendation_summary || {};
  const sectorAlloc: any[] = data?.sector_allocation || [];
  const equityHistory: any[] = data?.equity_history || [];
  const marketRegime = data?.market_regime || null;

  // Auto-load screener data when switching to screener tab or switching screener sub-tab
  useEffect(() => {
    if (viewTab === "screener") {
      fetchScreener(screenerTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewTab, screenerTab]);

  // Pre-fill Add Holding modal from screener candidate
  const handleAddFromScreener = (candidate: any) => {
    const sym = (candidate.symbol || "").replace(".JK", "");
    const price = candidate.current_price || candidate.price || 0;
    const tp1 = candidate.target_tp1 || candidate.predicted_tp1_price || Math.round(price * 1.07);
    const sl = candidate.stop_loss || candidate.predicted_stop_loss_price || Math.round(price * 0.95);
    const notes = candidate.rationale || candidate.pre_ara_rationale || `Sinyal screener: ${candidate.active_patterns?.join(", ") || ""}`;
    setFormSymbol(sym);
    setFormPrice(String(Math.round(price)));
    setFormTp1(String(Math.round(tp1)));
    setFormSl(String(Math.round(sl)));
    setFormNotes(String(notes).slice(0, 100));
    setFormLot("10");
    setRiskParityInfo(null);
    setIsAddOpen(true);
  };


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
      } else if (recFilter === "GOLDEN") {
        matchRec = h.bandarmologi.is_golden_entry === true;
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

  // Handle Top-Up Submit
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) {
      showToast("Masukkan nominal top-up yang valid", "error");
      return;
    }
    setSubmittingTopUp(true);
    try {
      const res = await api.topUpPortfolioCash(amt, topUpNotes);
      showToast(res.message || "Top-up kas RDN berhasil", "success");
      setIsTopUpOpen(false);
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal melakukan top-up", "error");
    } finally {
      setSubmittingTopUp(false);
    }
  };

  // Handle Withdraw Submit
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      showToast("Masukkan nominal penarikan yang valid", "error");
      return;
    }
    if (amt > (summary.cash_balance || 0)) {
      showToast("Nominal penarikan melebihi saldo kas RDN yang tersedia", "error");
      return;
    }
    setSubmittingWithdraw(true);
    try {
      const res = await api.withdrawPortfolioCash(amt, withdrawNotes);
      showToast(res.message || "Penarikan kas RDN berhasil", "success");
      setIsWithdrawOpen(false);
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal melakukan penarikan", "error");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Calculate Risk Parity Lot
  const handleCalculateRiskParity = async () => {
    const price = parseFloat(formPrice);
    let sl = parseFloat(formSl);
    if (!price || price <= 0) {
      showToast("Masukkan harga beli terlebih dahulu", "error");
      return;
    }
    if (!sl || sl <= 0) {
      sl = Math.round(price * 0.95);
      setFormSl(String(sl));
    }
    setCalculatingRiskParity(true);
    try {
      const res = await api.getRiskParitySizing(price, sl, 1.0);
      if (res && res.status === "success" && res.data) {
        const sizing = res.data;
        setFormLot(String(sizing.recommended_lots));
        setRiskParityInfo(sizing);
        showToast(`Ukuran lot optimal berbasis risiko 1% NAV dihitung: ${sizing.recommended_lots} lot`, "success");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal menghitung lot sizing", "error");
    } finally {
      setCalculatingRiskParity(false);
    }
  };

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
      setRiskParityInfo(null);
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

  // Handle Reset Portfolio (Mulai dari Awal)
  const handleResetPortfolio = async () => {
    if (!confirm("Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat portofolio dan mulai dari awal?\n\nSemua posisi aktif, riwayat transaksi tutup, dan mutasi kas akan dikosongkan. Saldo kas akan diatur ulang ke Rp 100.000.000.")) return;
    try {
      const res = await api.resetPortfolio();
      showToast(res.message || "Portofolio berhasil dibersihkan untuk mulai dari awal.", "success");
      fetchPortfolio(true);
    } catch (err: any) {
      showToast(err.message || "Gagal mereset portofolio.", "error");
    }
  };

  // Handle Reset Demo
  const handleResetDemo = async () => {
    if (!confirm("Reset portofolio ke acuan demo trading journal?")) return;
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
              QUANTITATIVE PORTFOLIO v3.0
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Top-Up & Tarik Saldo · Deep Bandarmologi · Odds Maker
            </span>
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-slate-100 flex items-center gap-2 mt-1.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>Dasbor Portofolio Saham & AI Advisor</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Kelola modal kas RDN secara fleksibel (Top-Up / Tarik Dana), pantau valuasi ekuitas riil, 
            dan eksekusi keputusan harian berbasis estimasi <strong>Bandar VWAP</strong>, <strong>Pre-Trade Odds (+EV)</strong>, 
            serta <strong>Rezim Pasar IHSG</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsTopUpOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            title="Setor / Tambah Kas RDN"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>Top-Up Modal</span>
          </button>

          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Tarik Saldo Kas RDN"
          >
            <ArrowUpCircle className="w-4 h-4 text-amber-400" />
            <span>Tarik Modal</span>
          </button>

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
            onClick={handleResetPortfolio}
            disabled={refreshing || loading}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Hapus riwayat dan mulai dari awal (Rp 100.000.000)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Mulai dari Awal</span>
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

      {/* MARKET REGIME ADAPTIVE BANNER */}
      {marketRegime && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          marketRegime.badge_color === "emerald"
            ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-200"
            : marketRegime.badge_color === "amber"
            ? "bg-amber-950/25 border-amber-500/40 text-amber-200"
            : "bg-rose-950/25 border-rose-500/40 text-rose-200"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-black/40 shrink-0 mt-0.5">
              <Compass className={`w-5 h-5 ${
                marketRegime.badge_color === "emerald" ? "text-emerald-400" : marketRegime.badge_color === "amber" ? "text-amber-400" : "text-rose-400"
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  REZIM IHSG: {marketRegime.regime}
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  Keyakinan: <strong>{marketRegime.confidence_pct}%</strong> · IHSG: <strong>{marketRegime.ihsg_metrics?.price?.toLocaleString("id-ID")}</strong>
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-2xl">{marketRegime.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono shrink-0 bg-black/30 p-2.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 block">Alokasi Ideal:</span>
              <span className="font-bold">Kas {marketRegime.recommended_cash_pct}% · Saham {marketRegime.recommended_stock_pct}%</span>
            </div>
            <div className="pl-3 border-l border-white/15">
              <span className="text-[10px] text-slate-400 block">Fokus Strategi:</span>
              <span className="font-bold text-emerald-300">{marketRegime.primary_strategies?.slice(0, 2).join(", ")}</span>
            </div>
          </div>
        </div>
      )}

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
            <span>Kas RDN: <strong className="text-emerald-400">{formatRupiah(summary.cash_balance || 0)}</strong> ({summary.cash_ratio_pct || 0}%)</span>
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
        <div className="flex items-center gap-2 flex-wrap">
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
            <span>Daftar Posisi ({holdings.length})</span>
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
            <span>Riwayat Trade Closed ({closedTrades.length})</span>
          </button>

          <button
            onClick={() => setViewTab("cashflows")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              viewTab === "cashflows"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Mutasi Modal RDN ({cashFlows.length})</span>
          </button>

          <button
            onClick={() => setViewTab("screener")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              viewTab === "screener"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-lg shadow-violet-500/10"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Scan className="w-4 h-4 text-violet-400" />
            <span>Screener &amp; Rekomendasi</span>
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
                  Progres akumulasi modal dari modal awal hingga valuasi saat ini
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
                Filter Rekomendasi:
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
                onClick={() => setRecFilter("GOLDEN")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  recFilter === "GOLDEN"
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                    : "bg-slate-900 text-amber-400 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Golden Entry ({holdings.filter((h) => h.bandarmologi?.is_golden_entry).length})</span>
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
              <span>Memproses evaluasi multi-analisis 4 pilar kuantitatif...</span>
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
                const odds = h.odds_maker;

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-slate-100 font-mono">
                              {h.symbol.replace(".JK", "")}
                            </span>
                            {h.is_sharia && <ShariaBadge isSharia={true} />}
                            {bandar.is_golden_entry && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                <Flame className="w-3 h-3 text-amber-400" />
                                <span>GOLDEN ENTRY (MODAL BANDAR)</span>
                              </span>
                            )}
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
                            {odds && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-emerald-300 border border-emerald-500/30">
                                Odds: <strong>{odds.win_probability_pct}% Win</strong> · EV: <strong>+{odds.expected_value_pct}%</strong>
                              </span>
                            )}
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

                      {/* 2. Deep Bandarmologi */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                          <span>2. DEEP BANDARMOLOGI</span>
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bandar VWAP:</span>
                          <span className="font-bold text-emerald-400">
                            {bandar.bandar_vwap ? formatRupiah(bandar.bandar_vwap) : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Konsentrasi CR3:</span>
                          <span className="text-slate-200 font-bold">{bandar.cr3_pct || 50}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Jarak Modal Bandar:</span>
                          <span className={`font-bold ${(bandar.distance_to_bandar_pct || 0) <= 2.5 ? "text-emerald-300" : "text-amber-300"}`}>
                            {(bandar.distance_to_bandar_pct || 0) > 0 ? `+${bandar.distance_to_bandar_pct}%` : `${bandar.distance_to_bandar_pct}%`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 truncate">
                          <span>Top Buyers: {bandar.top_buyers?.join(", ") || "Institusi"}</span>
                        </div>
                      </div>

                      {/* 3. Odds Maker & AI Score */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                          <span>3. PRE-TRADE ODDS & AI</span>
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Win Probability:</span>
                          <span className="font-bold text-emerald-400">
                            {odds?.win_probability_pct || 70}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expected Value (EV):</span>
                          <span className="font-bold text-cyan-300">
                            +{odds?.expected_value_pct || 3.0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Skor AI Kuantitatif:</span>
                          <span className="font-bold text-slate-200">{ai.score} / 100</span>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>Grade: <strong className="text-emerald-300">{odds?.odds_grade || "STRONG_EDGE"}</strong></span>
                        </div>
                      </div>

                      {/* 4. Target & Cut Loss */}
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

      {/* TAB 4: MUTASI ARUS KAS RDN (TOP-UP & TARIK SALDO) */}
      {viewTab === "cashflows" && (
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-mono font-bold text-sm text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Riwayat Mutasi Modal Kas RDN (Stockbit-Style)</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Catatan setoran modal (Top-Up) dan penarikan saldo kas akun Anda
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>+ Top-Up Modal</span>
              </button>
              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                <span>- Tarik Saldo</span>
              </button>
            </div>
          </div>

          {cashFlows.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              Belum ada mutasi kas RDN yang tercatat. Klik "+ Top-Up Modal" untuk menyetor dana kas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="pb-2.5 font-bold">Waktu</th>
                    <th className="pb-2.5 font-bold">Jenis Transaksi</th>
                    <th className="pb-2.5 font-bold text-right">Nominal (Rp)</th>
                    <th className="pb-2.5 font-bold text-right">Saldo Akhir RDN</th>
                    <th className="pb-2.5 font-bold pl-4">Keterangan / Sumber Rekening</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {cashFlows.map((cf, idx) => {
                    const isTopUp = cf.type === "TOP_UP";
                    return (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-2.5 text-slate-400">
                          {cf.date} · {cf.time || ""}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isTopUp
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {cf.type_label || (isTopUp ? "Top-Up Modal" : "Tarik Saldo")}
                          </span>
                        </td>
                        <td className={`py-2.5 text-right font-bold ${isTopUp ? "text-emerald-400" : "text-amber-400"}`}>
                          {isTopUp ? "+" : "-"}{formatRupiah(cf.amount)}
                        </td>
                        <td className="py-2.5 text-right text-slate-200 font-bold">
                          {formatRupiah(cf.balance_after)}
                        </td>
                        <td className="py-2.5 pl-4 text-slate-400 text-[11px]">
                          {cf.notes || "-"}
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

      {/* TAB 5: SCREENER & REKOMENDASI */}
      {viewTab === "screener" && (() => {
        const SCREENER_TABS = [
          { key: "confluence", label: "Konfluensi Multi-Screener", icon: GanttChartSquare, color: "violet" },
          { key: "multibagger", label: "Calon Multibagger", icon: Star, color: "amber" },
          { key: "bpjs", label: "BPJS Intraday", icon: Zap, color: "emerald" },
          { key: "bsjp", label: "BSJP Pre-Closing", icon: Crosshair, color: "cyan" },
          { key: "pre_ara", label: "Pre-ARA Hunter", icon: TrendingUp, color: "rose" },
          { key: "smart_pick", label: "Smart Pick Rebound", icon: Cpu, color: "blue" },
          { key: "buy_signals", label: "Sinyal BUY Institusional", icon: ShieldCheck, color: "emerald" },
        ] as const;

        const currentData = screenerData[screenerTab];
        const candidates: any[] = currentData?.candidates || currentData?.signals || [];

        return (
          <div className="space-y-5">
            {/* Screener Header */}
            <div className="p-5 rounded-2xl bg-cardBg border border-violet-500/30 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1.5">
                      <Scan className="w-3 h-3" />
                      SCREENER TERPADU
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">7 Strategi Screener · Langsung ke Portofolio</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-100 mt-1 flex items-center gap-2">
                    <PackageOpen className="w-5 h-5 text-violet-400" />
                    Screener &amp; Rekomendasi Saham
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Pilih screener, cari kandidat terbaik, lalu klik <strong className="text-emerald-400">+ Tambah ke Portofolio</strong> untuk langsung mencatatnya.</p>
                </div>
                <button
                  onClick={() => fetchScreener(screenerTab, true)}
                  disabled={screenerLoading}
                  className="px-4 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-300 text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${screenerLoading ? "animate-spin" : ""}`} />
                  <span>{screenerLoading ? "Memindai..." : "Refresh Screener"}</span>
                </button>
              </div>

              {/* Screener sub-tabs */}
              <div className="mt-4 flex flex-wrap gap-2">
                {SCREENER_TABS.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setScreenerTab(key as any)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all border ${
                      screenerTab === key
                        ? `bg-${color}-500/20 text-${color}-300 border-${color}-500/50`
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${screenerTab === key ? `text-${color}-400` : ""}`} />
                    {label}
                    {screenerLoaded[key] && (
                      <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]">
                        {(screenerData[key]?.candidates || screenerData[key]?.signals || []).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Screener content */}
            {screenerLoading ? (
              <div className="p-16 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-violet-400" />
                <p>Memindai semesta saham BEI...</p>
                <p className="text-[10px] text-slate-600">Proses ini membutuhkan 5-15 detik</p>
              </div>
            ) : !screenerLoaded[screenerTab] ? (
              <div className="p-12 text-center bg-cardBg rounded-2xl border border-slate-800 space-y-3">
                <Scan className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-mono text-slate-400">Belum ada data. Klik <strong>Refresh Screener</strong> untuk memulai pemindaian.</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-12 text-center bg-cardBg rounded-2xl border border-slate-800 space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-mono text-slate-400">Tidak ada kandidat ditemukan untuk kondisi pasar saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>{candidates.length} kandidat ditemukan</span>
                  <span className="text-slate-600">Klik "+ Tambah" untuk mencatat ke portofolio</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {candidates.slice(0, 20).map((c: any, idx: number) => {
                    const sym = (c.symbol || "").replace(".JK", "");
                    const price = c.current_price || c.price || 0;
                    const score = c.multibagger_score || c.confluence_score || c.bpjs_score || c.bsjp_score || c.pre_ara_score || c.ai_score || 0;
                    const tp1 = c.target_tp1 || c.predicted_tp1_price || 0;
                    const sl = c.stop_loss || c.predicted_stop_loss_price || 0;
                    const changePct = c.change_pct || c.morning_gain_pct || 0;
                    const patterns: string[] = c.active_patterns || c.confluence_screeners || [];
                    const isSharia = c.is_sharia || false;

                    const scoreColor = score >= 80 ? "emerald" : score >= 65 ? "amber" : "slate";

                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-cardBg border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-violet-400 text-sm shrink-0">
                              {sym.slice(0, 4)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-mono font-bold text-slate-100">{sym}</span>
                                {isSharia && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">ISSI</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{c.name || sym}</p>
                              <p className="text-[10px] text-slate-600 font-mono">{c.sector || "-"}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-mono font-bold text-slate-100">
                              {price >= 1000 ? `Rp ${(price/1000).toFixed(1)}K` : `Rp ${price.toLocaleString("id-ID")}`}
                            </div>
                            {changePct !== 0 && (
                              <div className={`text-[11px] font-mono font-bold ${changePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {changePct >= 0 ? "+" : ""}{Number(changePct).toFixed(2)}%
                              </div>
                            )}
                            <div className={`mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-${scoreColor}-500/20 text-${scoreColor}-300 border border-${scoreColor}-500/30`}>
                              {Number(score).toFixed(0)} pts
                            </div>
                          </div>
                        </div>

                        {/* TP / SL */}
                        {(tp1 > 0 || sl > 0) && (
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            {tp1 > 0 && (
                              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded px-2 py-1 flex justify-between">
                                <span className="text-emerald-400">TP1</span>
                                <span className="text-emerald-300 font-bold">
                                  Rp {Math.round(tp1).toLocaleString("id-ID")}
                                  {price > 0 && ` (+${((tp1-price)/price*100).toFixed(1)}%)`}
                                </span>
                              </div>
                            )}
                            {sl > 0 && (
                              <div className="bg-rose-950/20 border border-rose-500/20 rounded px-2 py-1 flex justify-between">
                                <span className="text-rose-400">SL</span>
                                <span className="text-rose-300 font-bold">
                                  Rp {Math.round(sl).toLocaleString("id-ID")}
                                  {price > 0 && ` (${((sl-price)/price*100).toFixed(1)}%)`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Screener tags / patterns */}
                        {patterns.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {patterns.slice(0, 3).map((p: string, pi: number) => (
                              <span key={pi} className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-mono">
                                {p.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Rationale */}
                        {(c.rationale || c.pre_ara_rationale || c.selling_trigger_rule) && (
                          <p className="text-[10px] text-slate-500 font-mono leading-relaxed line-clamp-2">
                            {c.rationale || c.pre_ara_rationale || c.selling_trigger_rule}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                          <button
                            onClick={() => handleAddFromScreener(c)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] font-mono flex items-center justify-center gap-1 transition-all"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            + Tambah ke Portofolio
                          </button>
                          <a
                            href={`/analysis/${sym}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 transition-all"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Analisis
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {candidates.length > 20 && (
                  <p className="text-center text-[11px] font-mono text-slate-500">
                    Menampilkan 20 dari {candidates.length} kandidat. Buka halaman Screener untuk melihat semua.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL: TOP-UP MODAL RDN */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cardBg border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                <span>Top-Up Modal Kas RDN</span>
              </h3>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Nominal Top-Up (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={10000}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {["1000000", "5000000", "10000000", "50000000"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopUpAmount(val)}
                    className={`py-1 rounded-lg text-[10px] font-mono border transition-all ${
                      topUpAmount === val
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                    }`}
                  >
                    +{parseInt(val) / 1000000} Jt
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Catatan / Sumber Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer Bank BCA / Inflow Gaji"
                  value={topUpNotes}
                  onChange={(e) => setTopUpNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Kas RDN Saat Ini:</span>
                  <span className="text-slate-200">{formatRupiah(summary.cash_balance || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimasi Saldo Setelah Top-Up:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatRupiah((summary.cash_balance || 0) + (parseFloat(topUpAmount) || 0))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingTopUp}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingTopUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                  <span>Konfirmasi Top-Up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TARIK MODAL RDN */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cardBg border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                <span>Tarik Modal Kas RDN</span>
              </h3>
              <button
                onClick={() => setIsWithdrawOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Nominal Penarikan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  max={summary.cash_balance || 0}
                  step={10000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {["1000000", "5000000", "10000000", String(Math.floor((summary.cash_balance || 0) / 10000) * 10000)].map((val, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setWithdrawAmount(val)}
                    className={`py-1 rounded-lg text-[10px] font-mono border transition-all ${
                      withdrawAmount === val
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800"
                    }`}
                  >
                    {i === 3 ? "Tarik Semua" : `${parseInt(val) / 1000000} Jt`}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Catatan / Rekening Bank Tujuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rekening Bank Mandiri / Realisasi Kas"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Kas Cair Tersedia:</span>
                  <span className="text-slate-200 font-bold">{formatRupiah(summary.cash_balance || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimasi Saldo Setelah Penarikan:</span>
                  <span className="text-amber-300 font-bold">
                    {formatRupiah(Math.max(0, (summary.cash_balance || 0) - (parseFloat(withdrawAmount) || 0)))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdraw}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingWithdraw ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                  <span>Konfirmasi Penarikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SAHAM DENGAN KALKULATOR RISK-PARITY SIZING */}
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

              {/* Institutional Risk-Parity Button */}
              {formPrice && (
                <button
                  type="button"
                  onClick={handleCalculateRiskParity}
                  disabled={calculatingRiskParity}
                  className="w-full py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{calculatingRiskParity ? "Menghitung..." : "⚡ Hitung Lot Berbasis Risiko 1% NAV"}</span>
                </button>
              )}

              {riskParityInfo && (
                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] font-mono text-indigo-200 space-y-1">
                  <div className="flex justify-between">
                    <span>Lot Terukur (1% Risiko NAV):</span>
                    <strong className="text-emerald-400">{riskParityInfo.recommended_lots} Lot</strong>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Maks Kerugian jika Kena SL:</span>
                    <span className="text-rose-300 font-bold">{formatRupiah(riskParityInfo.max_loss_nominal)}</span>
                  </div>
                </div>
              )}

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
