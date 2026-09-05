"use client";

import { useState } from "react";
import { X, Calculator, ShieldCheck, ArrowRight, DollarSign, Percent } from "lucide-react";
import { formatRupiah, formatPercent } from "@/lib/utils";

interface PositionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrice?: number;
  initialSymbol?: string;
  onProceedToJournal?: (symbol: string, price: number, lots: number) => void;
}

export default function PositionCalculatorModal({
  isOpen,
  onClose,
  initialPrice = 2000,
  initialSymbol = "BBCA.JK",
  onProceedToJournal,
}: PositionCalculatorModalProps) {
  const [capital, setCapital] = useState<number>(10000000); // Default Rp 10 Juta
  const [riskTolerancePct, setRiskTolerancePct] = useState<number>(1.5); // Default 1.5%
  const [entryPrice, setEntryPrice] = useState<number>(initialPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(Math.round(initialPrice * 0.97)); // -3% SL
  const [targetTP1, setTargetTP1] = useState<number>(Math.round(initialPrice * 1.05)); // +5% TP1
  const [symbol, setSymbol] = useState<string>(initialSymbol);

  if (!isOpen) return null;

  // Calculation Logic
  const maxRiskRupiah = (capital * riskTolerancePct) / 100;
  const riskPerShare = Math.max(1, entryPrice - stopLossPrice);
  const riskPct = ((entryPrice - stopLossPrice) / entryPrice) * 100;

  // Total shares = maxRiskRupiah / riskPerShare
  const rawShares = maxRiskRupiah / riskPerShare;
  const optimalLots = Math.max(1, Math.floor(rawShares / 100));
  const totalShares = optimalLots * 100;
  const totalCapitalRequired = totalShares * entryPrice;
  const portfolioAllocationPct = (totalCapitalRequired / capital) * 100;

  const potentialProfitTP1 = totalShares * (targetTP1 - entryPrice);
  const potentialLoss = totalShares * (entryPrice - stopLossPrice);
  const riskRewardRatio = (potentialProfitTP1 / Math.max(1, potentialLoss)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-cardBg border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Kalkulator Posisi & Manajemen Risiko Modal
              </h3>
              <p className="text-[11px] text-slate-400">
                Hitung jumlah lot aman agar tidak melebihi batas risiko portofolio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Modal Trading */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Total Modal Portofolio
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Toleransi Risiko % */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Toleransi Risiko per Trade
            </label>
            <select
              value={riskTolerancePct}
              onChange={(e) => setRiskTolerancePct(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="1.0">1.0% (Sangat Konservatif)</option>
              <option value="1.5">1.5% (Standar Direkomendasikan)</option>
              <option value="2.0">2.0% (Moderat Agresif)</option>
            </select>
          </div>

          {/* Harga Beli */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Harga Rencana Beli (Entry)
            </label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Harga Stop Loss */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Harga Batas Cut Loss (SL)
            </label>
            <input
              type="number"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-rose-400 focus:outline-none focus:border-rose-500 text-xs"
            />
          </div>
        </div>

        {/* Calculated Results Panel */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400">Rekomendasi Jumlah Lot:</span>
            <span className="text-xl font-bold text-emerald-400">{optimalLots} Lot</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Modal Terpakai:</span>
              <div className="font-bold text-slate-200">
                {formatRupiah(totalCapitalRequired)} ({portfolioAllocationPct.toFixed(1)}%)
              </div>
            </div>
            <div>
              <span className="text-slate-500">Maksimal Risiko Rugi:</span>
              <div className="font-bold text-rose-400">
                -{formatRupiah(potentialLoss)} ({riskTolerancePct}%)
              </div>
            </div>
            <div>
              <span className="text-slate-500">Potensi Profit (TP1):</span>
              <div className="font-bold text-emerald-400">
                +{formatRupiah(potentialProfitTP1)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Rasio Risk : Reward:</span>
              <div className="font-bold text-cyan-300">1 : {riskRewardRatio}</div>
            </div>
          </div>
        </div>

        {/* Safety Rule Note */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-slate-300 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Dengan membeli <strong>{optimalLots} lot</strong>, jika saham terkena Cut Loss di Rp{" "}
            {stopLossPrice.toLocaleString("id-ID")}, modal Anda hanya berkurang{" "}
            <strong>{formatRupiah(potentialLoss)}</strong> (tetap aman &lt; {riskTolerancePct}% modal total).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            Tutup
          </button>
          {onProceedToJournal && (
            <button
              onClick={() => {
                onProceedToJournal(symbol, entryPrice, optimalLots);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20"
            >
              <span>Gunakan Lot Ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
