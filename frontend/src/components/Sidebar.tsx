"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Layers,
  Activity,
  Zap,
  Sunrise,
  Sunset,
  Rocket,
  Filter,
  BarChart3,
  BookOpen,
  HelpCircle,
  Clock,
  ShieldCheck,
  Globe2,
  Bot,
  Target,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Wallet,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  chip?: string;
  chipVariant?: "emerald" | "rose" | "amber" | "indigo" | "default";
}

interface NavSection {
  sectionTitle: string;
  items: NavItem[];
}

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      sectionTitle: "Pasar & Intelijen",
      items: [
        {
          href: "/",
          label: "Overview Pasar",
          icon: TrendingUp,
        },
        {
          href: "/ihsg-forecast",
          label: "IHSG & Sentimen Makro",
          icon: Globe2,
          chip: "EIDO • NLP",
          chipVariant: "emerald",
        },
        {
          href: "/orderflow",
          label: "Bandar & Order-Flow",
          icon: Activity,
          chip: "LPM Flow",
          chipVariant: "indigo",
        },
      ],
    },
    {
      sectionTitle: "Screener & Strategi Terpadu",
      items: [
        {
          href: "/bpjs",
          label: "Scalping Hub (BPJS & Pre-ARA)",
          icon: Sunrise,
          chip: "Intraday",
          chipVariant: "emerald",
        },
        {
          href: "/confluence",
          label: "Swing Hub (Konfluensi & BSJP)",
          icon: Layers,
          chip: "Swing & Pola",
          chipVariant: "amber",
        },
        {
          href: "/multibagger",
          label: "Calon Multibagger",
          icon: Flame,
          chip: "5X Bagger",
          chipVariant: "emerald",
        },
        {
          href: "/screener",
          label: "AI Screener (NLP)",
          icon: Filter,
        },
      ],
    },
    {
      sectionTitle: "Portofolio & Riset Kuantitatif",
      items: [
        {
          href: "/portfolio",
          label: "Portofolio & Rekomendasi",
          icon: Wallet,
          chip: "AI Advisor",
          chipVariant: "emerald",
        },
        {
          href: "/backtest",
          label: "Studio Backtest & Forward Test",
          icon: BarChart3,
          chip: "Quant Lab",
          chipVariant: "indigo",
        },
        {
          href: "/evaluation",
          label: "Audit & Evaluasi Riil",
          icon: ShieldCheck,
          chip: "Win Rate",
          chipVariant: "emerald",
        },
        {
          href: "/guide",
          label: "Panduan & Glosarium",
          icon: HelpCircle,
        },
      ],
    },
  ];

  const getChipClass = (variant: NavItem["chipVariant"] = "default", isActive: boolean) => {
    if (isActive) {
      return "bg-emerald-400/20 text-emerald-300 border-emerald-400/30";
    }
    switch (variant) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rose":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "indigo":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-800/80 text-slate-400 border-slate-700/60";
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 pg-sidebar border-r pg-divider flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 select-none shadow-2xl",
          isCollapsed ? "w-20" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className={cn(
            "h-16 border-b pg-divider flex items-center shrink-0 pg-sidebar transition-all",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}>
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 group"
              title="IHSG Slayer PRO - Terminal Kuantitatif"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/15 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-bold text-sm tracking-tight text-slate-100 font-mono">
                      IHSG SLAYER
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      PRO
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wide">
                    QUANT TERMINAL
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links with Custom Sleek Scrollbar */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {/* Section Title */}
                {isCollapsed ? (
                  <div className="my-2 border-t border-slate-800/80 mx-2" />
                ) : (
                  <div className="px-2.5 pb-1 text-[10px] font-semibold pg-text-faint uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <span>{sec.sectionTitle}</span>
                  </div>
                )}

                {/* Section Items */}
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href)) ||
                      (item.href === "/bpjs" && pathname === "/pre-ara") ||
                      (item.href === "/confluence" && (pathname === "/bsjp" || pathname === "/smartpick" || pathname === "/timeframes")) ||
                      (item.href === "/ihsg-forecast" && pathname === "/sentiment") ||
                      (item.href === "/backtest" && pathname === "/forward-test");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group relative flex items-center rounded-lg text-xs transition-all duration-150",
                          isCollapsed ? "justify-center p-2.5" : "justify-between px-2.5 py-2",
                          isActive
                            ? "bg-subtle pg-text font-semibold shadow-sm shadow-black/20"
                            : "pg-text-muted hover:pg-text hover:bg-muted font-normal"
                        )}
                      >
                        {/* Active Left Indicator Bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-emerald-400 rounded-r-full shadow-sm shadow-emerald-400/50" />
                        )}

                        <div className={cn("flex items-center gap-2.5 min-w-0", !isCollapsed && "pl-1")}>
                          <div className="relative">
                            <Icon
                              className={cn(
                                "w-4 h-4 shrink-0 transition-colors duration-150",
                                isActive
                                  ? "text-emerald-400"
                                  : "pg-text-faint group-hover:pg-text-3"
                              )}
                            />
                            {isCollapsed && item.chip && (
                              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-sidebar" />
                            )}
                          </div>
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.chip && (
                          <span
                            className={cn(
                              "text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border transition-colors shrink-0 ml-1.5",
                              getChipClass(item.chipVariant, isActive)
                            )}
                          >
                            {item.chip}
                          </span>
                        )}

                        {/* Collapsed Hover Tooltip */}
                        {isCollapsed && (
                          <div className="hidden group-hover:flex absolute left-full ml-3 px-3 py-1.5 rounded-xl pg-surface border pg-divider shadow-2xl z-50 text-xs font-mono font-bold pg-text whitespace-nowrap items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                            <span>{item.label}</span>
                            {item.chip && (
                              <span
                                className={cn(
                                  "text-[9px] font-medium px-1.5 py-0.5 rounded border",
                                  getChipClass(item.chipVariant, true)
                                )}
                              >
                                {item.chip}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t pg-divider pg-sidebar shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="relative flex items-center justify-center p-1" title="Feed BEI Aktif (350+ Emiten)">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg pg-muted border pg-divider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold pg-text-2 font-mono leading-none">
                    FEED AKTIF
                  </span>
                  <span className="text-[9px] pg-text-faint font-mono mt-0.5">
                    BEI / IDX Live
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono pg-badge-emerald font-bold px-1.5 py-0.5 rounded border">
                  350+ Emiten
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
