/**
 * Money Management & Position Sizing Engine for IDX Equities.
 * Enhanced with Phase 1 Volatility-Adjusted Sizing (ATR 14 Risk Parity).
 */

export interface PositionSizingResult {
  convictionTier: "ULTRA" | "HIGH" | "MODERATE" | "TACTICAL";
  convictionLabel: string;
  volatilityCategory: "RENDAH" | "NORMAL" | "TINGGI";
  volatilityLabel: string;
  atrPct: number;
  allocationPct: number; // Final allocated % of portfolio
  targetAllocationRp: number; // Final nominal in Rp
  lots: number;
  totalShares: number;
  nominalRealRp: number;
  feeBuyRp: number;
  totalCashNeededRp: number;
  potentialProfitRp: number;
  maxRiskRp: number;
  portfolioRiskPct: number;
  isVolatilityTrimmed: boolean;
  brokerOrderSummary: string;
}

export function calculatePositionSizing(
  price: number,
  score: number = 70.0,
  totalCapital: number = 10_000_000,
  stopLossPct: number = 2.5,
  tp1GainPct: number = 4.5,
  symbol: string = "",
  atrPct?: number
): PositionSizingResult {
  const p = Math.max(1, price);
  const cap = Math.max(1_000_000, totalCapital);

  // 1. Determine Base Conviction Tier & Allocation %
  let tier: "ULTRA" | "HIGH" | "MODERATE" | "TACTICAL" = "MODERATE";
  let baseAllocPct = 15;
  let label = "Konviksi Menengah (15% Modal)";

  if (score >= 80.0) {
    tier = "ULTRA";
    baseAllocPct = 25;
    label = "Konviksi Tinggi / Grade A (25% Modal)";
  } else if (score >= 70.0) {
    tier = "HIGH";
    baseAllocPct = 20;
    label = "Konviksi Solid (20% Modal)";
  } else if (score >= 60.0) {
    tier = "MODERATE";
    baseAllocPct = 15;
    label = "Konviksi Standar (15% Modal)";
  } else {
    tier = "TACTICAL";
    baseAllocPct = 10;
    label = "Taktikal Konservatif (10% Modal)";
  }

  const baseTargetAlloc = (cap * baseAllocPct) / 100.0;

  // 2. Volatility Analysis (14-Day ATR)
  const defaultAtr = stopLossPct > 0 ? Math.abs(stopLossPct) * 1.25 : 3.0;
  const effectiveAtr = atrPct && atrPct > 0 ? atrPct : defaultAtr;

  let volCat: "RENDAH" | "NORMAL" | "TINGGI" = "NORMAL";
  let volLabel = "Volatilitas Normal";

  if (effectiveAtr < 2.5) {
    volCat = "RENDAH";
    volLabel = "Volatilitas Rendah (Tenang)";
  } else if (effectiveAtr > 4.5) {
    volCat = "TINGGI";
    volLabel = "Volatilitas Tinggi (Liar)";
  }

  // 3. Volatility Parity Risk Calibration
  // Stop Distance dynamic based on ATR: max(SL%, 1.35 * ATR%)
  const stopDistancePct = Math.max(Math.abs(stopLossPct), effectiveAtr * 1.35);

  // Risk budget per trade: 0.5% - 0.75% of portfolio
  const riskBudgetMultiplier =
    tier === "ULTRA" ? 0.0075 : tier === "HIGH" ? 0.006 : tier === "MODERATE" ? 0.005 : 0.004;
  const riskBudgetRp = cap * riskBudgetMultiplier;

  // Parity allocation: Risk Budget / Stop Distance %
  const parityAllocRp = riskBudgetRp / (stopDistancePct / 100.0);

  // Final allocation capped by base conviction
  let finalTargetAlloc = Math.min(baseTargetAlloc, parityAllocRp);

  // Ensure minimum viable allocation (at least 1 lot if affordable)
  const costPerLot = p * 100;
  if (finalTargetAlloc < costPerLot && cap >= costPerLot) {
    finalTargetAlloc = costPerLot;
  }

  const isTrimmed = finalTargetAlloc < baseTargetAlloc * 0.92;
  const finalAllocPct = parseFloat(((finalTargetAlloc / cap) * 100.0).toFixed(1));

  // 4. Compute Lots (1 lot = 100 shares in IDX)
  let lots = Math.floor(finalTargetAlloc / costPerLot);
  if (lots < 1 && cap >= costPerLot) {
    lots = 1;
  }

  const totalShares = lots * 100;
  const nominalReal = totalShares * p;
  const feeBuy = nominalReal * 0.0015; // 0.15% fee beli
  const totalCash = nominalReal + feeBuy;

  const slPct = Math.abs(stopLossPct) / 100.0;
  const tpPct = Math.abs(tp1GainPct) / 100.0;

  const maxRisk = nominalReal * slPct;
  const potentialProfit = nominalReal * tpPct;
  const portRiskPct = parseFloat(((maxRisk / cap) * 100.0).toFixed(2));

  const cleanSym = symbol.replace(".JK", "");
  const volNote = isTrimmed ? " [ATR-Calibrated]" : "";
  const brokerOrder = `BUY ${cleanSym} ${lots} LOT @ Rp ${p.toLocaleString("id-ID")} (Total Rp ${nominalReal.toLocaleString("id-ID")}) | SL: -${stopLossPct.toFixed(1)}% | TP: +${tp1GainPct.toFixed(1)}%${volNote}`;

  return {
    convictionTier: tier,
    convictionLabel: label,
    volatilityCategory: volCat,
    volatilityLabel: volLabel,
    atrPct: parseFloat(effectiveAtr.toFixed(2)),
    allocationPct: finalAllocPct,
    targetAllocationRp: Math.round(finalTargetAlloc),
    lots,
    totalShares,
    nominalRealRp: nominalReal,
    feeBuyRp: Math.round(feeBuy),
    totalCashNeededRp: Math.round(totalCash),
    potentialProfitRp: Math.round(potentialProfit),
    maxRiskRp: Math.round(maxRisk),
    portfolioRiskPct: portRiskPct,
    isVolatilityTrimmed: isTrimmed,
    brokerOrderSummary: brokerOrder
  };
}
