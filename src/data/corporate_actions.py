import pandas as pd
import numpy as np
from typing import Optional

def calculate_adjusted_ohlc(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adjust Open, High, Low, and Close using Adj Close ratio to prevent
    look-ahead distortion while maintaining correct percentage changes.
    Expected columns: ['open', 'high', 'low', 'close', 'adj_close']
    """
    df = df.copy()
    if 'adj_close' not in df.columns or 'close' not in df.columns:
        return df

    ratio = df['adj_close'] / df['close'].replace(0, np.nan)
    ratio = ratio.fillna(1.0)
    
    df['adj_open'] = df['open'] * ratio
    df['adj_high'] = df['high'] * ratio
    df['adj_low'] = df['low'] * ratio
    return df

def enforce_point_in_time(
    market_date: pd.Timestamp,
    fundamental_df: pd.DataFrame
) -> Optional[pd.Series]:
    """
    Returns the most recent fundamental report released on or before `market_date`
    strictly respecting `filing_date` (never period_end date) to avoid look-ahead bias.
    """
    if fundamental_df.empty:
        return None

    valid = fundamental_df[fundamental_df['filing_date'] <= market_date]
    if valid.empty:
        return None

    return valid.sort_values(by='filing_date', ascending=False).iloc[0]
