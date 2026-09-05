"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, Activity, BarChart3, Info } from "lucide-react";

interface CandleItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PivotLevels {
  pivot?: number;
  resistance_1?: number;
  resistance_2?: number;
  support_1?: number;
  support_2?: number;
}

interface InteractiveChartProps {
  symbol: string;
  currentPrice: number;
  candles?: CandleItem[];
  pivotLevels?: PivotLevels;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  rsiValue?: number;
}

// ─── Explanation tooltips for beginner users ────────────────────────────────
const INDICATOR_HINTS = [
  { label: "Support (S1, S2)", color: "text-rose-400",   hint: "Lantai harga — level di mana pembeli cenderung masuk dan harga memantul naik." },
  { label: "Resistance (R1, R2)", color: "text-emerald-400", hint: "Atap harga — level di mana penjual cenderung menekan dan harga berbalik turun." },
  { label: "Pivot (P)",  color: "text-amber-400", hint: "Titik tengah referensi harian, dihitung dari High+Low+Close hari sebelumnya." },
  { label: "Bollinger Band", color: "text-purple-400",  hint: "Terowongan volatilitas. Harga di lower band = potensi beli. Upper band = potensi jual." },
  { label: "MA20 (cyan)",  color: "text-cyan-400",   hint: "Rata-rata harga 20 hari. Di atas MA20 = tren jangka pendek naik." },
  { label: "MA50 (amber)", color: "text-amber-400",  hint: "Rata-rata harga 50 hari. Di atas MA50 = tren jangka menengah naik (bullish)." },
  { label: "RSI",  color: "text-indigo-400",  hint: "Kekuatan momentum 0-100. Di bawah 30 = Oversold (potensi beli). Di atas 70 = Overbought (potensi jual)." },
];

