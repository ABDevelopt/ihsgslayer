"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  ArrowRight,
  Activity,
} from "lucide-react";
import { formatPercent } from "@/lib/utils";

export default function IHSGForecastWidget() {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchForecast = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/screener/ihsg-forecast?force_refresh=${force}`);
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

  if (loading && !forecast) {
    return (
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="w-48 h-6 bg-slate-800 rounded-lg" />
          <div className="w-24 h-6 bg-slate-800 rounded-lg" />
        </div>
        <div className="w-full h-12 bg-slate-900 rounded-xl" />
      </div>
    );
  }

  if (!forecast) return null;

  const ihsgVal = forecast.ihsg_current_value || 6487.30;
  const ihsgChg = forecast.ihsg_change_pct != null ? forecast.ihsg_change_pct : 1.27;
  const isIhsgUp = ihsgChg >= 0;

  return (
    <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              GLOBAL LEADING RADAR
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {forecast.prediction_date}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
            <Globe2 className="w-5 h-5 text-emerald-400" />
            <span>Prediksi Tren IHSG Harian (Bursa Asia & EIDO Wall Street)</span>
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchForecast(true)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Update Real-Time</span>
          </button>
          <Link
            href="/ihsg-forecast"
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-1 shadow-md shadow-emerald-500/20"
          >
            <span>Detail Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Verdict & IHSG Real Price Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* IHSG Current Real Value */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Indeks IHSG Terkini:</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{ihsgVal.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className={`text-xs font-bold flex items-center ${isIhsgUp ? "text-emerald-400" : "text-rose-400"}`}>
              {isIhsgUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {formatPercent(ihsgChg)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            Open: {forecast.ihsg_open ? forecast.ihsg_open.toLocaleString("id-ID") : "-"} &bull; High: {forecast.ihsg_high ? forecast.ihsg_high.toLocaleString("id-ID") : "-"}
          </div>
        </div>

        {/* Verdict */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">Prediksi Arah IHSG:</div>
          <div className="text-sm font-bold text-emerald-400 truncate">
            {forecast.verdict_label}
          </div>
          <div className="text-[10px] text-slate-500">
            Skor Sentimen: {forecast.sentiment_score}/100
          </div>
        </div>

        {/* Opening Gap Bias */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">Estimasi Gap Pembukaan:</div>
          <div className="text-sm font-bold text-cyan-300 truncate">
            {forecast.opening_gap_bias}
          </div>
          <div className="text-[10px] text-slate-500">
            Rentang: {forecast.ihsg_estimated_support?.toLocaleString("id-ID")} - {forecast.ihsg_estimated_resistance?.toLocaleString("id-ID")}
          </div>
        </div>

        {/* EIDO Proxy */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">Proxy EIDO (NYSE):</div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <span>EIDO</span>
            <span className="text-xs text-slate-300">
              (${forecast.drivers?.[0]?.current_value})
            </span>
            <span className={`text-xs font-bold ${forecast.drivers?.[0]?.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatPercent(forecast.drivers?.[0]?.change_pct || 0)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">Bobot Pengaruh: 35%</div>
        </div>
      </div>

      {/* Driver Tickers Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {forecast.drivers?.map((d: any) => {
          const isUp = d.change_pct >= 0;
          return (
            <div
              key={d.ticker}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white flex items-center gap-1">
                  <span>{d.flag}</span>
                  <span>{d.ticker}</span>
                </span>
                <span
                  className={`flex items-center font-bold ${
                    isUp ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {formatPercent(d.change_pct)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">{d.name}</div>
            </div>
          );
        })}
      </div>

      {/* Morning Action Guide Box */}
      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs flex items-start space-x-2 font-sans">
        <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-400">
            Panduan Tindakan Trader Pagi Hari:
          </span>
          <p className="text-slate-300 leading-relaxed">
            {forecast.morning_action_guide}
          </p>
        </div>
      </div>
    </div>
  );
}
