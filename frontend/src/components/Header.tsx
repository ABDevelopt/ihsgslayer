"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Menu, Clock, ShieldCheck, Zap, ArrowRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { api } from "@/lib/api";
import { StockUniverseItem } from "@/lib/types";

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Ringkasan Pasar & Sinyal BUY Saham Layak Terkurasi",
  "/ihsg-forecast": "Prediksi Tren IHSG Harian (Bursa Asia & Proxy Global)",
  "/timeframes": "Kategori Trading: Harian, Mingguan & Jangka Panjang",
  "/confluence": "Konfluensi Multi-Screener (Super Cluster)",
  "/pre-ara": "Pre-ARA Hunter (Prediksi Calon Top Gainer +20% s/d +35%)",
  "/bpjs": "BPJS Scanner (Beli Pagi Jual Sore - Intraday Momentum)",
  "/bsjp": "BSJP Scanner (Beli Sore Jual Pagi)",
  "/orderflow": "Order-Flow & Jejak Akumulasi Bandar (LPM)",
  "/smartpick": "Pola Pantulan Teknikal (Smart Pick Geometri)",
  "/journal": "Jurnal Portofolio & NAV (Metode FIFO)",
  "/evaluation": "Evaluasi Riil BPJS & BSJP (Audit Studio)",
  "/screener": "AI Screener (Pencarian Bahasa Alami NLP)",
  "/backtest": "Studio Backtest Strategi Kuantitatif",
  "/guide": "Buku Panduan Pemula & Kamus Istilah",
};

import TickerTape from "@/components/TickerTape";
import PositionCalculatorModal from "@/components/PositionCalculatorModal";
import TelegramAlertModal from "@/components/TelegramAlertModal";
import { useMarketStream } from "@/hooks/useMarketStream";
import { Calculator, Send } from "lucide-react";

export default function Header({ onToggleSidebar, isCollapsed = false, onToggleCollapse }: HeaderProps) {
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
    api.getUniverse().then((data) => {
      if (data.universe) setUniverse(data.universe);
    }).catch(console.error);
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

  const filteredStocks = universe.filter(
    (u) =>
      u.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.sector.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  const currentTitle = PAGE_TITLES[pathname] || (pathname.startsWith("/analysis/") ? `Bedah 360° Saham ${pathname.split("/").pop()}` : "IHSG Slayer Terminal");

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-cardBg/90 backdrop-blur-md border-b border-cardBorder px-4 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile Menu, Desktop Collapse & Breadcrumbs */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
            title="Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-700 transition-all"
              title={isCollapsed ? "Buka Bilah Samping (Expand)" : "Ciutkan Bilah Samping (Collapse)"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
          <div>
            <h2 className="text-sm lg:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{currentTitle}</span>
            </h2>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Hybrid Quant: 5-Pillar Fundamental &bull; LPM Order-Flow &bull; Stop Loss Otomatis
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Real-time WebSocket Live Badge */}
          <div
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold transition-all ${
              isConnected
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900/60 border-slate-800 text-slate-400"
            }`}
            title={isConnected ? "Koneksi WebSocket Market Pulse Aktif" : "Menghubungkan ke WebSocket Server..."}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
            <span>{isConnected ? "[WS LIVE]" : "[POLL]"}</span>
          </div>

          {/* Telegram Alert Hub Button */}
          <button
            onClick={() => setIsTelegramOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono"
            title="Konfigurasi Telegram Instant Webhook Hub"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">Telegram Alert</span>
          </button>

          {/* Position Calculator Button */}
          <button
            onClick={() => setIsCalcOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all text-xs font-mono"
            title="Kalkulator Manajemen Risiko Modal"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Kalkulator Lot</span>
          </button>

          {/* Quick Search Palette Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-slate-400 hover:text-slate-200 transition-all text-xs font-mono"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cari Saham...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Real-time Clock Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{timeStr || "Memuat Jam..."}</span>
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
      <TelegramAlertModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

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
