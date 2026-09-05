"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

export interface HubTabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "emerald" | "amber" | "rose" | "cyan" | "indigo";
}

interface StrategyHubNavProps {
  hubTitle: string;
  hubBadge: string;
  badgeVariant?: "emerald" | "amber" | "indigo" | "cyan";
  description: string;
  tabs: HubTabItem[];
}

export default function StrategyHubNav({
  hubTitle,
  hubBadge,
  badgeVariant = "emerald",
  description,
  tabs,
}: StrategyHubNavProps) {
  const pathname = usePathname();

  const getBadgeStyle = (variant: string) => {
    switch (variant) {
      case "amber":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "indigo":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "cyan":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "rose":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1424] to-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${getBadgeStyle(badgeVariant)}`}>
              {hubBadge}
            </span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {hubTitle}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0 border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-slate-800"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
