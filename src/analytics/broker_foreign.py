from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

class BrokerForeignEngine:
    """
    Broker Summary & Net Foreign Flow Analysis Engine.
    Computes:
    - Broker Concentration Ratios (CR3, CR5)
    - Net Foreign Flow Intensity (NFSI)
    - Institutional Stalker / ORCA Confluence Filter
    """

    @staticmethod
    def calculate_concentration_ratio(
        broker_trades: List[Dict[str, Any]],
        top_n: int = 3
    ) -> Dict[str, Any]:
        """
        Calculate buyer/seller concentration ratio from broker breakdown.
        Each trade dict: {'broker': 'YP', 'buy_val': 10e9, 'sell_val': 2e9}
        """
        if not broker_trades:
            return {
                f"top{top_n}_buy_cr": 0.0,
                f"top{top_n}_sell_cr": 0.0,
                "top_buyers": [],
                "top_sellers": [],
                "net_top_buyers": 0.0
            }

        df = pd.DataFrame(broker_trades)
        df['net_val'] = df['buy_val'] - df['sell_val']

        total_buy = df['buy_val'].sum()
        total_sell = df['sell_val'].sum()

        top_buyers = df.sort_values(by='buy_val', ascending=False).head(top_n)
        top_sellers = df.sort_values(by='sell_val', ascending=False).head(top_n)

        buy_cr = (top_buyers['buy_val'].sum() / total_buy) if total_buy > 0 else 0.0
        sell_cr = (top_sellers['sell_val'].sum() / total_sell) if total_sell > 0 else 0.0
        net_top = top_buyers['net_val'].sum()

        return {
            f"top{top_n}_buy_cr": round(float(buy_cr), 4),
            f"top{top_n}_sell_cr": round(float(sell_cr), 4),
            "top_buyers": top_buyers['broker'].tolist(),
            "top_sellers": top_sellers['broker'].tolist(),
            "net_top_buyers": round(float(net_top), 2)
        }

    @staticmethod
    def calculate_net_foreign_strength(
        foreign_flow_df: pd.DataFrame,
        window: int = 5
    ) -> float:
        """
        Calculate Net Foreign Strength Index (NFSI):
        Sum(NetForeign, window) / Sum(TotalValue, window) * 100
        """
        if foreign_flow_df.empty:
            return 0.0

        recent = foreign_flow_df.tail(window)
        total_val = (recent['foreign_buy_val'] + recent['foreign_sell_val']).sum()
        if total_val <= 0:
            return 0.0

        net_foreign = recent['foreign_net_val'].sum()
        nfsi = (net_foreign / total_val) * 100.0
        return round(float(np.clip(nfsi, -100.0, 100.0)), 2)

    @classmethod
    def evaluate_orca_confluence(
        cls,
        broker_cr3: float,
        net_foreign_val: float,
        candle_close: float,
        candle_high: float,
        candle_low: float,
        volume_intensity: float
    ) -> Dict[str, Any]:
        """
        Evaluate ORCA-style institutional accumulation confluence:
        - High Broker Concentration (CR3 >= 0.55)
        - Net Foreign positive accumulation
        - Bullish close (Close in top 30% of day's range)
        - High volume / intensity
        """
        candle_range = candle_high - candle_low
        close_location = (candle_close - candle_low) / (candle_range + 1e-6)

        c1_broker = broker_cr3 >= 0.55
        c2_foreign = net_foreign_val > 0
        c3_bullish_close = close_location >= 0.70
        c4_intensity = volume_intensity >= 1.2

        is_orca_signal = c1_broker and c3_bullish_close and (c2_foreign or c4_intensity)
        confidence = sum([c1_broker, c2_foreign, c3_bullish_close, c4_intensity]) / 4.0 * 100.0

        return {
            "is_orca_signal": is_orca_signal,
            "confidence_pct": round(confidence, 1),
            "close_in_top_range": round(close_location * 100, 1),
            "broker_cr3": round(broker_cr3, 3),
            "net_foreign_positive": c2_foreign
        }
