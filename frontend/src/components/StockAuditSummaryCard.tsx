"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Target,
  TrendingUp,
  ShieldCheck,
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Info,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatRupiah, formatPercent } from "@/lib/utils";

interface StockAuditSummaryCardProps {
  symbol: string;
}

export default function StockAuditSummaryCard({ symbol }: StockAuditSummaryCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [strategyFilter, setStrategyFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const cleanSym = symbol.toUpperCase().replace(".JK", "");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.getStockEvaluation(cleanSym);
        if (isMounted) setData(res);
      } catch (e) {
        console.error("Gagal memuat rekam jejak audit emiten:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [cleanSym]);

  useEffect(() => {
    setCurrentPage(1);
  }, [cleanSym, strategyFilter, statusFilter, pageSize]);

  const records: any[] = data?.records || [];

  const filteredRecords = useMemo(() => {
    return records.filter((r: any) => {
      if (strategyFilter !== "ALL") {
        if (strategyFilter === "BUY_LAYAK") {
          if (!["BUY_LAYAK", "HYBRID_QUANT"].includes(r.strategy_type)) return false;
        } else if (r.strategy_type !== strategyFilter) {
          return false;
        }
      }
      if (statusFilter !== "ALL" && r.outcome_status !== statusFilter) return false;
      return true;
    });
  }, [records, strategyFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  const getPaginationRange = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    const left = safePage - delta;
    const right = safePage + delta + 1;
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }

    const rangeWithDots: (number | string)[] = [];
    for (const i of range) {
      if (typeof l === "number" && typeof i === "number") {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      if (typeof i === "number") l = i;
    }
    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.total_signals === 0) {
    return (
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Rangkuman Rekam Jejak &amp; Win Rate Sinyal: {cleanSym}</span>
          </h3>
          <Link
            href="/evaluation"
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Buka Audit Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Belum ada rekaman sinyal kuantitatif yang selesai dievaluasi untuk emiten {cleanSym} pada jendela audit saat ini. Sinyal baru yang terpicu dari Screener akan otomatis dicatat ke sistem audit secara forward-test.
        </p>
      </div>
    );
  }

  const {
    total_signals = 0,
    evaluated_count = 0,
    win_count = 0,
    loss_count = 0,
    pending_count = 0,
    win_rate_pct = 0,
    avg_win_pct = 0,
    avg_loss_pct = 0,
    profit_factor = 0,
    net_total_pnl_pct = 0,
    strategies = {},
  } = data;

  const winRateColor =
    win_rate_pct >= 70
      ? "text-emerald-400"
      : win_rate_pct >= 50
      ? "text-cyan-400"
      : "text-rose-400";

  return (
    <div className="p-6 rounded-2xl bg-cardBg border border-amber-500/30 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              AUDIT HISTORIS EMITEN
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Evaluasi Objektif Pasar Riil BEI
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Rekam Jejak Sinyal &amp; Win Rate: {cleanSym}</span>
          </h3>
        </div>

        <Link
          href="/evaluation"
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-amber-400 flex items-center gap-1.5 transition-all self-end sm:self-auto"
        >
          <span>Audit Studio Lengkap</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-sans">Win Rate Sinyal:</div>
          <div className={`text-2xl font-black mt-1 ${winRateColor}`}>
            {win_rate_pct}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {win_count} Menang &bull; {loss_count} Kalah
            {pending_count > 0 && ` &bull; ${pending_count} Aktif`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-sans">Total Sinyal Terbit:</div>
          <div className="text-2xl font-black text-slate-100 mt-1">
            {total_signals}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {evaluated_count} Selesai Dievaluasi
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-sans">Profit Factor:</div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {profit_factor >= 20 ? ">20.0x" : `${profit_factor}x`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg Win +{avg_win_pct}% &bull; Loss {avg_loss_pct}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-sans">Net PnL Sinyal:</div>
          <div className={`text-2xl font-black mt-1 ${net_total_pnl_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {net_total_pnl_pct >= 0 ? "+" : ""}{net_total_pnl_pct}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Akumulasi Gain Bersih
          </div>
        </div>
      </div>

      {/* Strategy Breakdown Grid */}
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Performa Win Rate Berdasarkan Model Strategi:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {[
            { key: "BPJS", label: "BPJS (Pagi)", color: "emerald" },
            { key: "BSJP", label: "BSJP (Sore)", color: "cyan" },
            { key: "PRE_ARA", label: "Pre-ARA Hunter", color: "violet" },
            { key: "BUY_LAYAK", label: "BUY (Layak) AI", color: "amber" },
          ].map(({ key, label, color }) => {
            const st = strategies[key] || { total: 0, win_count: 0, win_rate: 0 };
            return (
              <div
                key={key}
                className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between"
              >
                <div className="text-[10px] text-slate-400 font-sans">{label}</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-sm font-bold ${st.win_rate >= 60 ? "text-emerald-400" : st.total > 0 ? "text-amber-400" : "text-slate-500"}`}>
                    {st.total > 0 ? `${st.win_rate}%` : "—"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {st.win_count}/{st.total} Win
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Signals Table with Filters & Pagination */}
      {records.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm font-mono">
                  Riwayat Transaksi Terakhir {cleanSym}:
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {records.length} Total Sinyal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Menampilkan <span className="text-slate-200 font-semibold">{filteredRecords.length > 0 ? startIndex + 1 : 0}–{endIndex}</span> dari{" "}
                <span className="text-slate-200 font-semibold">{filteredRecords.length}</span> transaksi{" "}
                {filteredRecords.length !== records.length && `(difilter dari ${records.length} total)`}
              </p>
            </div>

            {/* Filter and Page Size Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {/* Strategy Filter */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 px-1.5 uppercase tracking-wider font-semibold">Model:</span>
                <select
                  value={strategyFilter}
                  onChange={(e) => setStrategyFilter(e.target.value)}
                  aria-label="Filter Model Strategi"
                  className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">Semua Model</option>
                  <option value="BPJS">BPJS (Pagi)</option>
                  <option value="BSJP">BSJP (Sore)</option>
                  <option value="PRE_ARA">Pre-ARA Hunter</option>
                  <option value="BUY_LAYAK">BUY (Layak) AI</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 px-1.5 uppercase tracking-wider font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter Status Hasil"
                  className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="WIN">WIN (Profit)</option>
                  <option value="LOSS">LOSS (Rugi)</option>
                  <option value="PENDING">PENDING (Berjalan)</option>
                </select>
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 px-1.5 uppercase tracking-wider font-semibold">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Jumlah baris per halaman"
                  className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={999999}>Semua</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-[11px] font-mono text-left">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tanggal &amp; Strategi</th>
                  <th className="py-2.5 px-3">Tingkat Kepercayaan</th>
                  <th className="py-2.5 px-3 text-right">Entry</th>
                  <th className="py-2.5 px-3 text-right">Target TP1</th>
                  <th className="py-2.5 px-3 text-right">Exit Riil</th>
                  <th className="py-2.5 px-3">Waktu Realisasi</th>
                  <th className="py-2.5 px-3 text-right">Hasil PnL</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada rekaman transaksi yang cocok dengan kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r: any, idx: number) => {
                    const isWin = r.outcome_status === "WIN";
                    const isLoss = r.outcome_status === "LOSS";
                    const pnl = r.realized_pnl_pct;
                    const conf = r.confidence_level || "MODERATE";

                    return (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-200">{r.signal_date}</div>
                          <div className="text-[10px] text-slate-400">
                            {r.strategy_type === "BUY_LAYAK" ? "BUY (LAYAK)" : r.strategy_type} &bull; {r.signal_time}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                              conf.includes("ULTRA")
                                ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                                : conf.includes("HIGH") || conf.includes("Tinggi")
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                            }`}
                          >
                            {conf}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-300 font-bold">
                          {formatRupiah(r.entry_price)}
                        </td>

                        <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                          {r.target_tp1 ? formatRupiah(r.target_tp1) : "—"}
                        </td>

                        <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                          {r.actual_exit_price ? formatRupiah(r.actual_exit_price) : "—"}
                        </td>

                        <td className="py-2.5 px-3 text-slate-300 text-[10px]">
                          {r.actual_exit_time || r.target_exit_time || "Sesi Penutupan"}
                        </td>

                        <td className={`py-2.5 px-3 text-right font-bold ${
                          pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-rose-400" : "text-slate-400"
                        }`}>
                          {pnl != null ? `${pnl > 0 ? "+" : ""}${pnl.toFixed(2)}%` : "—"}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isWin
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : isLoss
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {r.outcome_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-mono">
              <div className="text-slate-400 text-[11px]">
                Halaman <span className="text-slate-200 font-bold">{safePage}</span> dari <span className="text-slate-200 font-bold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 flex items-center gap-1 text-[11px] transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPaginationRange().map((item, i) =>
                    item === "..." ? (
                      <span key={`dots-${i}`} className="px-1.5 py-0.5 text-slate-600">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(Number(item))}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          safePage === item
                            ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 flex items-center gap-1 text-[11px] transition-all"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
