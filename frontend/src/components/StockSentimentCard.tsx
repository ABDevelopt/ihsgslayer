"use client";

import React, { useState, useEffect } from "react";
import { Globe, Newspaper, ShieldAlert, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface StockSentimentCardProps {
  symbol: string;
}

export const StockSentimentCard: React.FC<StockSentimentCardProps> = ({ symbol }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanSym = symbol.replace(".JK", "");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getStockSentiment(cleanSym)
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cleanSym]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse text-xs font-mono text-slate-500">
        Menganalisis sentimen berita & katalis makro...
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const sentiment = data.sentiment || {};
  const macro = data.macro_impact || {};
  const isCircuitBreaker = data.circuit_breaker_active;
  const isDivergence = data.divergence_trap;

  return (
    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Intelijen Sentimen & Katalis Makro
          </h4>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              sentiment.badge_color === "rose"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : sentiment.badge_color === "emerald"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {sentiment.badge || "[SENTIMEN NETRAL]"}
          </span>

          {macro.badge && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {macro.badge}
            </span>
          )}
        </div>
      </div>

      {/* Critical Circuit Breaker Warning */}
      {isCircuitBreaker && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>CIRCUIT BREAKER AKTIF: Keterbukaan berisiko hukum / PKPU / suspensi terdeteksi. Sinyal beli diblokir.</span>
        </div>
      )}

      {/* Distribution Trap / Sell on News */}
      {isDivergence && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>WASPADA SELL-ON-NEWS: Berita publik positif namun smart money terpantau melakukan distribusi.</span>
        </div>
      )}

      {/* Macro tailwinds detail */}
      {macro.matched_drivers && macro.matched_drivers.length > 0 && (
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Koreksi & Katalis Komoditas:</span>
          </div>
          {macro.matched_drivers.map((d: any, i: number) => (
            <div key={i} className="text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>{d.benchmark_name} ({d.price} {d.unit})</span>
              <span className={d.change_pct >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {d.change_pct >= 0 ? `+${d.change_pct}%` : `${d.change_pct}%`} {d.bias}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Narrative */}
      <p className="text-xs font-mono text-slate-400 leading-relaxed">
        {sentiment.summary}
      </p>

      {/* Recent Headlines */}
      {sentiment.recent_headlines && sentiment.recent_headlines.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Pemberitaan Terkini</span>
          <div className="space-y-1">
            {sentiment.recent_headlines.map((item: any, idx: number) => (
              <div key={idx} className="text-[11px] font-mono flex items-start gap-2 text-slate-300">
                <span className="text-slate-600 mt-0.5">•</span>
                <span className="flex-1">{item.title}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    item.sentiment_score > 0
                      ? "text-emerald-400 bg-emerald-500/10"
                      : item.sentiment_score < 0
                      ? "text-rose-400 bg-rose-500/10"
                      : "text-slate-500 bg-slate-800"
                  }`}
                >
                  {item.sentiment_score > 0 ? `+${item.sentiment_score}` : item.sentiment_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};