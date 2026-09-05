"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Menu,
  Clock,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Calculator,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { StockUniverseItem } from "@/lib/types";
import TickerTape from "@/components/TickerTape";
import PositionCalculatorModal from "@/components/PositionCalculatorModal";
import TelegramAlertModal from "@/components/TelegramAlertModal";
import { useMarketStream } from "@/hooks/useMarketStream";

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface PageMeta {
  title: string;
  tag?: string;
}

const PAGE_META: Record<string, PageMeta> = {
  "/": { title: "Overview Pasar", tag: "Sinyal Terkurasi" },
  "/ihsg-forecast": { title: "Prediksi IHSG", tag: "Global Proxy" },
  "/bpjs": { title: "BPJS Scanner", tag: "Beli Pagi Jual Sore" },
  "/bsjp": { title: "BSJP Scanner", tag: "Beli Sore Jual Pagi" },
  "/pre-ara": { title: "Pre-ARA Hunter", tag: "Calon Top Gainer" },
  "/confluence": { title: "Konfluensi Screener", tag: "Super Cluster" },
  "/orderflow": { title: "Bandar & Order-Flow", tag: "Analisis LPM" },
  "/smartpick": { title: "Pola Smart Pick", tag: "Pantulan Teknikal" },
  "/portfolio": { title: "Portofolio RDN", tag: "Advisor & Sizing" },
  "/multibagger": { title: "Multibagger Hunter", tag: "2x - 5x Potensi" },
  "/screener": { title: "AI Screener", tag: "NLP Search" },
  "/sentiment": { title: "Sentimen Makro", tag: "Berita & EIDO" },
  "/backtest": { title: "Studio Backtest", tag: "Event-Driven" },
  "/evaluation": { title: "Audit & Evaluasi", tag: "Tracking Sinyal" },
  "/guide": { title: "Buku Panduan", tag: "Metodologi BEI" },
};

export default function Header({
  onToggleSidebar,
  isCollapsed = false,
  onToggleCollapse,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const { isConnected } = useMarketStream();
  const [searchQuery, setSearchQuery] = useState("");
  const [universe, setUniverse] = useState<StockUniverseItem[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Jakarta",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      setTimeStr(now.toLocaleTimeString("id-ID", options) + " WIB");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api
      .getUniverse()
      .then((data) => {
        if (data.universe) setUniverse(data.universe);
      })
      .catch(console.error);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredStocks = universe
    .filter(
      (u) =>
        u.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.sector.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 8);

  const pageMeta: PageMeta =
    PAGE_META[pathname] ||
    (pathname.startsWith("/analysis/")
      ? { title: `Bedah 360° ${pathname.split("/").pop()}`, tag: "Detail Emiten" }
      : { title: "IHSG Slayer Terminal", tag: "Quant AI" });

  return (
    <>
      <header className="sticky top-0 z-30 h-12 bg-cardBg/95 backdrop-blur-md border-b border-cardBorder/70 px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-all">
        {/* Left: Mobile Menu, Collapse & Sleek Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 overflow-hidden mr-2">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden shrink-0"
            title="Menu Navigasi"
          >
            <Menu className="w-4 h-4" />
          </button>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-700/60 transition-all shrink-0"
              title={isCollapsed ? "Buka Bilah Samping" : "Ciutkan Bilah Samping"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Clean Title + Tag */}
          <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight">
              {pageMeta.title}
            </h1>
            {pageMeta.tag && (
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/70 border border-slate-700/50 truncate shrink-0">
                {pageMeta.tag}
              </span>
            )}
          </div>
        </div>

        {/* Right: Slim Actions (No Offside / Overflow) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Connection Status Badge */}
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all ${
              isConnected
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
            title={isConnected ? "Koneksi WebSocket Aktif" : "Mode Polling Aktif"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-400 animate-ping" : "bg-slate-500"
              }`}
            />
            <span className="hidden sm:inline">{isConnected ? "LIVE" : "POLL"}</span>
          </div>

          {/* Telegram Alert Button */}
          <button
            onClick={() => setIsTelegramOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5"
            title="Konfigurasi Telegram Alert Hub"
          >
            <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="hidden xl:inline">Telegram</span>
          </button>

          {/* Position Calculator Button */}
          <button
            onClick={() => setIsCalcOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5"
            title="Kalkulator Manajemen Risiko Lot"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden lg:inline">Kalkulator</span>
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-emerald-500/50 text-slate-400 hover:text-slate-200 transition-all text-xs font-mono"
            title="Cari Saham BEI (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline text-xs">Cari...</span>
            <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Real-time Clock */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-emerald-400">
            <Clock className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
            <span>{timeStr || "09:00 WIB"}</span>
          </div>
        </div>
      </header>

      {/* Top Ticker Tape */}
      <TickerTape />

      {/* Position Calculator Modal */}
      {isCalcOpen && (
        <PositionCalculatorModal
          isOpen={true}
          onClose={() => setIsCalcOpen(false)}
        />
      )}

      {/* Telegram Alert Configuration Modal */}
      {isTelegramOpen && (
        <TelegramAlertModal
          isOpen={true}
          onClose={() => setIsTelegramOpen(false)}
        />
      )}

      {/* Command Palette Modal (Ctrl+K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xl bg-cardBg border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
              <Search className="w-5 h-5 text-emerald-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik kode saham (misal: BBCA, PTBA, WOOD, DIVA)..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-400 hover:text-white"
              >
                ESC
              </button>
            </div>

            {/* Suggestions list */}
            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {filteredStocks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-mono">
                  Tidak ditemukan emiten yang sesuai dengan &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      router.push(`/analysis/${stock.symbol}`);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between text-left transition-all group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-emerald-400">
                          {stock.symbol}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          {stock.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{stock.sector}</div>
                    </div>
                    <div className="text-xs text-slate-400 group-hover:text-emerald-400 flex items-center space-x-1 font-mono">
                      <span>Bedah 360°</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
