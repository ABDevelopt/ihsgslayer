"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Lock,
  ArrowDownRight
} from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { DangerRadarResponse, HazardStockItem } from "@/lib/types";
import { formatRupiah, formatPercent } from "@/lib/utils";

interface DangerShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DangerShieldModal({ isOpen, onClose }: DangerShieldModalProps) {
  const [data, setData] = useState<DangerRadarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<"FCA" | "SUSPENSION" | "ARB" | "ALL">("ALL");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadRadar();
    }
  }, [isOpen]);

  const loadRadar = async () => {
    setLoading(true);
    try {
      const res = await api.getDangerShieldRadar("ALL", 60);
      setData(res);
    } catch (e) {
      console.error("Failed to load danger radar:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fcaList = data?.fca_hazards || [];
  const suspList = data?.suspension_hazards || [];
  const arbList = data?.arb_hazards || [];

  let currentList: HazardStockItem[] = [];
  if (tab === "FCA") currentList = fcaList;
  else if (tab === "SUSPENSION") currentList = suspList;
  else if (tab === "ARB") currentList = arbList;
  else {
    const map = new Map<string, HazardStockItem>();
    [...fcaList, ...suspList, ...arbList].forEach(item => map.set(item.symbol, item));
    currentList = Array.from(map.values());
  }

  const filtered = currentList.filter(
    item =>
      item.symbol.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/50 via-slate-900 to-amber-950/40 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                  PERISAI ANTI-BAHAYA IDX
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Suspensi &bull; FCA &bull; ARB Guard</span>
              </div>
              <h3 className="text-lg font-black font-mono text-white mt-0.5">
                Radar Saringan Anti-Suspensi, FCA, &amp; ARB
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="p-4 grid grid-cols-3 gap-3 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setTab("FCA")}
            className={`p-3 rounded-xl border text-left transition-all ${
              tab === "FCA"
                ? "bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/30"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Rawan Masuk FCA</span>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-1">
              {data?.fca_count || 0} <span className="text-xs font-normal text-slate-500">Emiten</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Gocap / Likuiditas Mati / PPK</div>
          </button>

          <button
            onClick={() => setTab("SUSPENSION")}
            className={`p-3 rounded-xl border text-left transition-all ${
              tab === "SUSPENSION"
                ? "bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Rawan Suspensi / UMA</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {data?.suspension_count || 0} <span className="text-xs font-normal text-slate-500">Emiten</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Pump Liar / Volatilitas Ekstrem</div>
          </button>

          <button
            onClick={() => setTab("ARB")}
            className={`p-3 rounded-xl border text-left transition-all ${
              tab === "ARB"
                ? "bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/30"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
              <span>Rawan Guyuran ARB</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">
              {data?.arb_count || 0} <span className="text-xs font-normal text-slate-500">Emiten</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Distribusi Pucuk / Breakdown</div>
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari emiten rawan bahaya..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                tab === "ALL"
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              Semua Bahaya ({data?.total_hazardous_count || 0})
            </button>
            <button
              onClick={loadRadar}
              disabled={loading}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 disabled:opacity-50"
              title="Pindai Ulang Radar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* List of Flagged Stocks */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-rose-400 font-mono space-y-2">
              <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs">Memindai seluruh semesta emiten terhadap potensi Suspensi, FCA, &amp; ARB...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-mono space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-slate-200">Tidak Ditemukan Emiten Berbahaya pada Kategori Ini</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Seluruh saham dalam pantauan aman dan memenuhi kriteria perlindungan modal.
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.symbol}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-rose-500/50 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/analysis/${item.symbol}`}
                        className="text-base font-black font-mono text-white hover:text-rose-400 flex items-center gap-1"
                      >
                        <span>{item.symbol.replace(".JK", "")}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                      <ShariaBadge symbol={item.symbol} isSharia={item.is_sharia} />
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {item.risk_badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.name} &bull; <span className="text-slate-500">{item.sector}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-slate-200">
                      {formatRupiah(item.current_price)}{" "}
                      <span className={`text-xs ${item.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        ({formatPercent(item.change_pct)})
                      </span>
                    </div>
                    <div className="text-[10px] text-rose-400 font-bold">
                      Skor Risiko: {item.risk_score}/100
                    </div>
                  </div>
                </div>

                {/* Specific Warning Points */}
                <div className="space-y-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                  {item.warning_flags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{flag}</span>
                    </div>
                  ))}
                </div>

                {/* Human Advice & Directive */}
                <div className="text-[11px] font-sans text-rose-300/90 bg-rose-950/20 p-2 rounded-lg border border-rose-500/20 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{item.human_advice}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-500 flex items-center justify-between">
          <span>Algoritma perisai aktif: Otomatis memblokir rekomendasi saham berisiko pada seluruh modul screener.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default DangerShieldModal;
