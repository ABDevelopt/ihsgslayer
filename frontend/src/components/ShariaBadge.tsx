import React from "react";
import { isShariaStock } from "@/lib/sharia";

interface ShariaBadgeProps {
  symbol?: string;
  isSharia?: boolean;
  size?: "xs" | "sm" | "md";
  showNonSharia?: boolean;
  className?: string;
}

export function ShariaBadge({
  symbol,
  isSharia,
  size = "xs",
  showNonSharia = false,
  className = ""
}: ShariaBadgeProps) {
  const sharia = isSharia !== undefined ? isSharia : isShariaStock(symbol);

  if (!sharia && !showNonSharia) return null;

  if (!sharia) {
    return (
      <span
        title="Saham Konvensional (Non-Syariah)"
        className={`inline-flex items-center font-mono font-bold uppercase rounded bg-slate-800/90 text-slate-400 border border-slate-700 tracking-wider ${
          size === "xs"
            ? "px-1.5 py-0.5 text-[8.5px]"
            : size === "sm"
            ? "px-2 py-0.5 text-[9.5px]"
            : "px-2.5 py-1 text-[11px]"
        } ${className}`}
      >
        NON-SYARIAH
      </span>
    );
  }

  return (
    <span
      title="Saham Syariah Resmi (Daftar Efek Syariah / ISSI BEI)"
      className={`inline-flex items-center font-mono font-bold uppercase rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 tracking-wider shadow-sm ${
        size === "xs"
          ? "px-1.5 py-0.5 text-[8.5px]"
          : size === "sm"
          ? "px-2 py-0.5 text-[9.5px]"
          : "px-2.5 py-1 text-[11px]"
      } ${className}`}
    >
      SYARIAH
    </span>
  );
}

export default ShariaBadge;
