from typing import List, Dict, Any, Optional
import pandas as pd
from pydantic import BaseModel, Field

class ScreenerFilter(BaseModel):
    min_ai_score: Optional[float] = None
    max_ai_score: Optional[float] = None
    sectors: Optional[List[str]] = None
    patterns: Optional[List[str]] = None
    exclude_danger_zone: bool = True
    min_adtv: Optional[float] = None
    net_foreign_positive: Optional[bool] = None
    min_volume_intensity: Optional[float] = None
    require_hidden_accumulation: Optional[bool] = None
    require_orca_confluence: Optional[bool] = None
    sort_by: str = "ai_score"
    ascending: bool = False
    limit: int = 50

class ScreenerEngine:
    """Multi-Factor Screener & Ranking Engine for IDX Universe."""

    def filter_and_rank(
        self,
        stocks_metrics: List[Dict[str, Any]],
        filter_criteria: ScreenerFilter
    ) -> List[Dict[str, Any]]:
        """
        Filter and rank stocks based on composite quantitative criteria.
        """
        if not stocks_metrics:
            return []

        df = pd.DataFrame(stocks_metrics)

        # 1. AI Score Filters
        if filter_criteria.min_ai_score is not None:
            df = df[df['ai_score'] >= filter_criteria.min_ai_score]
        if filter_criteria.max_ai_score is not None:
            df = df[df['ai_score'] <= filter_criteria.max_ai_score]

        # 2. Danger Zone Filter
        if filter_criteria.exclude_danger_zone and 'is_danger_zone' in df.columns:
            df = df[df['is_danger_zone'] == False]

        # 3. Sector Filter
        if filter_criteria.sectors and 'sector' in df.columns:
            df = df[df['sector'].isin(filter_criteria.sectors)]

        # 4. Pattern Filter
        if filter_criteria.patterns and 'active_patterns' in df.columns:
            def matches_pattern(active_list):
                if not isinstance(active_list, list):
                    return False
                return any(p in active_list for p in filter_criteria.patterns)
            df = df[df['active_patterns'].apply(matches_pattern)]

        # 5. Liquidity / ADTV Filter
        if filter_criteria.min_adtv is not None and 'adtv_20' in df.columns:
            df = df[df['adtv_20'] >= filter_criteria.min_adtv]

        # 6. Foreign Flow Filter
        if filter_criteria.net_foreign_positive is not None and 'net_foreign_val' in df.columns:
            if filter_criteria.net_foreign_positive:
                df = df[df['net_foreign_val'] > 0]
            else:
                df = df[df['net_foreign_val'] <= 0]

        # 7. Volume Intensity Filter
        if filter_criteria.min_volume_intensity is not None and 'volume_intensity' in df.columns:
            df = df[df['volume_intensity'] >= filter_criteria.min_volume_intensity]

        # 8. Order-Flow Accumulation Filter
        if filter_criteria.require_hidden_accumulation and 'is_hidden_accumulation' in df.columns:
            df = df[df['is_hidden_accumulation'] == True]

        # 9. ORCA Confluence Filter
        if filter_criteria.require_orca_confluence and 'is_orca_signal' in df.columns:
            df = df[df['is_orca_signal'] == True]

        if df.empty:
            return []

        # Sort and limit
        sort_col = filter_criteria.sort_by
        if sort_col in df.columns:
            df = df.sort_values(by=sort_col, ascending=filter_criteria.ascending)
        else:
            df = df.sort_values(by='ai_score', ascending=False)

        return df.head(filter_criteria.limit).to_dict(orient="records")
