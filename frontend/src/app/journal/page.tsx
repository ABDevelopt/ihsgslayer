"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  PieChart,
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { PortfolioSummary, JournalRecord } from "@/lib/types";
import { formatRupiah, formatPercent } from "@/lib/utils";
import QuickBuyModal from "@/components/QuickBuyModal";

export default function JournalPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const data = await api.getPortfolioSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load portfolio journal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournal();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-cardBg border border-emerald-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              FIFO ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Pencatatan Portofolio & Kurva NAV
            </span>
          </div>
          <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2 mt-1">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <span>Jurnal Portofolio & Kinerja Trading</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Sistem akuntansi portofolio otomatis dengan metode FIFO (First-In, First-Out)
            untuk menghitung Realized PnL, Unrealized PnL, dan pertumbuhan Net Asset Value (NAV).
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Transaksi Beli</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Total Ekuitas (NAV)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {formatRupiah(summary?.total_equity || 10000000)}
          </div>
          <div className="text-[11px] text-slate-500">Nilai total aset kas & saham</div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Saldo Kas RDN</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {formatRupiah(summary?.cash_balance || 10000000)}
          </div>
          <div className="text-[11px] text-slate-500">Dana siap dieksekusi</div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Nilai Pasar Saham</span>
            <PieChart className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            {formatRupiah(summary?.stock_market_value || 0)}
          </div>
          <div className="text-[11px] text-slate-500">Posisi saham terbuka</div>
        </div>

        <div className="p-5 rounded-2xl bg-cardBg border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Total Realized PnL</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatRupiah(summary?.total_pnl_rp || 0)}{" "}
            <span className="text-xs">({formatPercent(summary?.total_pnl_pct || 0)})</span>
          </div>
          <div className="text-[11px] text-slate-500">Keuntungan bersih terealisasi</div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-lg">
        <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Posisi Saham Terbuka (Open Positions)</span>
        </h4>

        {loading ? (
          <div className="py-8 text-center text-slate-400 font-mono">Memuat portofolio...</div>
        ) : !summary?.open_positions || summary.open_positions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            Belum ada posisi terbuka. Gunakan tombol &quot;Catat Transaksi Beli&quot; di atas untuk memasukkan trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4">Emiten</th>
                  <th className="py-3 px-4">Tanggal Beli</th>
                  <th className="py-3 px-4">Jumlah Lot</th>
                  <th className="py-3 px-4">Harga Beli</th>
                  <th className="py-3 px-4">Nilai Investasi</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.open_positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-emerald-400">{pos.symbol}
                            <ShariaBadge symbol={pos.symbol} /></td>
                    <td className="py-3 px-4 text-slate-400">{pos.entry_date}</td>
                    <td className="py-3 px-4 text-slate-200">{pos.shares_lot} Lot</td>
                    <td className="py-3 px-4 text-slate-200">{formatRupiah(pos.entry_price)}</td>
                    <td className="py-3 px-4 text-slate-200">
                      {formatRupiah(pos.entry_price * pos.shares_lot * 100)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        OPEN
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Buy Modal */}
      {isModalOpen && (
        <QuickBuyModal
          isOpen={true}
          symbol="BBCA.JK"
          defaultPrice={10000}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchJournal}
        />
      )}
    </div>
  );
}