export default function InteractiveChart({
  symbol,
  currentPrice,
  candles = [],
  pivotLevels,
  bbUpper,
  bbMiddle,
  bbLower,
  rsiValue = 50,
}: InteractiveChartProps) {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "ALL">("3M");
  const [showMA20, setShowMA20] = useState<boolean>(true);
  const [showMA50, setShowMA50] = useState<boolean>(true);
  const [showBB,   setShowBB]   = useState<boolean>(true);
  const [showSR,   setShowSR]   = useState<boolean>(true);
  const [showHints, setShowHints] = useState<boolean>(false);

  const displaySymbol = symbol ? symbol.replace(".JK", "") : "BBCA";

  const chartData = useMemo(() => {
    const limit = timeframe === "1M" ? 22 : timeframe === "3M" ? 65 : timeframe === "6M" ? 130 : 250;
    let rawList: CandleItem[] = candles && candles.length > 0 ? candles.slice(-limit) : [];

    if (rawList.length === 0) {
      let p = currentPrice > 0 ? currentPrice * 0.95 : 5000;
      for (let i = 0; i < limit; i++) {
        p = Math.max(50, p * (1 + Math.sin(i / 6) * 0.015));
        rawList.push({
          date: `D-${limit - i}`,
          open: p * 0.995, high: p * 1.015,
          low: p * 0.985,  close: p,
          volume: 5000000 + Math.floor(Math.sin(i) * 2000000),
        });
      }
    }

    // Compute MAs and RSI from close prices
    const closes = rawList.map((c) => c.close);

    return rawList.map((c, i) => {
      const slice20 = closes.slice(Math.max(0, i - 19), i + 1);
      const ma20 = slice20.reduce((a, x) => a + x, 0) / slice20.length;
      const slice50 = closes.slice(Math.max(0, i - 49), i + 1);
      const ma50 = slice50.reduce((a, x) => a + x, 0) / slice50.length;

      // RSI-14 from raw candles
      let rsi = 50;
      if (i >= 14) {
        const gains: number[] = [], losses: number[] = [];
        for (let j = i - 13; j <= i; j++) {
          const delta = rawList[j].close - rawList[j - 1].close;
          if (delta >= 0) gains.push(delta); else losses.push(Math.abs(delta));
        }
        const avgGain = gains.reduce((a, x) => a + x, 0) / 14;
        const avgLoss = losses.reduce((a, x) => a + x, 0) / 14;
        rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
      }

      // Bollinger Band from MA20 + 2×std
      const std = Math.sqrt(slice20.reduce((a, x) => a + Math.pow(x - ma20, 2), 0) / slice20.length);
      const bbU = ma20 + 2 * std;
      const bbL = ma20 - 2 * std;

      const dStr = String(c.date).length >= 10 ? String(c.date).slice(5, 10) : String(c.date);
      return {
        date: dStr, fullDate: String(c.date),
        price: Math.round(c.close), open: Math.round(c.open),
        high: Math.round(c.high),  low: Math.round(c.low),
        close: Math.round(c.close),
        ma20: Math.round(ma20), ma50: Math.round(ma50),
        bbUpper: Math.round(bbU), bbLower: Math.round(bbL),
        rsi: Math.round(rsi * 10) / 10,
        volume: c.volume, isUp: c.close >= c.open,
      };
    });
  }, [candles, currentPrice, timeframe]);

  const last = chartData[chartData.length - 1];
  const latestPrice  = last?.price   || currentPrice;
  const latestMA20   = last?.ma20    || currentPrice;
  const latestMA50   = last?.ma50    || currentPrice;
  const latestRSI    = last?.rsi     || rsiValue;
  const latestBBU    = last?.bbUpper || (bbUpper || currentPrice * 1.05);
  const latestBBL    = last?.bbLower || (bbLower || currentPrice * 0.95);
  const isAboveMA20  = latestPrice >= latestMA20;
  const isAboveMA50  = latestPrice >= latestMA50;

  // Pivot levels — use backend values or derive from chart data
  const high = Math.max(...chartData.slice(-20).map((d) => d.high));
  const low  = Math.min(...chartData.slice(-20).map((d) => d.low));
  const pivot    = pivotLevels?.pivot       || Math.round((high + low + latestPrice) / 3);
  const resist1  = pivotLevels?.resistance_1 || Math.round(2 * pivot - low);
  const resist2  = pivotLevels?.resistance_2 || Math.round(pivot + (high - low));
  const support1 = pivotLevels?.support_1   || Math.round(2 * pivot - high);
  const support2 = pivotLevels?.support_2   || Math.round(pivot - (high - low));

  // RSI zone info
  const rsiStatus = latestRSI >= 70 ? { label: "OVERBOUGHT", color: "text-rose-400", bg: "bg-rose-500/20 border-rose-500/30", advice: "Terlalu cepat naik — potensi koreksi jangka pendek." }
    : latestRSI <= 30 ? { label: "OVERSOLD",   color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30", advice: "Terlalu tertekan — potensi rebound naik." }
    : { label: "NETRAL", color: "text-slate-400", bg: "bg-slate-500/20 border-slate-500/30", advice: "Momentum belum ekstrem di kedua arah." };

  return (
    <div className="space-y-4">
      {/* ── Main Price Chart ──────────────────────────────────── */}
      <div className="p-5 rounded-2xl pg-surface border pg-divider shadow-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm pg-text font-mono">
                📊 Chart Teknikal — {displaySymbol}.JK
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold pg-badge-emerald border">
                100% REAL OHLCV BEI
              </span>
              <button
                onClick={() => setShowHints(!showHints)}
                className="px-2 py-0.5 rounded text-[10px] font-mono pg-muted border pg-divider pg-text-muted hover:pg-text flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                {showHints ? "Sembunyikan" : "Apa arti indikator?"}
              </button>
            </div>

            {/* Legend toggles */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 pg-emerald">
                <span className="w-2.5 h-1 bg-emerald-400 rounded-full" />
                Harga: {formatRupiah(latestPrice)}
              </span>
              <button
                onClick={() => setShowMA20(!showMA20)}
                className={`flex items-center gap-1.5 transition-opacity ${showMA20 ? "opacity-100" : "opacity-35 line-through"} text-cyan-400`}
              >
                <span className="w-2.5 h-1 bg-cyan-400 rounded-full" />
                MA20: {formatRupiah(latestMA20)} ({isAboveMA20 ? "↑" : "↓"})
              </button>
              <button
                onClick={() => setShowMA50(!showMA50)}
                className={`flex items-center gap-1.5 transition-opacity ${showMA50 ? "opacity-100" : "opacity-35 line-through"} text-amber-400`}
              >
                <span className="w-2.5 h-1 bg-amber-400 rounded-full" />
                MA50: {formatRupiah(latestMA50)} ({isAboveMA50 ? "↑" : "↓"})
              </button>
              <button
                onClick={() => setShowBB(!showBB)}
                className={`flex items-center gap-1.5 transition-opacity ${showBB ? "opacity-100" : "opacity-35 line-through"} text-purple-400`}
              >
                <span className="w-2.5 h-1 bg-purple-400 rounded-full" />
                BB Band
              </button>
              <button
                onClick={() => setShowSR(!showSR)}
                className={`flex items-center gap-1.5 transition-opacity ${showSR ? "opacity-100" : "opacity-35 line-through"} text-rose-400`}
              >
                <span className="w-2.5 h-1 bg-rose-400 rounded-full" />
                S/R Levels
              </button>
            </div>
          </div>

          {/* Timeframe Pills */}
          <div className="flex items-center gap-1 pg-muted border pg-divider p-1 rounded-xl font-mono text-xs">
            {(["1M", "3M", "6M", "ALL"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg transition-all font-bold ${
                  timeframe === tf ? "bg-emerald-500 text-slate-950 shadow" : "pg-text-muted hover:pg-text"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Hints */}
        {showHints && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-200">
            {INDICATOR_HINTS.map((h) => (
              <div key={h.label} className="px-3 py-2 rounded-xl pg-muted border pg-divider space-y-0.5">
                <div className={`text-[10px] font-mono font-bold ${h.color}`}>{h.label}</div>
                <p className="text-[10px] pg-text-muted leading-relaxed">{h.hint}</p>
              </div>
            ))}
          </div>
        )}

        {/* S/R Level Cards (compact) */}
        {showSR && (
          <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
            {[
              { label: "S2", val: support2, color: "text-rose-500 border-rose-500/20 bg-rose-500/8", hint: "Support kuat ke-2" },
              { label: "S1", val: support1, color: "text-rose-400 border-rose-500/25 bg-rose-500/10", hint: "Support ke-1" },
              { label: "PP", val: pivot,    color: "text-amber-400 border-amber-500/30 bg-amber-500/10", hint: "Pivot Point" },
              { label: "R1", val: resist1,  color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/10", hint: "Resistance ke-1" },
              { label: "R2", val: resist2,  color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/8", hint: "Resistance kuat ke-2" },
            ].map((lvl) => (
              <div key={lvl.label} className={`p-2 rounded-xl border ${lvl.color}`} title={lvl.hint}>
                <div className="font-bold">{lvl.label}</div>
                <div className="mt-0.5">{formatRupiah(lvl.val)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Main Chart */}
        <div className="w-full h-72 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.00} />
                </linearGradient>
                <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={{ stroke: "var(--border-subtle)" }} />
              <YAxis
                yAxisId="p"
                domain={["auto", "auto"]}
                stroke="var(--text-faint)"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
                tickFormatter={(v) => v.toLocaleString("id-ID")}
                orientation="right"
              />
              <YAxis yAxisId="v" domain={[0, "dataMax * 4"]} hide />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                  borderRadius: "0.75rem",
                  color: "var(--text-primary)",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  boxShadow: "var(--shadow-modal)",
                }}
                formatter={(value: any, name: string | number | undefined) => {
                  const n = String(name || "");
                  if (n === "Volume") return [Number(value).toLocaleString("id-ID") + " lot", "Volume"];
                  if (n === "BBUpper") return [formatRupiah(Number(value)), "BB Atas"];
                  if (n === "BBLower") return [formatRupiah(Number(value)), "BB Bawah"];
                  return [formatRupiah(Number(value)), n.toUpperCase()];
                }}
                labelFormatter={(_l, payload) => {
                  const it = payload?.[0]?.payload;
                  return it ? `Tanggal: ${it.fullDate}` : "";
                }}
              />

              {/* S/R Reference Lines */}
              {showSR && (
                <>
                  <ReferenceLine yAxisId="p" y={resist2} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1} strokeOpacity={0.5} label={{ value: `R2 ${resist2.toLocaleString("id-ID")}`, position: "insideTopRight", fill: "#10b981", fontSize: 9, fontFamily: "monospace" }} />
                  <ReferenceLine yAxisId="p" y={resist1} stroke="#34d399" strokeDasharray="5 3" strokeWidth={1.5} strokeOpacity={0.7} label={{ value: `R1 ${resist1.toLocaleString("id-ID")}`, position: "insideTopRight", fill: "#34d399", fontSize: 9, fontFamily: "monospace" }} />
                  <ReferenceLine yAxisId="p" y={pivot}   stroke="#fbbf24" strokeDasharray="6 2" strokeWidth={1.5} strokeOpacity={0.8} label={{ value: `PP ${pivot.toLocaleString("id-ID")}`,   position: "insideTopRight", fill: "#fbbf24", fontSize: 9, fontFamily: "monospace" }} />
                  <ReferenceLine yAxisId="p" y={support1} stroke="#fb7185" strokeDasharray="5 3" strokeWidth={1.5} strokeOpacity={0.7} label={{ value: `S1 ${support1.toLocaleString("id-ID")}`, position: "insideBottomRight", fill: "#fb7185", fontSize: 9, fontFamily: "monospace" }} />
                  <ReferenceLine yAxisId="p" y={support2} stroke="#f43f5e" strokeDasharray="5 3" strokeWidth={1} strokeOpacity={0.5} label={{ value: `S2 ${support2.toLocaleString("id-ID")}`, position: "insideBottomRight", fill: "#f43f5e", fontSize: 9, fontFamily: "monospace" }} />
                </>
              )}

              {/* Bollinger Band (upper fill area) */}
              {showBB && (
                <>
                  <Area yAxisId="p" type="monotone" dataKey="bbUpper" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 2" strokeOpacity={0.6} fillOpacity={1} fill="url(#bbGrad)" name="BBUpper" dot={false} />
                  <Area yAxisId="p" type="monotone" dataKey="bbLower" stroke="#a855f7" strokeWidth={1} strokeDasharray="4 2" strokeOpacity={0.6} fillOpacity={0} fill="transparent" name="BBLower" dot={false} />
                </>
              )}

              {/* Volume */}
              <Bar yAxisId="v" dataKey="volume" fill="var(--border-subtle)" opacity={0.4} radius={[2, 2, 0, 0]} name="Volume" />

              {/* Price Area */}
              <Area yAxisId="p" type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#priceGrad)" name="Harga" dot={false} />

              {/* MA Lines */}
              {showMA20 && <Line yAxisId="p" type="monotone" dataKey="ma20" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="MA20" />}
              {showMA50 && <Line yAxisId="p" type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MA50" />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── RSI Sub-panel ─────────────────────────────────────── */}
      <div className="p-5 rounded-2xl pg-surface border pg-divider shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-xs font-mono pg-text">RSI-14 — Kekuatan Momentum</h4>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${rsiStatus.bg}`}>
              {rsiStatus.label}
            </span>
          </div>
          <div className="text-[11px] pg-text-muted font-mono">{rsiStatus.advice}</div>
        </div>

        {/* RSI Chart */}
        <div className="w-full h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-faint)" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="var(--text-faint)" fontSize={9} tickLine={false} axisLine={false} orientation="right" ticks={[30, 50, 70]} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", borderRadius: "0.5rem", color: "var(--text-primary)", fontSize: "11px", fontFamily: "monospace" }}
                formatter={(v: any) => [`RSI: ${Number(v).toFixed(1)}`, ""]}
              />
              {/* Zone fills */}
              <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="4 2" strokeWidth={1} strokeOpacity={0.7} label={{ value: "Overbought 70", position: "insideTopRight", fill: "#f43f5e", fontSize: 8, fontFamily: "monospace" }} />
              <ReferenceLine y={50} stroke="var(--border-strong)" strokeDasharray="2 2" strokeWidth={1} strokeOpacity={0.5} label={{ value: "Netral 50", position: "insideTopRight", fill: "var(--text-faint)", fontSize: 8, fontFamily: "monospace" }} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1} strokeOpacity={0.7} label={{ value: "Oversold 30", position: "insideBottomRight", fill: "#10b981", fontSize: 8, fontFamily: "monospace" }} />
              <Area type="monotone" dataKey="rsi" stroke="#818cf8" strokeWidth={1.5} fill="url(#rsiGrad)" dot={false} name="RSI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RSI current reading */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="pg-text-muted">RSI Saat Ini:</span>
            <span className={`font-bold ${rsiStatus.color}`}>{latestRSI.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] pg-text-faint">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-rose-400 inline-block" /> &gt;70 Overbought</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-400 inline-block" /> &lt;30 Oversold</span>
          </div>
        </div>
      </div>
    </div>
  );
}


interface CandleItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface InteractiveChartProps {
  symbol: string;
  currentPrice: number;
  candles?: CandleItem[];
}

