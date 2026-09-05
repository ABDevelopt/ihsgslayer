import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return "Rp 0";
  return `Rp ${Math.round(Number(value)).toLocaleString("id-ID")}`;
}

export function formatPercent(value: number | string | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || isNaN(Number(value))) return "0.0%";
  const num = Number(value);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      border: "border-emerald-500/40",
      label: "Sangat Unggul (Top Tier)",
    };
  } else if (score >= 65) {
    return {
      bg: "bg-cyan-500/20",
      text: "text-cyan-300",
      border: "border-cyan-500/40",
      label: "Bagus / Layak Beli",
    };
  } else if (score >= 50) {
    return {
      bg: "bg-amber-500/20",
      text: "text-amber-300",
      border: "border-amber-500/40",
      label: "Moderat / Netral",
    };
  } else {
    return {
      bg: "bg-rose-500/20",
      text: "text-rose-400",
      border: "border-rose-500/40",
      label: "Danger / Hindari",
    };
  }
}
