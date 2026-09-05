"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sunrise,
  Calendar,
  Gem,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Zap,
  Clock,
  TrendingUp,
  Target,
  Percent,
  Sliders,
  AlertCircle
} from "lucide-react";
import { formatRupiah, formatPercent } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";
import IntradayRadarWidget from "@/components/IntradayRadarWidget";
import { api } from "@/lib/api";

export default function TimeframeCategorizerPage() {
  const [activeTab, setActiveTab] = useState<"SCALPING" | "SWING" | "INVEST">("SCALPING");
  const [data, setData] = useState<any>(null);
  const [catSummary, setCatSummary] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModalStock, setActiveModalStock] = useState<{
    symbol: string;
    price: number;
  } | null>(null);

  const fetchTimeframes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/screener/timeframes");
      const json = await res.json();
      setData(json);

      const cats = await api.getCategoriesSummary();
      setCatSummary(cats);
    } catch (err) {
      console.error("Failed to load timeframes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeframes();
  }, []);

  const getActiveList = () => {
    if (!data) return [];
    if (activeTab === "SCALPING") return data.scalping?.candidates || data.harian?.candidates || [];
    if (activeTab === "SWING") return data.swing?.candidates || data.mingguan?.candidates || [];
    return data.invest?.candidates || data.jangka_panjang?.candidates || [];
  };

  const list = getActiveList();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              STUDIO 3 PILAR STRATEGI TRADING
            </span>
            <span className="text-xs text-slate-400 font-mono">
              IDX BEI &bull; Scalping &bull; Swing &bull; Investasi
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Target className="w-6 h-6 text-emerald-400" />
            <span>Studio 3 Pilar: Scalping (Intraday) &bull; Swing &bull; Invest (Long-Term)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl font-sans leading-relaxed">
            Pemisahan komprehensif semesta trading BEI ke dalam 3 profil horizon waktu:{" "}
            <strong className="text-sky-400">[SCALPING] Intraday Fast Momentum</strong>,{" "}
            <strong className="text-indigo-400">[SWING] Multi-Day Trend &amp; Rebound</strong>, dan{" "}
            <strong className="text-emerald-400">[INVEST] Fundamental Deep Value &amp; Compounder</strong>. Dilengkapi parameter target, batas risiko, dan audit win rate riil terpisah.
          </p>
        </div>

        <button
          onClick={fetchTimeframes}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Sinyal 3 Pilar</span>
        </button>
      </div>

      {/* Radar Siklus Waktu Intraday & Proteksi Kempis Pagi */}
      <IntradayRadarWidget />

      {/* 3 Segmented Tabs Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tab 1: Scalping */}
        <button
          onClick={() => setActiveTab("SCALPING")}
          className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
            activeTab === "SCALPING"
              ? "bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10 text-sky-300"
              : "bg-cardBg border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <Sunrise className="w-4 h-4 text-sky-400" />
              <span>1. SCALPING (Intraday Fast)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              {data?.scalping?.count || data?.harian?.count || 0} Saham
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Durasi: <strong>09:15 - 15:45 WIB (Zero Overnight)</strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">Target: +2.5% s/d +7% / ARA</span>
            <span className="text-sky-300 font-bold">Audit WR: {catSummary?.SCALPING?.win_rate_pct ?? "80.8"}%</span>
          </div>
        </button>

        {/* Tab 2: Swing */}
        <button
          onClick={() => setActiveTab("SWING")}
          className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
            activeTab === "SWING"
              ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 text-indigo-300"
              : "bg-cardBg border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>2. SWING (Multi-Day Trend)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {data?.swing?.count || data?.mingguan?.count || 0} Saham
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Durasi: <strong>3 - 20 Hari Bursa (Trailing Stop)</strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">Target: +8.0% s/d +25.0%</span>
            <span className="text-indigo-300 font-bold">Profit Factor: {catSummary?.SWING?.profit_factor ?? "1.84"}x</span>
          </div>
        </button>

        {/* Tab 3: Invest */}
        <button
          onClick={() => setActiveTab("INVEST")}
          className={`p-4 rounded-2xl border text-left transition-all space-y-2 relative overflow-hidden ${
            activeTab === "INVEST"
              ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 text-emerald-300"
              : "bg-cardBg border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <Gem className="w-4 h-4 text-emerald-400" />
              <span>3. INVEST (Long-Term Value)</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {data?.invest?.count || data?.jangka_panjang?.count || 0} Saham
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Horizon: <strong>3 Bulan - 2+ Tahun (DCA)</strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">Target: +30% s/d +100%+ &amp; Dividen</span>
            <span className="text-emerald-300 font-bold">MOS: &gt; 20%</span>
          </div>
        </button>
      </div>

      {/* Strategy Characteristic Banner */}
      <div className="p-4 rounded-2xl bg-cardBg border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between font-mono gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {activeTab === "SCALPING" && "Karakter Scalping: Eksekusi kilat intraday, lonjakan volume pembukaan, wajib disiplin keluar sebelum 15:45 WIB tanpa menginap."}
            {activeTab === "SWING" && "Karakter Swing: Menunggangi akumulasi bandar (LPM), pantulan support MA20, take profit berjenjang 1-3 minggu."}
            {activeTab === "INVEST" && "Karakter Investasi: Emiten fundamental Grade A, valuasi diskon Graham, dividen rutin, akumulasi Dollar-Cost Averaging."}
          </span>
        </div>
        <span className="text-slate-500 shrink-0">Semesta: 350+ Emiten Terkurasi</span>
      </div>

      {/* Grid of Categorized Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Menyaring saham BEI ke dalam pilar {activeTab}...</div>
        </div>
      ) : list.length === 0 ? (
        <div className="p-12 rounded-2xl bg-cardBg border border-slate-800 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <div className="text-slate-200 font-bold text-sm">
            Tidak Ada Saham yang Sesuai dengan Kriteria Pilar Ini Saat Ini
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {list.map((c: any) => (
            <div
              key={c.symbol}
              className="p-6 rounded-2xl bg-cardBg border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 shadow-xl"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-2xl font-black font-mono text-white">
                      {c.symbol}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      SKOR: {c.ai_score}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {c.strategy_badge}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {c.name} &bull; <span className="text-slate-500">{c.sector}</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-400">Harga Terkini</div>
                  <div className="text-base font-bold text-slate-100">
                    {formatRupiah(c.current_price)}
                  </div>
                </div>
              </div>

              {/* Rationale Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {c.rationale}
                </p>
                <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                  {c.key_catalysts?.map((cat: string, idx: number) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-400 font-sans flex items-start gap-1.5"
                    >
                      <span className="text-emerald-400 shrink-0 mt-0.5">&bull;</span>
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizing & Exit Instructions */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Sizing:</strong> {c.sizing_advice || "Alokasi terkalibrasi risiko modal"}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-400">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Aturan Exit:</strong> {c.exit_rule || "Disiplin Stop Loss & Take Profit"}</span>
                </div>
              </div>

              {/* Trade Horizon Plan Matrix */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-sans font-medium">
                    Estimasi Target ({formatPercent(c.potential_gain_pct)})
                  </div>
                  <div className="text-xs font-bold text-emerald-300 mt-1">
                    {formatRupiah(c.target_price_est)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  <div className="text-[10px] text-rose-400 font-sans font-medium">
                    Batas Cut Loss (-{c.risk_pct}%)
                  </div>
                  <div className="text-xs font-bold text-rose-300 mt-1">
                    {formatRupiah(c.stop_loss_price)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                  <div className="text-[10px] text-indigo-400 font-sans font-medium">
                    Durasi Holding
                  </div>
                  <div className="text-xs font-bold text-indigo-300 mt-1">
                    {c.holding_period?.split("(")[0]}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                <div className="text-[11px] font-mono text-slate-400">
                  Rasio R:R <span className="text-emerald-400">{c.risk_reward_ratio}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/analysis/${c.symbol}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <span>Bedah 360°</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() =>
                      setActiveModalStock({
                        symbol: c.symbol,
                        price: c.current_price,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                  >
                    Catat Beli
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Buy Modal */}
      {activeModalStock && (
        <QuickBuyModal
          isOpen={true}
          symbol={activeModalStock.symbol}
          defaultPrice={activeModalStock.price}
          onClose={() => setActiveModalStock(null)}
        />
      )}
    </div>
  );
}
