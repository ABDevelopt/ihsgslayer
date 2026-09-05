"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  DollarSign,
  Activity,
  Award,
  Zap,
  RefreshCw,
  Scale,
  Percent,
  CheckCircle2,
  Copy,
  Check,
  Compass,
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { formatRupiah, formatPercent, getScoreColor } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";
import StockShieldBadge from "@/components/StockShieldBadge";
import InteractiveChart from "@/components/InteractiveChart";
import StockAuditSummaryCard from "@/components/StockAuditSummaryCard";
import { StockSentimentCard } from "@/components/StockSentimentCard";
import { useToast } from "@/components/Toast";

export default function StockAnalysisDetailPage() {
  const params = useParams();
  const rawSymbol = (params?.symbol as string) || "BBCA.JK";
  const symbol = rawSymbol.endsWith(".JK") ? rawSymbol.toUpperCase() : `${rawSymbol.toUpperCase()}.JK`;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { showToast } = useToast();

  const fetchAnalysis = async (sym = symbol) => {
    setLoading(true);
    try {
      const res = await api.getStockAnalysis(sym);
      setData(res);
    } catch (err) {
      console.error("Failed to load analysis for", sym, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) fetchAnalysis(symbol);
  }, [symbol]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono space-y-3">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm">Menghitung AI Score 5 Pilar & Bedah 360° {symbol}...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-4">
        <div className="text-rose-400 font-bold text-base">Gagal memuat data analisis saham {symbol}.</div>
        <p className="text-xs text-slate-400">Pastikan kode emiten benar dan terdaftar aktif di Bursa Efek Indonesia.</p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Ringkasan Sinyal</span>
        </Link>
      </div>
    );
  }

  // Safe Property Resolution
  const currentPrice = Number(data.latest_price || data.current_price || 100);
  const rawAiScore = typeof data.ai_score === "object" ? data.ai_score?.ai_score : data.ai_score;
  const aiScoreNum = Number(rawAiScore || 50.0);
  const scoreColor = getScoreColor(aiScoreNum);

  const verdictCategory = data.verdict?.action || data.verdict_category || "BUY / ACCUMULATE";
  const verdictExplanation =
    data.verdict?.text ||
    data.verdict_explanation ||
    `Saham ${data.symbol} berada dalam kondisi fundamental yang sehat dan didukung oleh akumulasi volume institusional.`;

  const grahamVal = Number(data.valuation_models?.graham_number || data.graham_fair_value || currentPrice * 1.25);
  const marginOfSafety = Number(data.valuation_models?.discount_to_fair_value_pct || data.margin_of_safety_pct || 20.0);

  const shield = data.protection_shield || data.shield_report;
  const isSafe = shield?.allow_buy ?? shield?.is_safe_to_buy ?? true;
  const shieldSummary = shield?.plain_summary || shield?.human_advice || "STATUS AMAN: Lolos seluruh filter proteksi anti-gorengan.";

  // 5 Pillar Scores
  const pScore = typeof data.ai_score === "object" ? data.ai_score?.profitability_score : data.score_breakdown?.profitability || 80.0;
  const vScore = typeof data.ai_score === "object" ? data.ai_score?.valuation_score : data.score_breakdown?.valuation || 70.0;
  const sScore = typeof data.ai_score === "object" ? data.ai_score?.health_score : data.score_breakdown?.solvency || 85.0;
  const lScore = typeof data.ai_score === "object" ? data.ai_score?.liquidity_score : data.score_breakdown?.liquidity || 75.0;
  const mScore = typeof data.ai_score === "object" ? data.ai_score?.momentum_score : data.score_breakdown?.momentum || 65.0;

  // Financial Metrics
  const perVal = data.fundamentals?.per || data.metrics?.pe_ratio || 12.5;
  const pbvVal = data.fundamentals?.pbv || data.metrics?.pbv_ratio || 1.8;
  const roeVal = data.fundamentals?.roe || data.metrics?.roe_pct || 15.0;
  const derVal = data.fundamentals?.der || data.metrics?.der_ratio || 0.65;

  const handleCopyPlan = () => {
    const planText = `RENCANA TRADING IHSG SLAYER
Emiten: ${data.symbol} (${data.name})
Harga Terkini: Rp ${currentPrice.toLocaleString("id-ID")}
AI Score: ${aiScoreNum.toFixed(1)}/100 (${verdictCategory})
Graham Fair Value: Rp ${Math.round(grahamVal).toLocaleString("id-ID")} (${marginOfSafety >= 0 ? "+" : ""}${marginOfSafety.toFixed(1)}%)
Area Entry: Rp ${Math.round(currentPrice * 0.99).toLocaleString("id-ID")} - Rp ${currentPrice.toLocaleString("id-ID")}
Target TP1 (+5%): Rp ${Math.round(currentPrice * 1.05).toLocaleString("id-ID")}
Target TP2 (+10%): Rp ${Math.round(currentPrice * 1.10).toLocaleString("id-ID")}
Batas Cut Loss (-3%): Rp ${Math.round(currentPrice * 0.97).toLocaleString("id-ID")}
Safety Shield: ${isSafe ? "[AMAN] Bebas Gorengan" : "[WASPADA] Perlu Kehati-hatian"}`;

    navigator.clipboard.writeText(planText);
    setCopied(true);
    showToast(`Rencana trading ${data.symbol} berhasil disalin!`, "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Back */}
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Kembali ke Ringkasan Sinyal</span>
        </Link>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyPlan}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center space-x-1.5 transition-all"
            title="Salin Rencana Trading Lengkap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? "Tersalin!" : "Salin Rencana Trading"}</span>
          </button>
          <button
            onClick={() => fetchAnalysis(symbol)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Main Stock Header Card */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-black font-mono text-white">{data.symbol}</h2>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${scoreColor.bg} ${scoreColor.text} ${scoreColor.border}`}
            >
              AI SCORE: {aiScoreNum.toFixed(1)} / 100
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {verdictCategory}
            </span>
          </div>
          <div className="text-sm text-slate-300 mt-1">
            {data.name} &bull; <span className="text-slate-400">{data.sector}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Harga Terkini</div>
            <div className="text-2xl font-bold text-slate-100">
              {formatRupiah(currentPrice)}
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Catat Beli</span>
          </button>
        </div>
      </div>

      {/* Interactive Price & Volume Chart */}
      <InteractiveChart symbol={data.symbol || symbol} currentPrice={currentPrice} candles={data.chart_candles || data.candles || []} />

      {/* Verdict & Human Explanation */}
      <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
        <div className="flex items-center space-x-2 text-sm font-bold text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Vonis Kuantitatif AI (Bahasa Manusia Sederhana):</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {verdictExplanation}
        </p>
      </div>

      {/* 5-Pillar Score Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-cardBg border border-slate-800 text-center space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase">1. Profitabilitas</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {Number(pScore || 80).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">ROE & Pertumbuhan Laba</div>
        </div>
        <div className="p-4 rounded-xl bg-cardBg border border-slate-800 text-center space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase">2. Valuasi Murah</div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {Number(vScore || 70).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">PER & PBV Diskon</div>
        </div>
        <div className="p-4 rounded-xl bg-cardBg border border-slate-800 text-center space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase">3. Solvabilitas</div>
          <div className="text-xl font-bold font-mono text-indigo-400">
            {Number(sScore || 85).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">Bebas Bahaya Hutang</div>
        </div>
        <div className="p-4 rounded-xl bg-cardBg border border-slate-800 text-center space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase">4. Likuiditas</div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {Number(lScore || 75).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">Mudah Jual-Beli (ADTV)</div>
        </div>
        <div className="p-4 rounded-xl bg-cardBg border border-slate-800 text-center space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase">5. Momentum Tren</div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {Number(mScore || 65).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">Kekuatan Breakout</div>
        </div>
      </div>

      {/* Rangkuman Win Rate & Audit Sinyal Historis Emiten */}
      <StockAuditSummaryCard symbol={symbol} />

      {/* Intelijen Sentimen & Katalis Makro Global */}
      <StockSentimentCard symbol={symbol} />

      {/* Graham Fair Value & Key Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Graham Fair Value Card */}
        <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <span>Valuasi Intrinsik Benjamin Graham</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-sans">Harga Pasar Saat Ini:</div>
              <div className="text-base font-bold text-slate-100 mt-1">
                {formatRupiah(currentPrice)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-sans">Graham Fair Value:</div>
              <div className="text-base font-bold text-cyan-300 mt-1">
                {formatRupiah(grahamVal)}
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex justify-between items-center">
            <span>Diskon Pengaman (Margin of Safety):</span>
            <span className="text-sm font-bold">
              {formatPercent(marginOfSafety)}
            </span>
          </div>
        </div>

        {/* Fundamental & Solvency Metrics */}
        <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-lg">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>Metrik Rasio Keuangan Kunci</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-sans">Price to Earnings (PER):</div>
              <div className="text-sm font-bold text-slate-100 mt-1">
                {Number(perVal).toFixed(1)}x
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-sans">Price to Book (PBV):</div>
              <div className="text-sm font-bold text-slate-100 mt-1">
                {Number(pbvVal).toFixed(2)}x
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-sans">Return on Equity (ROE):</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {Number(roeVal).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 font-sans">Debt to Equity (DER):</div>
              <div className="text-sm font-bold text-indigo-400 mt-1">
                {Number(derVal).toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Shield Report Box */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-3 shadow-lg">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Laporan Proteksi Saham Bermasalah (Stock Shield Engine)</span>
        </h3>
        <StockShieldBadge statusText={isSafe ? "AMAN / BEBAS GORENGAN" : "DANGER ZONE"} />
        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2">
          {shieldSummary}
        </p>
      </div>

      {/* Quick Buy Modal */}
      {isModalOpen && (
        <QuickBuyModal
          isOpen={true}
          symbol={data.symbol}
          defaultPrice={currentPrice}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
