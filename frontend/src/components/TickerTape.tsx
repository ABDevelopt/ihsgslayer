"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { api } from "@/lib/api";

interface TickerItem {
  symbol: string;
  raw_symbol?: string;
  price: string;
  price_num?: number;
  change: string;
  change_num?: number;
  isUp: boolean;
  badge?: string;
}

const DEFAULT_ITEMS: TickerItem[] = [
  { symbol: "IHSG", raw_symbol: "^JKSE", price: "6,487.30", change: "+1.27%", isUp: true, badge: "Indeks Utama" },
  { symbol: "BBCA.JK", raw_symbol: "BBCA.JK", price: "Rp 6,400", change: "+0.79%", isUp: true, badge: "Big Cap" },
  { symbol: "BBRI.JK", raw_symbol: "BBRI.JK", price: "Rp 3,150", change: "+0.64%", isUp: true, badge: "Banking" },
  { symbol: "BMRI.JK", raw_symbol: "BMRI.JK", price: "Rp 4,190", change: "+0.72%", isUp: true, badge: "Order-Flow " },
  { symbol: "TLKM.JK", raw_symbol: "TLKM.JK", price: "Rp 2,600", change: "+0.00%", isUp: true, badge: "Telco" },
  { symbol: "ASII.JK", raw_symbol: "ASII.JK", price: "Rp 4,800", change: "+0.42%", isUp: true, badge: "Automotive" },
  { symbol: "WOOD.JK", raw_symbol: "WOOD.JK", price: "Rp 208", change: "+2.97%", isUp: true, badge: "Pre-ARA " },
  { symbol: "DIVA.JK", raw_symbol: "DIVA.JK", price: "Rp 138", change: "+6.15%", isUp: true, badge: "Pre-ARA " },
  { symbol: "PTBA.JK", raw_symbol: "PTBA.JK", price: "Rp 2,480", change: "+2.48%", isUp: true, badge: "Dividen" },
  { symbol: "BBNI.JK", raw_symbol: "BBNI.JK", price: "Rp 3,700", change: "+0.54%", isUp: true, badge: "Banking" },
  { symbol: "ADRO.JK", raw_symbol: "ADRO.JK", price: "Rp 2,670", change: "+2.30%", isUp: true, badge: "Energy" },
  { symbol: "BRIS.JK", raw_symbol: "BRIS.JK", price: "Rp 1,780", change: "+0.00%", isUp: true, badge: "Syariah" },
  { symbol: "BREN.JK", raw_symbol: "BREN.JK", price: "Rp 3,370", change: "+1.81%", isUp: true, badge: "Renewable" },
  { symbol: "AMMN.JK", raw_symbol: "AMMN.JK", price: "Rp 4,440", change: "+1.14%", isUp: true, badge: "Mining" },
  { symbol: "UNTR.JK", raw_symbol: "UNTR.JK", price: "Rp 24,225", change: "+1.57%", isUp: true, badge: "Heavy Eq." },
  { symbol: "ICBP.JK", raw_symbol: "ICBP.JK", price: "Rp 7,925", change: "+0.96%", isUp: true, badge: "Consumer" }
];

export default function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    let isMounted = true;

    const fetchTickerData = async () => {
      try {
        const data = await api.getTickerTape();
        if (data && Array.isArray(data.items) && data.items.length > 0 && isMounted) {
          setItems(data.items);
        }
      } catch (e) {
        // Fallback gracefully to default real snapshot
      }
    };

    fetchTickerData();
    const interval = setInterval(fetchTickerData, 45000); // 45s refresh

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-slate-950/90 border-b border-cardBorder/60 py-1.5 px-4 overflow-x-auto no-scrollbar flex items-center space-x-6 text-xs font-mono select-none">
      <div className="flex items-center space-x-1.5 text-emerald-400 font-bold shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[10px] uppercase tracking-wider">LIVE BEI PULSE</span>
      </div>

      <div className="flex items-center space-x-6 shrink-0">
        {items.map((item, idx) => {
          const isIndex = item.symbol === "IHSG" || item.raw_symbol === "^JKSE";
          const href = isIndex ? "/ihsg-forecast" : `/analysis/${item.raw_symbol || item.symbol}`;

          return (
            <Link
              key={idx}
              href={href}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors group"
            >
              <span className={`font-bold transition-colors ${isIndex ? "text-cyan-400 group-hover:text-cyan-300" : "text-white group-hover:text-emerald-400"}`}>
                {item.symbol}
              </span>
              <span className="text-slate-300 font-bold">{item.price}</span>
              <span
                className={`flex items-center text-[11px] font-bold ${
                  item.isUp ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {item.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {item.change}
              </span>
              {item.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] border ${
                  isIndex 
                    ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
