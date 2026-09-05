"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart2,
  RefreshCw,
  Layers,
  Compass,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { StockUniverseItem } from "@/lib/types";
import { formatRupiah, formatPercent } from "@/lib/utils";

export default function OrderFlowPage() {
  const [universe, setUniverse] = useState<StockUniverseItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BMRI.JK");
  const [orderFlowData, setOrderFlowData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<"lpm" | "delta">("lpm");

  useEffect(() => {
    api.getUniverse().then((res) => {
      if (res.universe) {
        setUniverse(res.universe);
      }
    });
  }, []);

  const loadStockData = async (sym = selectedSymbol) => {
    setLoading(true);
    try {
      const data = await api.getStockOrderFlow(sym, "60d");
      setOrderFlowData(data);
    } catch (err) {
      console.error("Failed to load order flow:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSymbol) {
      loadStockData(selectedSymbol);
    }
  }, [selectedSymbol]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-cyan-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              BANDAR METRICS × ORDER-FLOW
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Liquidity Provision Metric (LPM)
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>Order-Flow & Jejak Akumulasi Bandar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Deteksi aliran dana investor institusi besar (<em>Big Money / Bandar</em>), Volume Absorption
            Index, dan Hidden Accumulation di balik fluktuasi harga retail.
          </p>
        </div>

        {/* Stock Selector */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer w-full sm:w-64"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol} className="bg-slate-900 text-slate-200">
                {u.symbol} - {u.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadStockData(selectedSymbol)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50"
            title="Refresh Data Order-Flow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !orderFlowData ? (
        <div className="py-20 text-center text-cyan-400 font-mono space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>Menghitung matriks Order-Flow & Kurva LPM untuk {selectedSymbol}...</div>
        </div>
      ) : orderFlowData ? (
        <div className="space-y-6">
          {/* 3 Main Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {/* Card 1: Skor LPM */}
            <div className="p-5 rounded-2xl bg-cardBg border border-cyan-500/30 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>SKOR TEKANAN LPM</span>
                <Compass className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-300">
                {orderFlowData.lpm_score?.toFixed(1) || "75.0"}{" "}
                <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-xs text-slate-300 font-semibold font-sans">
                Status:{" "}
                <span
                  className={
                    orderFlowData.lpm_score >= 65
                      ? "text-emerald-400 font-bold"
                      : "text-amber-400 font-bold"
                  }
                >
                  {orderFlowData.lpm_score >= 65
                    ? "AKUMULASI MASIF"
                    : orderFlowData.lpm_score >= 45
                    ? "AKUMULASI NORMAL"
                    : "DISTRIBUSI"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Mengukur konsistensi institusi menampung volume di bawah harga pasar.
              </p>
            </div>

            {/* Card 2: Volume Intensity */}
            <div className="p-5 rounded-2xl bg-cardBg border border-emerald-500/30 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>VOLUME INTENSITY</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400">
                {orderFlowData.volume_intensity?.toFixed(2) || "1.85"}x
              </div>
              <div className="text-xs text-slate-300 font-semibold font-sans">
                Daya Serap:{" "}
                <span className="text-emerald-300 font-bold">
                  {orderFlowData.absorption_efficiency >= 1.3
                    ? "Bandar Menyerap Antrean"
                    : "Rotasi Volume Seimbang"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Rasio lonjakan transaksi pembeli terhadap likuiditas normal 20 hari.
              </p>
            </div>

            {/* Card 3: Hidden Accumulation */}
            <div className="p-5 rounded-2xl bg-cardBg border border-indigo-500/30 space-y-2 shadow-lg">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>HIDDEN ACCUMULATION</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-indigo-300">
                {orderFlowData.is_hidden_accumulation ? (
                  <span className="text-emerald-400">TERDETEKSI</span>
                ) : (
                  <span className="text-slate-300">
                    {(orderFlowData.accumulation_fraction * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300 font-semibold font-sans">
                Konsentrasi:{" "}
                <span className="text-emerald-400 font-bold">
                  {orderFlowData.is_hidden_accumulation
                    ? "Bandar Menguasai Suplai"
                    : "Institusi Dominan"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Volume diserap oleh broker dominan tanpa lonjakan harga retail yang liar.
              </p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-cyan-400" />
                  <span>
                    Visualisasi Order-Flow & Kurva Akumulasi Bandar ({selectedSymbol})
                  </span>
                </h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Analisis pergerakan modal institusional selama 60 hari bursa terakhir.
                </p>
              </div>

              {/* Chart Tabs */}
              <div className="flex items-center space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveChartTab("lpm")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeChartTab === "lpm"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Kurva LPM (Kumulatif)
                </button>
                <button
                  onClick={() => setActiveChartTab("delta")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeChartTab === "delta"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Signed Volume Delta
                </button>
              </div>
            </div>

            {/* Render Selected Chart */}
            <div className="w-full h-80 pt-2">
              {activeChartTab === "lpm" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={orderFlowData.lpm_series || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="lpmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `${(val / 1e6).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#f8fafc",
                        fontFamily: "monospace",
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString("id-ID")}`,
                        name === "lpm" ? "Tekanan LPM" : name,
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="lpm"
                      name="Tekanan LPM"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#lpmGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={orderFlowData.lpm_series || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `${(val / 1e6).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#f8fafc",
                        fontFamily: "monospace",
                      }}
                      formatter={(val: any) => [
                        `${Number(val).toLocaleString("id-ID")} Lembar`,
                        "Signed Volume Delta",
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
                    <Bar dataKey="delta" name="Signed Delta">
                      {(orderFlowData.lpm_series || []).map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.delta >= 0 ? "#10b981" : "#f43f5e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                <span>Kurva LPM menanjak = Big Money aktif menampung volume</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>Bar Hijau = Net Agresi HAKA (Beli)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block ml-2" />
                <span>Bar Merah = Net Agresi HAKI (Jual)</span>
              </span>
            </div>
          </div>

          {/* Narrative Summary Box */}
          <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-3 shadow-lg">
            <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>
                Kesimpulan Narasi Bandar & Aliran Dana ({selectedSymbol} - {orderFlowData.name})
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {orderFlowData.narrative}
            </p>
            <div className="pt-2 flex justify-end">
              <Link
                href={`/analysis/${selectedSymbol}`}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
              >
                <span>Buka Analisis 360° {selectedSymbol}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
