"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Settings2, Check, RefreshCw } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface PortfolioCapitalToolbarProps {
  currentCapital: number;
  onCapitalChange: (cap: number) => void;
}

const CAPITAL_PRESETS = [
  { label: "5 Jt", value: 5_000_000 },
  { label: "10 Jt (Standar)", value: 10_000_000 },
  { label: "25 Jt", value: 25_000_000 },
  { label: "50 Jt", value: 50_000_000 },
  { label: "100 Jt", value: 100_000_000 },
];

export default function PortfolioCapitalToolbar({
  currentCapital,
  onCapitalChange
}: PortfolioCapitalToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState(String(currentCapital));

  const handleSelectPreset = (val: number) => {
    onCapitalChange(val);
    setCustomInput(String(val));
    try {
      localStorage.setItem("ihsg_user_capital", String(val));
    } catch {}
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(customInput.replace(/[^0-9]/g, ""));
    if (parsed >= 1_000_000) {
      onCapitalChange(parsed);
      try {
        localStorage.setItem("ihsg_user_capital", String(parsed));
      } catch {}
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Modal Portofolio:</span>
        </div>
        <span className="text-xs font-mono font-bold text-amber-300">
          {formatRupiah(currentCapital)}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all flex items-center gap-1"
          title="Ubah Modal Perdagangan"
        >
          <Settings2 className="w-3 h-3 text-slate-400" />
          <span>Ubah</span>
        </button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-2xl bg-cardBg border border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200">
              Atur Modal Portofolio
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              Tutup
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Saran lot dan alokasi dana di setiap kartu rekomendasi akan otomatis disesuaikan dengan modal Anda.
          </p>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            {CAPITAL_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => handleSelectPreset(p.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all text-left flex items-center justify-between ${
                  currentCapital === p.value
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span>{p.label}</span>
                {currentCapital === p.value && <Check className="w-3 h-3 text-amber-400" />}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <form onSubmit={handleApplyCustom} className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-slate-400">Atau Nominal Kustom (Rp):</div>
            <div className="flex gap-1.5">
              <input
                type="number"
                min={1_000_000}
                step={500_000}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-all"
              >
                Terapkan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
