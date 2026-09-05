from datetime import date
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from src.data.schema import AIScoreResult

class AIScoreEngine:
    """
    Multi-Factor AI Intelligence Scoring Engine for IDX Equities.
    Evaluates 5 pillars: Profitability, Relative Valuation, Financial Health,
    Liquidity, and Market Confirmation, with sector-level normalization and Danger Zone penalty.
    """

    WEIGHT_PROFITABILITY = 0.30  # ROE (15%), NPM (10%), ROA (5%)
    WEIGHT_VALUATION = 0.25      # PER (15%), PBV (10%)
    WEIGHT_HEALTH = 0.20         # DER (20%)
    WEIGHT_LIQUIDITY = 0.15      # ADTV 20-day (15%)
    WEIGHT_MOMENTUM = 0.10       # 1M return (5%), 3M return (5%)

    @staticmethod
    def _percentile_rank(val: Optional[float], series: pd.Series, ascending: bool = True) -> float:
        """Calculate percentile rank of a value within its sector universe (0 to 100)."""
        if val is None or pd.isna(val):
            return 50.0  # Default neutral score for missing metrics
        
        valid_series = series.dropna()
        if len(valid_series) <= 1:
            return 50.0

        if ascending:
            # Higher value gets higher percentile (e.g. ROE, NPM, ADTV)
            rank = (valid_series <= val).mean() * 100.0
        else:
            # Lower positive value gets higher percentile (e.g. PER, PBV, DER)
            # Filter out non-sensical <= 0 values for PER/PBV
            positive_series = valid_series[valid_series > 0]
            if val <= 0 or len(positive_series) <= 1:
                return 10.0  # Penalty for negative valuation (loss-making)
            rank = (positive_series >= val).mean() * 100.0

        return float(np.clip(rank, 0.0, 100.0))

    def compute_score_for_universe(
        self,
        stocks_data: List[Dict[str, Any]]
    ) -> List[AIScoreResult]:
        """
        Compute sector-normalized AI Score for a collection of stocks.
        Each stock dict must contain:
        - symbol, sector, date
        - roe, npm, roa, per, pbv, der, adtv_20, return_1m, return_3m
        """
        if not stocks_data:
            return []

        df = pd.DataFrame(stocks_data)
        results: List[AIScoreResult] = []

        # Group by sector for relative peer normalization
        for sector, group in df.groupby("sector"):
            for _, row in group.iterrows():
                # 1. Profitability (30%)
                rank_roe = self._percentile_rank(row.get("roe"), group["roe"], ascending=True)
                rank_npm = self._percentile_rank(row.get("npm"), group["npm"], ascending=True)
                rank_roa = self._percentile_rank(row.get("roa"), group["roa"], ascending=True)
                prof_score = 0.50 * rank_roe + 0.33 * rank_npm + 0.17 * rank_roa

                # 2. Relative Valuation (25%)
                rank_per = self._percentile_rank(row.get("per"), group["per"], ascending=False)
                rank_pbv = self._percentile_rank(row.get("pbv"), group["pbv"], ascending=False)
                val_score = 0.60 * rank_per + 0.40 * rank_pbv

                # 3. Financial Health (20%)
                rank_der = self._percentile_rank(row.get("der"), group["der"], ascending=False)
                health_score = rank_der

                # 4. Liquidity (15%)
                rank_adtv = self._percentile_rank(row.get("adtv_20"), group["adtv_20"], ascending=True)
                liq_score = rank_adtv

                # 5. Momentum / Market Confirmation (10%)
                rank_1m = self._percentile_rank(row.get("return_1m"), group["return_1m"], ascending=True)
                rank_3m = self._percentile_rank(row.get("return_3m"), group["return_3m"], ascending=True)
                mom_score = 0.50 * rank_1m + 0.50 * rank_3m

                # Raw Composite Score
                raw_score = (
                    self.WEIGHT_PROFITABILITY * prof_score +
                    self.WEIGHT_VALUATION * val_score +
                    self.WEIGHT_HEALTH * health_score +
                    self.WEIGHT_LIQUIDITY * liq_score +
                    self.WEIGHT_MOMENTUM * mom_score
                )

                # Check Danger Zone Rules
                is_danger_zone = False
                danger_reasons = []

                der_val = row.get("der")
                npm_val = row.get("npm")
                roe_val = row.get("roe")

                if der_val is not None and npm_val is not None:
                    if der_val > 3.0 and npm_val < 0:
                        is_danger_zone = True
                        danger_reasons.append("High Leverage (DER > 3.0) with Net Loss (NPM < 0)")

                if roe_val is not None and roe_val < -15.0:
                    is_danger_zone = True
                    danger_reasons.append("Severe Negative ROE (< -15%)")

                final_score = raw_score
                if is_danger_zone:
                    final_score = min(raw_score, 35.0)

                # Categorical Label
                if is_danger_zone:
                    label = "DANGER_ZONE"
                elif final_score >= 75.0:
                    label = "UNDERVALUED_QUALITY"
                elif final_score >= 60.0:
                    label = "FAIR_VALUE"
                elif final_score >= 40.0:
                    label = "NEUTRAL"
                else:
                    label = "AVOID"

                eval_date = row.get("date", date.today())
                if isinstance(eval_date, str):
                    eval_date = pd.to_datetime(eval_date).date()

                results.append(
                    AIScoreResult(
                        symbol=str(row["symbol"]),
                        date=eval_date,
                        ai_score=round(float(final_score), 2),
                        label=label,
                        profitability_score=round(float(prof_score), 2),
                        valuation_score=round(float(val_score), 2),
                        health_score=round(float(health_score), 2),
                        liquidity_score=round(float(liq_score), 2),
                        momentum_score=round(float(mom_score), 2),
                        is_danger_zone=is_danger_zone,
                        danger_zone_reasons=danger_reasons,
                        components={
                            "rank_roe": round(rank_roe, 1),
                            "rank_npm": round(rank_npm, 1),
                            "rank_roa": round(rank_roa, 1),
                            "rank_per": round(rank_per, 1),
                            "rank_pbv": round(rank_pbv, 1),
                            "rank_der": round(rank_der, 1),
                            "rank_adtv": round(rank_adtv, 1),
                            "raw_score": round(raw_score, 2),
                        }
                    )
                )

        return sorted(results, key=lambda x: x.ai_score, reverse=True)
