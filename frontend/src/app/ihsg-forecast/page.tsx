"use client";

import { ShariaBadge } from "@/components/ShariaBadge";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  ShieldCheck,
  Compass,
  DollarSign,
  Scale,
  Clock,
  Layers,
  Activity,
} from "lucide-react";
import { formatPercent } from "@/lib/utils";

export default function IHSGForecastPage() {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchForecast = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/screener/ihsg-forecast?force_refresh=${force}`
      );
      const data = await res.json();
      setForecast(data);
    } catch (err) {
      console.error("Failed to fetch IHSG forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const ihsgVal = forecast?.ihsg_current_value || 6487.30;
  const ihsgChg = forecast?.ihsg_change_pct != null ? forecast.ihsg_change_pct : 1.27;
  const isIhsgUp = ihsgChg >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              GLOBAL MACRO RADAR & IHSG PREDICTOR
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Update: {forecast?.prediction_date || "Memuat..."}
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Globe2 className="w-6 h-6 text-emerald-400" />
            <span>Prediksi Tren IHSG Harian (Bursa Asia & Proxy Global)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sistem meramalkan arah pembukaan dan tren harian IHSG secara kuantitatif berdasarkan
            performa proxy saham Indonesia di New York (<strong>EIDO</strong>) dan indeks bursa
            saham pembuka di Asia (<strong>Nikkei 225 Tokyo</strong>, <strong>Hang Seng HK</strong>,{" "}
            <strong>KOSPI Korea</strong>, dan <strong>STI Singapura</strong>).
          </p>
        </div>

        <button
          onClick={() => fetchForecast(true)}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Update Data Global</span>
        </button>
      </div>

      {loading && !forecast ? (
        <div className="py-20 text-center text-slate-400 font-mono space-y-3">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Menganalisis pergerakan bursa saham Asia, Wall Street, dan EIDO...</div>
        </div>
      ) : forecast ? (
        <div className="space-y-6">
          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Live Real IHSG Metric */}
            <div className="p-6 rounded-2xl bg-cardBg border border-cyan-500/40 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>INDEKS IHSG TERKINI</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-2">
                <span>{ihsgVal.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`text-xs font-bold flex items-center ${isIhsgUp ? "text-emerald-400" : "text-rose-400"}`}>
                  {isIhsgUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatPercent(ihsgChg)}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Open: <span className="text-slate-100">{forecast.ihsg_open ? forecast.ihsg_open.toLocaleString("id-ID") : "-"}</span> &bull; High: <span className="text-slate-100">{forecast.ihsg_high ? forecast.ihsg_high.toLocaleString("id-ID") : "-"}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Data real indeks Bursa Efek Indonesia (^JKSE).
              </p>
            </div>

            {/* Verdict */}
            <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>VONIS ARAH IHSG HARI INI</span>
                <Compass className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-black font-mono text-emerald-300">
                {forecast.verdict_label}
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Skor Sentimen:{" "}
                <span className="font-bold text-emerald-400">
                  {forecast.sentiment_score} / 100
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Kombinasi bobot 6 pendorong indeks global & Asia.
              </p>
            </div>

            {/* Opening Gap Bias */}
            <div className="p-6 rounded-2xl bg-cardBg border border-cyan-500/40 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>ESTIMASI GAP PEMBUKAAN</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-black font-mono text-cyan-300">
                {forecast.opening_gap_bias}
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Supp:{" "}
                <span className="text-slate-100">
                  {forecast.ihsg_estimated_support?.toLocaleString("id-ID")}
                </span>{" "}
                &bull; Res:{" "}
                <span className="text-emerald-400">
                  {forecast.ihsg_estimated_resistance?.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Rentang target fluktuasi indeks acuan.
              </p>
            </div>

            {/* EIDO Proxy */}
            <div className="p-6 rounded-2xl bg-cardBg border border-indigo-500/40 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>KORELASI PROXY EIDO (NYSE)</span>
                <Globe2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black font-mono text-indigo-300">
                ${forecast.drivers?.[0]?.current_value}{" "}
                <span className={`text-base font-bold ${forecast.drivers?.[0]?.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ({formatPercent(forecast.drivers?.[0]?.change_pct || 0)})
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Bobot Pengaruh: <span className="text-indigo-400 font-bold">35%</span> (Utama)
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                iShares MSCI Indonesia ETF di New York.
              </p>
            </div>
          </div>

          {/* Rationale & Action Guide Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-3 shadow-lg">
              <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <span>Analisis Logika Kuantitatif Sentimen Pasar</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {forecast.summary_rationale}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/30 space-y-3 shadow-lg">
              <h4 className="font-bold text-base text-emerald-400 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Rekomendasi Strategi Trader Pagi Hari (09:00 - 10:00 WIB)</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {forecast.morning_action_guide}
              </p>
            </div>
          </div>

          {/* Table of Drivers */}
          <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-lg">
            <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Matriks Pendorong Pasar Asia & Global (Key Global Drivers)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Bursa / Instrumen</th>
                    <th className="py-3 px-4">Negara Asal</th>
                    <th className="py-3 px-4">Nilai Terkini</th>
                    <th className="py-3 px-4">Perubahan (%)</th>
                    <th className="py-3 px-4">Bobot Pengaruh</th>
                    <th className="py-3 px-4">Status Sentimen</th>
                    <th className="py-3 px-4">Peran Kunci</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {forecast.drivers?.map((d: any) => {
                    const isUp = d.change_pct >= 0;
                    return (
                      <tr key={d.ticker} className="hover:bg-slate-800/40 transition-colors text-xs">
                        <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                          <span className="text-base">{d.flag}</span>
                          <span>{d.ticker}</span>
                          <span className="text-[11px] text-slate-400 font-sans font-normal">
                            ({d.name})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{d.country}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-200">
                          {d.current_value ? d.current_value.toLocaleString("id-ID") : "-"}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-mono font-bold ${
                            isUp ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatPercent(d.change_pct)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {d.impact_weight_pct}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              d.sentiment === "BULLISH"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : d.sentiment === "BEARISH"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {d.sentiment}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs">
                          {d.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
