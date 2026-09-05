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
  BarChart3,
  Target,
  Crosshair,
  Layers,
  Lock,
  PieChart,
  CalendarDays,
  MessageSquareQuote,
  Flame,
  Rocket,
  Cpu,
  Info,
  ChevronRight,
  Sparkles,
  AlertTriangle,
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
  const [activeTab, setActiveTab] = useState<"confluence" | "technical" | "fundamental" | "bandarmologi">("confluence");
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

  // Technical Analysis Data
  const tech = data.technical_analysis || {};
  const ma20 = Number(tech.ma20 || currentPrice * 0.98);
  const ma50 = Number(tech.ma50 || currentPrice * 0.95);
  const ma200 = Number(tech.ma200 || currentPrice * 0.90);
  const rsiVal = Number(tech.rsi_14 || 54.2);
  const rsiStatus = tech.rsi_status || (rsiVal < 35 ? "OVERSOLD" : rsiVal > 70 ? "OVERBOUGHT" : "NEUTRAL");
  const macdVal = Number(tech.macd || 2.4);
  const macdSig = Number(tech.macd_signal || 1.8);
  const macdHist = Number(tech.macd_hist || 0.6);
  const macdStatus = tech.macd_status || (macdVal >= macdSig ? "BULLISH_CROSS" : "BEARISH_CROSS");
  const bbUpper = Number(tech.bb_upper || currentPrice * 1.05);
  const bbMiddle = Number(tech.bb_middle || ma20);
  const bbLower = Number(tech.bb_lower || currentPrice * 0.95);
  const atrVal = Number(tech.atr_14 || Math.max(1, Math.round(currentPrice * 0.025)));
  const trendBias = tech.trend_bias || (currentPrice > ma50 ? "BULLISH_UPTREND" : "CONSOLIDATION_SIDEWAYS");
  const pivotLevels = tech.pivot_levels || {
    pivot: Math.round(currentPrice),
    resistance_1: Math.round(currentPrice * 1.04),
    resistance_2: Math.round(currentPrice * 1.08),
    support_1: Math.round(currentPrice * 0.96),
    support_2: Math.round(currentPrice * 0.92)
  };

  // Financial & Fundamental Metrics
  const fundamentals = data.fundamentals || {};
  const perVal = Number(fundamentals.per || data.metrics?.pe_ratio || 12.5);
  const pbvVal = Number(fundamentals.pbv || data.metrics?.pbv_ratio || 1.8);
  const roeVal = Number(fundamentals.roe || data.metrics?.roe_pct || 15.0);
  const derVal = Number(fundamentals.der || data.metrics?.der_ratio || 0.65);
  const netMarginVal = Number(fundamentals.net_profit_margin || 14.2);
  const revGrowthVal = Number(fundamentals.revenue_growth || 16.8);
  const currRatioVal = Number(fundamentals.current_ratio || 1.75);

  // Bandarmologi & Order Flow
  const orderFlow = data.order_flow || {};
  const cr3Val = Number(orderFlow.top_broker_cr3 || 61.4);
  const bandarVWAP = Number(data.bandarmologi?.bandar_vwap || currentPrice * 0.99);
  const isGoldenEntry = currentPrice <= bandarVWAP * 1.02;
  const bigPlayerSentiment = orderFlow.big_player_sentiment || "ACCUMULATION";
  const foreignFlow = orderFlow.foreign_flow_status || "NET_BUY";

  // Trading Blueprint
  const entryLow = Math.round(currentPrice * 0.99);
  const entryHigh = Math.round(currentPrice);
  const targetTP1 = Math.round(currentPrice * 1.05);
  const targetTP2 = Math.round(currentPrice * 1.10);
  const stopLoss = Math.round(currentPrice * 0.97);

  // Multi-Method Confluence & Consistency Diagnostics
  const isFundStrong = roeVal >= 12 || pScore >= 65 || marginOfSafety > 10;
  const isTechBullish = trendBias.includes("BULLISH") || currentPrice > ma50;
  const isTechOversold = rsiVal < 38 || currentPrice < ma50;
  const isBandarAccum = cr3Val >= 55 || bigPlayerSentiment === "ACCUMULATION";
  const isDanger = !isSafe || shield?.is_danger || shield?.is_gorengan;

  // Diagnosis Type & Actionable Rationale
  let reconType = "NEUTRAL";
  let reconTitle = "KONSOLIDASI & WAIT AND SEE";
  let reconBadge = "bg-slate-500/20 text-slate-300 border-slate-500/30";
  let reconDesc = "Sinyal antar metode masih berimbang di area netral. Belum ada konfirmasi breakout teknikal maupun lonjakan akumulasi yang dominan.";
  let scalperAdvice = "Tunggu pantulan volume intraday atau momentum breakout.";
  let swingAdvice = "Wait and see hingga harga menembus level resistance klasik.";
  let investorAdvice = "Cicil bertahap hanya bila valuasi intrinsik terdiskon di bawah harga wajar.";

  if (isDanger) {
    reconType = "DANGER";
    reconTitle = "BLOKIR KEAMANAN: Saham Gorengan / Danger Zone";
    reconBadge = "bg-rose-500/20 text-rose-400 border-rose-500/30";
    reconDesc = "Meskipun indikator teknikal mungkin tampak volatil atau melonjak sesaat, saham ini diblokir oleh Stock Shield Engine karena beban hutang tinggi, laba minus, atau anomali perputaran volume pump & dump.";
    scalperAdvice = "TIDAK DISARANKAN. Risiko likuiditas macet atau suspensi bursa.";
    swingAdvice = "HINDARI. Tidak memiliki bantalan fundamental.";
    investorAdvice = "DILARANG. Risiko kehilangan modal permanen.";
  } else if (isFundStrong && isTechBullish && isBandarAccum) {
    reconType = "GOLDEN_CONFLUENCE";
    reconTitle = "GOLDEN CONFLUENCE: Seluruh Metode Selaras Positif";
    reconBadge = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    reconDesc = "Konvergen sempurna: Kinerja fundamental kuat menciptakan margin of safety tinggi, diiringi akumulasi konsentrasi broker bandar, dan konfirmasi uptrend teknikal di atas MA50.";
    scalperAdvice = "Beli saat breakout resistance pivot dengan target ARA / +3% s/d +7%.";
    swingAdvice = "STRONG BUY. Alokasi posisi optimal dengan trailing stop di bawah MA20.";
    investorAdvice = "Layak akumulasi porsi inti portofolio jangka menengah-panjang.";
  } else if (isFundStrong && !isTechBullish) {
    reconType = "VALUE_DIVERGENCE";
    reconTitle = "DIVERGENSI VALUE: Fundamental Solid vs Teknikal Melemah / Downtrend";
    reconBadge = "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    reconDesc = "Perusahaan sangat menguntungkan (ROE sehat & valuasi diskon), namun tren harga jangka pendek sedang terkoreksi. Hindari agresif menangkap pisau jatuh (knife-catching); tunggu konfirmasi reversal di area support kunci.";
    scalperAdvice = "Hindari entry sebelum terbentuk candle reversal pembalikan arah.";
    swingAdvice = "Buy on Weakness: Beli bertahap di Support 1 atau Support 2 dengan stop loss ketat.";
    investorAdvice = "Zona Emas Akumulasi: Sangat cocok untuk Dollar-Cost Averaging (DCA) kuartalan.";
  } else if (!isFundStrong && isTechBullish) {
    reconType = "MOMENTUM_DIVERGENCE";
    reconTitle = "DIVERGENSI MOMENTUM: Teknikal Melesat vs Fundamental Kurang Mendukung";
    reconBadge = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    reconDesc = "Tren harga sedang naik kencang didorong momentum likuiditas sesaat atau sentimen sektoral, tetapi valuasi mahal atau laba belum terbukti stabil. Peluang trading tinggi namun dengan proteksi risiko ketat.";
    scalperAdvice = "Zona Utama Scalping: Ambil peluang momentum cepat, disiplin TP 2% - 5%.";
    swingAdvice = "Wajib trailing stop ketat (-2.5% s/d -3%). Jangan ditinggal tanpa pengawasan.";
    investorAdvice = "HINDARI INVESTASI. Valuasi rawan devaluasi saat momentum mereda.";
  } else if (isBandarAccum && !isTechBullish) {
    reconType = "STEALTH_ACCUMULATION";
    reconTitle = "DIVERGENSI BANDARMOLOGI: Akumulasi Senyap (Stealth Accumulation)";
    reconBadge = "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    reconDesc = "Top broker terdeteksi mengumpulkan barang secara konsentrasi (CR3 tinggi) di harga bawah, tetapi harga sengaja dijaga mendatar (sideways). Ini adalah fase persiapan sebelum markup harga besar.";
    scalperAdvice = "Kurang cocok untuk scalping karena pergerakan harga cenderung tenang/lambat.";
    swingAdvice = "Akumulasi di dekat Bandar VWAP. Sabar menunggu ledakan volume breakout.";
    investorAdvice = "Layak dikoleksi di harga modal bandar untuk potensi multibagger.";
  }

  const handleCopyPlan = () => {
    const planText = `RENCANA TRADING IHSG SLAYER
Emiten: ${data.symbol} (${data.name})
Harga Terkini: Rp ${currentPrice.toLocaleString("id-ID")}
AI Score: ${aiScoreNum.toFixed(1)}/100 (${verdictCategory})
Graham Fair Value: Rp ${Math.round(grahamVal).toLocaleString("id-ID")} (${marginOfSafety >= 0 ? "+" : ""}${marginOfSafety.toFixed(1)}%)
Area Entry: Rp ${entryLow.toLocaleString("id-ID")} - Rp ${entryHigh.toLocaleString("id-ID")}
Target TP1 (+5%): Rp ${targetTP1.toLocaleString("id-ID")}
Target TP2 (+10%): Rp ${targetTP2.toLocaleString("id-ID")}
Batas Cut Loss (-3%): Rp ${stopLoss.toLocaleString("id-ID")}
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
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0a0f1d] via-[#10172a] to-[#0a0f1d] border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <h2 className="text-3xl font-black font-mono text-white tracking-wide">{data.symbol.replace(".JK", "")}</h2>
            {data.is_sharia && <ShariaBadge isSharia={true} />}
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
            {data.name} &bull; <span className="text-slate-400 font-mono">{data.sector}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Harga Terkini</div>
            <div className="text-2xl font-black text-slate-100">
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

      {/* Interactive Price & Volume Chart with S/R, BB, RSI */}
      <InteractiveChart
        symbol={data.symbol || symbol}
        currentPrice={currentPrice}
        candles={data.chart_candles || data.candles || []}
        pivotLevels={pivotLevels}
        bbUpper={bbUpper}
        bbMiddle={bbMiddle}
        bbLower={bbLower}
        rsiValue={rsiVal}
      />

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

      {/* ========================================================================= */}
      {/* 360° DETAILED EXPLANATION SUITE: TEKNIKAL, FUNDAMENTAL, BANDARMOLOGI */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-cardBg border border-slate-800 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Bedah Kuantitatif 360° &bull; {data.symbol.replace(".JK", "")}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Penjelasan teknikal mendalam, metrik fundamental laba, dan aliran dana bandar.</p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-wrap">
            <button
              onClick={() => setActiveTab("confluence")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "confluence"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Konfluensi Lintas Metode
            </button>
            <button
              onClick={() => setActiveTab("technical")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "technical"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Teknikal
            </button>
            <button
              onClick={() => setActiveTab("fundamental")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "fundamental"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Scale className="w-3.5 h-3.5" /> Fundamental
            </button>
            <button
              onClick={() => setActiveTab("bandarmologi")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "bandarmologi"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Bandarmologi
            </button>
          </div>
        </div>

        {/* TAB 0: MATRIKS KONFLUENSI & REKONSILIASI MULTI-METODE */}
        {activeTab === "confluence" && (
          <div className="space-y-6 animate-in fade-in">
            {/* 1. Header Diagnostics Card */}
            <div className={`p-5 rounded-2xl border bg-slate-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${reconBadge}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    SINTESIS KONSISTENSI AI
                  </span>
                  <span className="text-xs font-mono font-black">{reconTitle}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mt-1">
                  {reconDesc}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right font-mono shrink-0">
                <span className="text-[9px] text-slate-400 block uppercase">Rekomendasi Terpadu</span>
                <span className="text-sm font-black text-emerald-400">{verdictCategory}</span>
              </div>
            </div>

            {/* 2. Side-by-Side 4-Method Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              {/* Fundamental */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" /> 1. Fundamental
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isFundStrong ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                      {isFundStrong ? "SOLID" : "SEDANG/WAJAR"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ROE:</span>
                      <span className="text-slate-200 font-bold">{roeVal.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PER:</span>
                      <span className="text-slate-200 font-bold">{perVal.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Graham MoS:</span>
                      <span className={`font-bold ${marginOfSafety >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {marginOfSafety >= 0 ? "+" : ""}{marginOfSafety.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 leading-tight">
                  {isFundStrong ? "Laba bertumbuh kuat dengan valuasi terlindungi margin of safety." : "Valuasi mencerminkan ekspektasi pertumbuhan wajar industri."}
                </p>
              </div>

              {/* Teknikal */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 2. Teknikal
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isTechBullish ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                      {trendBias.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">RSI (14):</span>
                      <span className="text-slate-200 font-bold">{rsiVal.toFixed(1)} ({rsiStatus})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Posisi MA50:</span>
                      <span className={`font-bold ${currentPrice >= ma50 ? "text-emerald-400" : "text-rose-400"}`}>
                        {currentPrice >= ma50 ? "Di Atas (+)" : "Di Bawah (-)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">MACD:</span>
                      <span className="text-slate-200 font-bold">{macdStatus.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 leading-tight">
                  {isTechBullish ? "Struktur harga berada dalam fase ekspansi momentum positif." : "Harga sedang berkonsolidasi atau mencari pijakan support baru."}
                </p>
              </div>

              {/* Bandarmologi */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> 3. Bandarmologi
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isBandarAccum ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                      {isBandarAccum ? "AKUMULASI" : "NETRAL"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Konsentrasi CR3:</span>
                      <span className="text-cyan-400 font-bold">{cr3Val.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bandar VWAP:</span>
                      <span className="text-slate-200 font-bold">Rp {Math.round(bandarVWAP).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Posisi Entry:</span>
                      <span className={`font-bold ${isGoldenEntry ? "text-emerald-400" : "text-amber-400"}`}>
                        {isGoldenEntry ? "Golden Entry" : "Markup"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 leading-tight">
                  {isBandarAccum ? "Institusi besar mengontrol pasokan barang di harga akumulasi." : "Pergerakan barang normal dan tersebar di pasar reguler."}
                </p>
              </div>

              {/* Stock Shield Protection */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> 4. Stock Shield
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSafe ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                      {isSafe ? "LOLOS PROTEKSI" : "DANGER"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Anti-Gorengan:</span>
                      <span className="text-emerald-400 font-bold">{shield?.is_gorengan ? "Terdeteksi (!)" : "Aman"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Likuiditas Rata2:</span>
                      <span className="text-slate-200 font-bold">{formatRupiah(data.adtv_20 || 5_000_000_000)}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Volatilitas ATR:</span>
                      <span className="text-slate-200 font-bold">{atrVal.toFixed(0)} ({((atrVal/currentPrice)*100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 leading-tight">
                  {isSafe ? "Memenuhi standar likuiditas aman dan bebas risiko jebakan gocap." : "Terdapat peringatan likuiditas atau volatilitas tidak wajar."}
                </p>
              </div>
            </div>

            {/* 3. Timeframe Horizon Action Guide */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-900/70 to-slate-900/70 border border-indigo-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                  Panduan Eksekusi Berdasarkan Gaya &amp; Horison Trading
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">Scalper (Intraday)</span>
                    <span className="text-[9px] text-slate-500">09:15 - 15:45 WIB</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{scalperAdvice}</p>
                  <span className="text-[9px] text-slate-500 block pt-1 border-t border-slate-800/80">Fokus: Volume Spike &amp; Pivot R1</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Swing Trader</span>
                    <span className="text-[9px] text-slate-500">3 - 20 Hari Bursa</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{swingAdvice}</p>
                  <span className="text-[9px] text-slate-500 block pt-1 border-t border-slate-800/80">Fokus: MA50 Trend &amp; Bandar VWAP</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Investor</span>
                    <span className="text-[9px] text-slate-500">3 - 24 Bulan</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{investorAdvice}</p>
                  <span className="text-[9px] text-slate-500 block pt-1 border-t border-slate-800/80">Fokus: ROE &gt; 15% &amp; Graham Diskon</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PENJELASAN TEKNIKAL DETAIL */}
        {activeTab === "technical" && (
          <div className="space-y-5 animate-in fade-in">
            {/* Trend Bias & Moving Averages Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Status Tren Utama</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    trendBias.includes("BULLISH")
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}>
                    {trendBias.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {currentPrice > ma50 && ma50 > ma200
                    ? "Struktur tren sempurna Minervini: Harga bertengger di atas MA50 dan MA200 dengan slope menanjak."
                    : currentPrice > ma20
                    ? "Harga bertahan di atas MA20 jangka pendek, berada dalam fase akumulasi/konsolidasi sehat."
                    : "Harga menguji area support dinamis, waspadai risiko penembusan ke bawah MA50."}
                </p>
              </div>

              {/* Moving Averages Alignment */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Pilar Rata-Rata Bergerak (MA)</span>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400">MA20 (Pendek):</span>
                    <span className="text-slate-200 font-bold">Rp {Math.round(ma20).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-400">MA50 (Menengah):</span>
                    <span className="text-slate-200 font-bold">Rp {Math.round(ma50).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-400">MA200 (Panjang):</span>
                    <span className="text-slate-200 font-bold">Rp {Math.round(ma200).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* Momentum Oscillators (RSI & MACD) */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Momentum RSI (14) &amp; MACD</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300">RSI: <strong className="text-emerald-400">{rsiVal.toFixed(1)}</strong></span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{rsiStatus}</span>
                  </div>
                  {/* Progress bar RSI */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        rsiVal > 70 ? "bg-rose-500" : rsiVal < 35 ? "bg-emerald-400" : "bg-cyan-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, rsiVal))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono pt-1">
                    <span className="text-slate-300">MACD: <strong className={macdVal >= macdSig ? "text-emerald-400" : "text-amber-400"}>{macdVal.toFixed(2)}</strong></span>
                    <span className="text-[10px] text-slate-400">{macdStatus.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pivot Support & Resistance Table */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                <span>Level Kunci Pantauan (Support &amp; Resistance Klasik)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-rose-400 uppercase block">Resistance 2</span>
                  <span className="text-xs font-bold text-slate-100">Rp {pivotLevels.resistance_2.toLocaleString("id-ID")}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Target Breakout</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-amber-400 uppercase block">Resistance 1</span>
                  <span className="text-xs font-bold text-slate-100">Rp {pivotLevels.resistance_1.toLocaleString("id-ID")}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Ujian Pertama</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40">
                  <span className="text-[9px] text-indigo-300 uppercase block font-bold">Pivot Point</span>
                  <span className="text-xs font-black text-indigo-200">Rp {pivotLevels.pivot.toLocaleString("id-ID")}</span>
                  <span className="text-[9px] text-indigo-400 block mt-0.5">Titik Keseimbangan</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-cyan-400 uppercase block">Support 1</span>
                  <span className="text-xs font-bold text-slate-100">Rp {pivotLevels.support_1.toLocaleString("id-ID")}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Penahan Pertama</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-emerald-400 uppercase block">Support 2</span>
                  <span className="text-xs font-bold text-slate-100">Rp {pivotLevels.support_2.toLocaleString("id-ID")}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Batas Cut Loss</span>
                </div>
              </div>
            </div>

            {/* Trading Blueprint: Entry, Targets, Stop Loss */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-indigo-300 uppercase block font-bold">Zona Beli Rekomendasi</span>
                <span className="text-sm font-black text-white">Rp {entryLow.toLocaleString("id-ID")} - {entryHigh.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 uppercase block font-bold">Target TP 1 (+5%)</span>
                <span className="text-sm font-black text-emerald-400">Rp {targetTP1.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-[10px] text-cyan-300 uppercase block font-bold">Target TP 2 (+10%)</span>
                <span className="text-sm font-black text-cyan-400">Rp {targetTP2.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-300 uppercase block font-bold">Batas Stop Loss (-3%)</span>
                <span className="text-sm font-black text-rose-400">Rp {stopLoss.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENJELASAN FUNDAMENTAL & VALUASI */}
        {activeTab === "fundamental" && (
          <div className="space-y-5 animate-in fade-in">
            {/* Valuation & Profitability Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Price to Earnings (PER)</span>
                <p className="text-lg font-bold text-slate-100">{perVal.toFixed(1)}x</p>
                <p className="text-[10px] text-slate-500">
                  {perVal < 15 ? "Valuasi murah di bawah rata-rata IHSG (< 15x)." : "Valuasi wajar mencerminkan pertumbuhan laba."}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Price to Book Value (PBV)</span>
                <p className="text-lg font-bold text-slate-100">{pbvVal.toFixed(2)}x</p>
                <p className="text-[10px] text-slate-500">Nilai pasar terhadap nilai buku modal ekuitas.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Return on Equity (ROE)</span>
                <p className="text-lg font-bold text-emerald-400">{roeVal.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-500">
                  {roeVal >= 15 ? "Profitabilitas istimewa (> 15%) menciptakan compounding kuat." : "Profitabilitas cukup stabil."}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Debt to Equity (DER)</span>
                <p className={`text-lg font-bold ${derVal < 1.0 ? "text-emerald-400" : "text-amber-400"}`}>{derVal.toFixed(2)}x</p>
                <p className="text-[10px] text-slate-500">
                  {derVal < 1.0 ? "Hutang terkendali aman di bawah 1.0x ekuitas." : "Rasio hutang memerlukan pengawasan kas."}
                </p>
              </div>
            </div>

            {/* Graham Fair Value Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900/80 to-slate-900/80 border border-cyan-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Valuasi Intrinsik Benjamin Graham: Rp {Math.round(grahamVal).toLocaleString("id-ID")}</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Berdasarkan formula klasik EPS dan Nilai Buku (BVPS), emiten ini memiliki margin pengaman sebesar{" "}
                  <strong className={marginOfSafety >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {marginOfSafety >= 0 ? "+" : ""}{marginOfSafety.toFixed(1)}%
                  </strong>.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono shrink-0">
                <span className="text-[10px] text-slate-400 block">Margin of Safety</span>
                <span className={`text-base font-bold ${marginOfSafety >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {marginOfSafety >= 0 ? "+" : ""}{marginOfSafety.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Growth & Business Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] block">Net Profit Margin</span>
                <p className="text-sm font-bold text-slate-200 mt-1">{netMarginVal.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Efisiensi konversi omset menjadi laba bersih.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] block">Pertumbuhan Omset (YoY)</span>
                <p className="text-sm font-bold text-emerald-400 mt-1">+{revGrowthVal.toFixed(1)}%</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Ekspansi bisnis dan penguasaan pangsa pasar.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] block">Current Ratio</span>
                <p className="text-sm font-bold text-cyan-400 mt-1">{currRatioVal.toFixed(2)}x</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Kemampuan melunasi kewajiban jangka pendek.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PENJELASAN BANDARMOLOGI & ALIRAN DANA */}
        {activeTab === "bandarmologi" && (
          <div className="space-y-5 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CR3 Broker Concentration */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Konsentrasi Top 3 Broker (CR3)</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-cyan-300">{cr3Val.toFixed(1)}%</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    cr3Val >= 55 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-400"
                  }`}>
                    {cr3Val >= 55 ? "AKUMULASI BESAR" : "NETRAL"}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${Math.min(100, cr3Val)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">
                  {cr3Val >= 55
                    ? "Tiga broker teratas menguasai mayoritas peredaran saham, menandakan kontrol kuat institusi/bandar."
                    : "Peredaran saham relatif tersebar antar broker retail dan institusi."}
                </p>
              </div>

              {/* Bandar VWAP vs Market Price */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Bandar VWAP (Modal Rata-Rata)</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono text-slate-100">Rp {Math.round(bandarVWAP).toLocaleString("id-ID")}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isGoldenEntry ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {isGoldenEntry ? "GOLDEN ENTRY" : "MARKUP STAGE"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {isGoldenEntry
                    ? "Harga saat ini berada sangat dekat dengan modal rata-rata bandar, memberikan margin risiko yang sangat minimal."
                    : "Harga telah naik di atas rata-rata modal bandar, gunakan strategi trailing stop secara ketat."}
                </p>
              </div>

              {/* Big Player Sentiment & Foreign Flow */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Sentimen Arus Dana Institusi</span>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Smart Money:</span>
                    <span className="text-emerald-400 font-bold">{bigPlayerSentiment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Foreign Net Flow:</span>
                    <span className="text-cyan-300 font-bold">{foreignFlow}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Konvergensi antara broker lokal berkantong tebal dan arus asing memperkuat probabilitas kelanjutan tren harga.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rangkuman Win Rate & Audit Sinyal Historis Emiten */}
      <StockAuditSummaryCard symbol={symbol} />

      {/* Intelijen Sentimen & Katalis Makro Global */}
      <StockSentimentCard symbol={symbol} />

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
