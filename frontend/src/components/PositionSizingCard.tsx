"use client";

import React, { useState } from "react";
import {
  Wallet,
  ShieldAlert,
  TrendingUp,
  Check,
  Copy,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Zap,
  Info
} from "lucide-react";
import { calculatePositionSizing } from "@/lib/sizing";
import { formatRupiah, formatPercent } from "@/lib/utils";

interface PositionSizingCardProps {
  symbol: string;
  price: number;
  score?: number;
  stopLossPct?: number;
  tp1GainPct?: number;
  atrPct?: number;
  totalCapital?: number;
  onQuickBuy?: (lots: number, price: number) => void;
}

export default function PositionSizingCard({
  symbol,
  price,
  score = 70.0,
  stopLossPct = 2.5,
  tp1GainPct = 4.5,
  atrPct,
  totalCapital = 10_000_000,
  onQuickBuy
}: PositionSizingCardProps) {
  const [copied, setCopied] = useState(false);

  const sizing = calculatePositionSizing(
    price,
    score,
    totalCapital,
    stopLossPct,
    tp1GainPct,
    symbol,
    atrPct
  );

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(sizing.brokerOrderSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tierColor =
    sizing.convictionTier === "ULTRA"
      ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
      : sizing.convictionTier === "HIGH"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : sizing.convictionTier === "MODERATE"
      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
      : "bg-slate-800 text-slate-300 border-slate-700";

  const volBadgeColor =
    sizing.volatilityCategory === "RENDAH"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : sizing.volatilityCategory === "TINGGI"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3 shadow-md font-mono">
      {/* Header: Title & Conviction Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
            <Wallet className="w-3.5 h-3.5" />
            <span>SARAN ALOKASI MODAL</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">
            (Basis: {formatRupiah(totalCapital)})
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* ATR Volatility Badge */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${volBadgeColor}`}
            title="Average True Range 14-Day: Pengukur volatilitas ayunan harga harian"
          >
            <Activity className="w-2.5 h-2.5" />
            <span>ATR: {sizing.atrPct}% ({sizing.volatilityCategory})</span>
          </span>

          {/* Conviction Tier Badge */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tierColor}`}>
            {sizing.convictionLabel}
          </span>
        </div>
      </div>

      {/* Grid: Lots & Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {/* Recommended Lots */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-sans">Saran Pembelian:</div>
          <div className="text-base font-black text-amber-300 mt-0.5">
            {sizing.lots} Lot
          </div>
          <div className="text-[9px] text-slate-500">
            {sizing.totalShares.toLocaleString("id-ID")} lembar
          </div>
        </div>

        {/* Real Capital Needed */}
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-sans">Dana Pembelian:</div>
          <div className="text-xs font-bold text-slate-200 mt-1">
            {formatRupiah(sizing.nominalRealRp)}
          </div>
          <div className="text-[9px] text-slate-500">
            + Fee {formatRupiah(sizing.feeBuyRp)}
          </div>
        </div>

        {/* Potential Profit (TP1) */}
        <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
          <div className="text-[10px] text-emerald-400 font-sans">Potensi Cuan (TP1):</div>
          <div className="text-xs font-bold text-emerald-300 mt-1">
            +{formatRupiah(sizing.potentialProfitRp)}
          </div>
          <div className="text-[9px] text-emerald-500">
            Target +{tp1GainPct.toFixed(1)}%
          </div>
        </div>

        {/* Maximum Risk (Cut Loss) */}
        <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30">
          <div className="text-[10px] text-rose-400 font-sans">Maks. Risiko (SL):</div>
          <div className="text-xs font-bold text-rose-300 mt-1">
            -{formatRupiah(sizing.maxRiskRp)}
          </div>
          <div className="text-[9px] text-rose-400/80">
            {sizing.portfolioRiskPct}% portofolio
          </div>
        </div>
      </div>

      {/* Volatility Calibration Note */}
      {sizing.isVolatilityTrimmed && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-sans flex items-start gap-1.5 leading-tight">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Ukuran lot saham ini disesuaikan otomatis dengan volatilitas ayunan harian (ATR {sizing.atrPct}%) demi menjamin risiko kerugian rupiah tetap di bawah batas toleransi portofolio.
          </span>
        </div>
      )}

      {/* Action Buttons: Copy Broker Order & One-Click Buy */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopyOrder}
          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          title="Salin format order broker siap paste di aplikasi sekuritas"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Format Order Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Salin Order Broker ({sizing.lots} Lot)</span>
            </>
          )}
        </button>

        {onQuickBuy && (
          <button
            type="button"
            onClick={() => onQuickBuy(sizing.lots, price)}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <span>Beli Langsung ({sizing.lots} Lot)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
