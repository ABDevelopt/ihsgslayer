import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { StockShieldReport } from "@/lib/types";

interface StockShieldBadgeProps {
  report?: StockShieldReport | null;
  statusText?: string;
}

export default function StockShieldBadge({ report, statusText }: StockShieldBadgeProps) {
  if (report) {
    if (report.is_safe_to_buy) {
      return (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{report.shield_verdict || "AMAN / BEBAS BAHAYA"}</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>{report.shield_verdict || "DANGER ZONE"}</span>
        </div>
      );
    }
  }

  const text = statusText || "AMAN / BEBAS GORENGAN";
  const isDanger = text.toLowerCase().includes("danger") || text.toLowerCase().includes("bahaya") || text.toLowerCase().includes("gocap");

  if (isDanger) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-mono">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>{text}</span>
    </div>
  );
}
