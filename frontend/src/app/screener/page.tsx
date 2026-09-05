"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, Search, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ShariaBadge } from "@/components/ShariaBadge";
import { formatRupiah } from "@/lib/utils";

export default function ScreenerNLPPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await api.queryNLP(q);
      setResults(data.matched_stocks || []);
      setExplanation(data.nlp_interpretation || null);
    } catch (err) {
      console.error("NLP query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "saham batubara profit tinggi roe diatas 20%",
    "saham perbankan undervalue aman tanpa hutang",
    "saham consumer barang konsumsi akumulasi bandar",
    "saham dividen tinggi valuasi murah",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search Box Card */}
      <div className="p-6 rounded-2xl bg-cardBg border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-lg text-slate-100">
            Pencarian Saham dengan Bahasa Alami (AI NLP Screener)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Ketik kriteria pencarian Anda dalam bahasa Indonesia sehari-hari. Mesin pemrosesan
          bahasa alami akan menerjemahkan kueri Anda menjadi filter kuantitatif presisi.
        </p>

        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Contoh: Cari saham perbankan laba tinggi bervalue murah yang sedang diakumulasi bandar..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? "Mencari..." : "Cari"}</span>
          </button>
        </div>

        {/* Fast Samples */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
          <span className="text-slate-500 font-sans">Contoh Cepat:</span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(sample);
                handleSearch(sample);
              }}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Interpretation & Results */}
      {explanation && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
          <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Interpretasi Kuantitatif AI:</span>
          </div>
          <p className="text-slate-300 font-sans">{explanation}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono">
          Memproses bahasa alami dan menyaring emiten...
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((stock) => (
            <div
              key={stock.symbol}
              className="p-5 rounded-2xl bg-cardBg border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-xl text-white">
                    {stock.symbol}
                  </span>
                  <div className="text-xs text-slate-400">
                    {stock.name} &bull; {stock.sector}
                  </div>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI SCORE: {stock.ai_score || 75}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="font-mono text-slate-300">
                  {formatRupiah(stock.price || stock.current_price)}
                </span>
                <Link
                  href={`/analysis/${stock.symbol}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center space-x-1"
                >
                  <span>Bedah 360°</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
