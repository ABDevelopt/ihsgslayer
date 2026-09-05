"use client";

import React, { useState } from "react";
import { X, CheckCircle2, DollarSign, Calculator, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { api } from "@/lib/api";

interface QuickBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  defaultPrice: number;
  defaultLots?: number;
  onSuccess?: () => void;
}

export default function QuickBuyModal({
  isOpen,
  onClose,
  symbol,
  defaultPrice,
  defaultLots = 10,
  onSuccess,
}: QuickBuyModalProps) {
  const [price, setPrice] = useState<number>(defaultPrice || 1000);
  const [lots, setLots] = useState<number>(defaultLots || 10);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultPrice) setPrice(defaultPrice);
    if (defaultLots) setLots(defaultLots);
  }, [defaultPrice, defaultLots]);

  if (!isOpen) return null;

  const totalShares = lots * 100;
  const totalValue = totalShares * price;
  const feeEstimate = totalValue * 0.0015; // 0.15% fee
  const totalCost = totalValue + feeEstimate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.addJournalEntry({
        symbol,
        entry_price: price,
        shares_lot: lots,
        notes: notes || `Quick Buy dari Screener pada harga ${formatRupiah(price)}`,
      });
      setSuccessMsg(`Berhasil mencatat pembelian ${lots} lot ${symbol}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      alert("Gagal mencatat transaksi: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-cardBg border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              TRADING JOURNAL
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Catat Beli Saham <span className="font-mono text-emerald-400">{symbol}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="text-emerald-300 font-bold text-sm">{successMsg}</div>
            <p className="text-xs text-slate-400">Otomatis memperbarui portofolio & NAV...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Input Harga */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Harga Pembelian (Rp / lembar)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                required
              />
            </div>

            {/* Input Lot */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 font-medium">Jumlah Lot</label>
                <span className="text-slate-500 font-mono">1 Lot = 100 Lembar</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={lots}
                  onChange={(e) => setLots(Number(e.target.value))}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                  required
                />
                <div className="flex space-x-1 font-mono">
                  <button
                    type="button"
                    onClick={() => setLots((prev) => Math.max(1, prev + 5))}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setLots((prev) => Math.max(1, prev + 10))}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* Total Calculation Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Nilai Transaksi ({totalShares.toLocaleString("id-ID")} lbr):</span>
                <span className="text-slate-200">{formatRupiah(totalValue)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimasi Fee Broker (0.15%):</span>
                <span className="text-slate-200">{formatRupiah(feeEstimate)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1.5 border-t border-slate-800">
                <span>Total Modal Diperlukan:</span>
                <span>{formatRupiah(totalCost)}</span>
              </div>
            </div>

            {/* Input Notes */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">
                Catatan Rencana / Alasan Beli (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Beli Pagi momentum volume spike, target TP1 +3.5%"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <span>Simpan ke Jurnal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
