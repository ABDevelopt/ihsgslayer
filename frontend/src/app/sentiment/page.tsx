"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Newspaper,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Zap,
  Activity
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api/v1";

interface MacroDriver {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  change_pct: number;
  change_nominal: number;
  status: string;
}

interface SectorImpact {
  sector_key: string;
  benchmark_symbol: string;
  benchmark_name: string;
  unit: string;
  price: number;
  change_pct: number;
  impact_type: string;
  bias: string;
  score_adjustment: number;
  badge: string;
  reason: string;
  affected_stocks: string[];
}

interface NewsItem {
  id: string;
  symbol?: string;
  title: string;
  source: string;
  timestamp: number;
  url: string;
  sentiment_score: number;
  sentiment_label: string;
  badge: string;
  badge_color: string;
  is_critical_risk: boolean;
  matched_keywords: string[];
}

export default function SentimentIntelligencePage() {
  const [macroData, setMacroData] = useState<{
    market_climate?: string;
    climate_badge?: string;
    climate_color?: string;
    overall_macro_bias?: number;
    drivers?: Record<string, MacroDriver>;
    sectors_impact?: SectorImpact[];
  }>({});
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [filterType, setFilterType] = useState<"ALL" | "POSITIF" | "NEGATIF" | "KRITIS">("ALL");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [lookupSymbol, setLookupSymbol] = useState("MEDC");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [resMacro, resNews] = await Promise.all([
        fetch(`${API_BASE}/sentiment/macro-commodities`),
        fetch(`${API_BASE}/sentiment/news/latest?limit=30`),
      ]);

      if (resMacro.ok) {
        setMacroData(await resMacro.json());
      }
      if (resNews.ok) {
        setNewsFeed(await resNews.json());
      }
    } catch (err) {
      console.error("Error fetching sentiment data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleLookup = useCallback(async (sym: string) => {
    if (!sym) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sentiment/stock/${sym.trim().toUpperCase()}`);
      if (res.ok) {
        setLookupResult(await res.json());
      } else {
        setLookupResult(null);
      }
    } catch (err) {
      console.error("Error looking up emiten sentiment:", err);
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    handleLookup("MEDC");
  }, [fetchData, handleLookup]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    if (lookupSymbol) handleLookup(lookupSymbol);
  };

  const filteredNews = newsFeed.filter((item) => {
    if (searchSymbol && !item.title.toLowerCase().includes(searchSymbol.toLowerCase()) && !item.symbol?.toLowerCase().includes(searchSymbol.toLowerCase())) {
      return false;
    }
    if (filterType === "POSITIF") return item.sentiment_score >= 0.3;
    if (filterType === "NEGATIF") return item.sentiment_score <= -0.2 && !item.is_critical_risk;
    if (filterType === "KRITIS") return item.is_critical_risk;
    return true;
  });

  const climateColor = macroData.climate_color === "emerald"
    ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
    : macroData.climate_color === "rose"
    ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
    : "text-slate-300 border-slate-700 bg-slate-800/40";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-cardBg border border-cyan-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              SENTIMENT ENGINE v2
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${climateColor}`}>
              {macroData.climate_badge || "[MAKRO NETRAL]"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Bias Skor: {macroData.overall_macro_bias && macroData.overall_macro_bias > 0 ? `+${macroData.overall_macro_bias}` : macroData.overall_macro_bias || 0} Poin
            </span>
          </div>
          <h2 className="font-bold text-xl text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Intelijen Sentimen & Katalis Makro Global
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sistem 4-Lapis Pemantauan Berita & Makro: Menganalisis korelasi harga komoditas dunia, kurs Rupiah, keterbukaan informasi BEI, deteksi bahaya PKPU/suspensi, serta peringatan sell-on-news.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
          {refreshing ? "Memperbarui..." : "Sinkronisasi Live"}
        </button>
      </div>

      {/* Lapis 1: Global Macro & Commodity Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
              Lapis 1: Barometer Komoditas & Makro Global
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Sumber: Real-Time Benchmark Futures & Currencies
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {macroData.sectors_impact?.map((sec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {sec.benchmark_name}
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                    {sec.price.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{sec.unit}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      sec.change_pct >= 0
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {sec.change_pct >= 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                    {sec.change_pct >= 0 ? `+${sec.change_pct}%` : `${sec.change_pct}%`}
                  </span>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">{sec.badge}</div>
                </div>
              </div>

              <p className="text-[11px] font-mono text-slate-400 leading-snug">
                {sec.reason}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Emiten Terpengaruh:</span>
                <div className="flex gap-1 flex-wrap">
                  {sec.affected_stocks.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const c = s.replace(".JK", "");
                        setLookupSymbol(c);
                        handleLookup(c);
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 border border-slate-700 text-[10px] font-mono"
                    >
                      {s.replace(".JK", "")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lapis 3 & 4: 360-Degree Emiten Sentiment & Sell-on-News Inspector */}
      <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
              Lapis 3 & 4: Inspektur Sentimen & Sell-On-News Emiten
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <input
                type="text"
                placeholder="Cari kode saham..."
                value={lookupSymbol}
                onChange={(e) => setLookupSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleLookup(lookupSymbol)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={() => handleLookup(lookupSymbol)}
              disabled={lookupLoading}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
            >
              {lookupLoading ? "Memeriksa..." : "Periksa"}
            </button>
          </div>
        </div>

        {lookupResult && (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono text-cyan-400">{lookupResult.symbol}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      lookupResult.sentiment?.badge_color === "rose"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : lookupResult.sentiment?.badge_color === "emerald"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {lookupResult.sentiment?.badge || "[NETRAL]"}
                  </span>
                  {lookupResult.macro_impact?.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {lookupResult.macro_impact?.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {lookupResult.sentiment?.summary}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Penyesuaian AI Score</span>
                  <span
                    className={`text-lg font-bold font-mono ${
                      lookupResult.combined_ai_score_adjustment > 0
                        ? "text-emerald-400"
                        : lookupResult.combined_ai_score_adjustment < 0
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {lookupResult.combined_ai_score_adjustment > 0
                      ? `+${lookupResult.combined_ai_score_adjustment}`
                      : lookupResult.combined_ai_score_adjustment}{" "}
                    Poin
                  </span>
                </div>
              </div>
            </div>

            {/* Circuit Breaker & Divergence Trap Notifications */}
            {lookupResult.circuit_breaker_active && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong>CIRCUIT BREAKER AKTIF:</strong> Terdeteksi keterbukaan berisiko hukum atau gagal bayar (PKPU / Suspensi). Sinyal beli otomatis dinonaktifkan untuk melindungi modal Anda.
                </div>
              </div>
            )}

            {lookupResult.divergence_trap && (
              <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong>WASPADA PERANGKAP DISTRIBUSI (SELL ON NEWS):</strong> Meskipun berita publik tampak positif, pergerakan order-flow dan broker akumulasi mendeteksi distribusi smart money / buang barang. Jangan FOMO beli di pucuk.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lapis 2: Live Domestic News & Disclosures Feed */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
              Lapis 2: Arus Keterbukaan Informasi BEI & Berita Finansial
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            {(["ALL", "POSITIF", "NEGATIF", "KRITIS"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                  filterType === type
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                [{type}]
              </button>
            ))}

            {/* Keyword Search */}
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Cari berita..."
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* News Table */}
        <div className="rounded-2xl bg-cardBg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Emiten</th>
                  <th className="py-2.5 px-4 font-normal">Judul Berita / Keterbukaan Informasi</th>
                  <th className="py-2.5 px-4 font-normal">Sumber</th>
                  <th className="py-2.5 px-4 font-normal text-right">Polaritas</th>
                  <th className="py-2.5 px-4 font-normal text-center">Klasifikasi Sentimen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredNews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada berita yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredNews.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        {item.symbol ? item.symbol.replace(".JK", "") : "IHSG"}
                      </td>
                      <td className="py-3 px-4 text-slate-200 max-w-xl">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                        </a>
                        {item.matched_keywords && item.matched_keywords.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {item.matched_keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {item.source}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span
                          className={
                            item.sentiment_score > 0
                              ? "text-emerald-400"
                              : item.sentiment_score < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }
                        >
                          {item.sentiment_score > 0 ? `+${item.sentiment_score}` : item.sentiment_score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.badge_color === "rose"
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : item.badge_color === "emerald"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : item.badge_color === "amber"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}