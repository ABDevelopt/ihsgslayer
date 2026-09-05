import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.core.logging import setup_logger
from src.data.collector import DataCollector
from src.analytics.bsjp import BSJPEngine
from src.backtest.metrics import PerformanceMetrics

logger = setup_logger("bsjp_ara_backtester")

# Expanded Universe with High-Beta & Momentum Equities in IDX History
BSJP_UNIVERSE = [
    {"symbol": "CUAN.JK", "name": "Petrindo Jaya Kreasi Tbk", "sector": "Energy"},
    {"symbol": "BREN.JK", "name": "Barito Renewables Energy Tbk", "sector": "Infrastructures"},
    {"symbol": "AMMN.JK", "name": "Amman Mineral Internasional Tbk", "sector": "Basic Materials"},
    {"symbol": "PANI.JK", "name": "Pantai Indah Kapuk Dua Tbk", "sector": "Properties"},
    {"symbol": "TPIA.JK", "name": "Chandra Asri Pacific Tbk", "sector": "Basic Materials"},
    {"symbol": "BRPT.JK", "name": "Barito Pacific Tbk", "sector": "Basic Materials"},
    {"symbol": "MEDC.JK", "name": "Medco Energi Internasional Tbk", "sector": "Energy"},
    {"symbol": "MDKA.JK", "name": "Merdeka Copper Gold Tbk", "sector": "Basic Materials"},
    {"symbol": "GOTO.JK", "name": "GoTo Gojek Tokopedia Tbk", "sector": "Technology"},
    {"symbol": "ADRO.JK", "name": "Adaro Energy Indonesia Tbk", "sector": "Energy"},
    {"symbol": "PTBA.JK", "name": "Bukit Asam Tbk", "sector": "Energy"},
    {"symbol": "PGAS.JK", "name": "Perusahaan Gas Negara Tbk", "sector": "Energy"},
    {"symbol": "ACES.JK", "name": "Aspirasi Hidup Indonesia Tbk", "sector": "Consumer Cyclicals"},
    {"symbol": "MAPI.JK", "name": "Mitra Adiperkasa Tbk", "sector": "Consumer Cyclicals"},
    {"symbol": "ERAA.JK", "name": "Erajaya Swasembada Tbk", "sector": "Consumer Cyclicals"},
    {"symbol": "BBRI.JK", "name": "Bank Rakyat Indonesia Tbk", "sector": "Financials"},
    {"symbol": "BMRI.JK", "name": "Bank Mandiri (Persero) Tbk", "sector": "Financials"},
    {"symbol": "BBNI.JK", "name": "Bank Negara Indonesia Tbk", "sector": "Financials"},
    {"symbol": "BBCA.JK", "name": "Bank Central Asia Tbk", "sector": "Financials"},
    {"symbol": "TLKM.JK", "name": "Telkom Indonesia Tbk", "sector": "Telecommunication"},
]

def run_bsjp_historical_ara_test():
    print("=" * 85)
    print("  PENGUJIAN KUANTITATIF BSJP (BELI SORE JUAL PAGI) -> TARGET ARA & MORNING SURGE")
    print(f"  Tanggal Evaluasi: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Universe: {len(BSJP_UNIVERSE)} Saham Likuid & High-Beta Momentum IDX (2 Tahun Data Riil)")
    print("=" * 85)

    collector = DataCollector()
    universe_data = {}

    print("\n[1/3] Mengunduh Data Historis Harian Asli (Open, High, Low, Close, Volume)...")
    for item in BSJP_UNIVERSE:
        sym = item['symbol']
        print(f"  -> Ingesting {sym} ({item['name']})...")
        df = collector.fetch_historical_ohlcv(sym, period="2y")
        if not df.empty and len(df) >= 30:
            universe_data[sym] = df

    print(f"\n[2/3] Memindai Seluruh Bar Historis untuk Sinyal Sesi Sore (Pre-Closing 15:50 WIB)...")
    
    bsjp_signals = []
    
    # Ingest IHSG benchmark for macro regime
    ihsg_df = collector.fetch_historical_ohlcv("^JKSE", period="2y")

    # Iterate through all historical days for each stock
    for sym, df in universe_data.items():
        name = next((s['name'] for s in BSJP_UNIVERSE if s['symbol'] == sym), sym)
        sector = next((s['sector'] for s in BSJP_UNIVERSE if s['symbol'] == sym), "")

        for i in range(25, len(df) - 1):
            sub_df = df.iloc[:i+1]
            cand = BSJPEngine.evaluate_bsjp_candidate(
                df=sub_df,
                symbol=sym,
                name=name,
                sector=sector,
                min_adtv=2_000_000_000.0,
                ihsg_df=ihsg_df.iloc[:i+1] if not ihsg_df.empty and len(ihsg_df) > i else None
            )

            if cand is None or cand.bsjp_score < 70.0:
                continue

            today_bar = df.iloc[i]
            tomorrow_bar = df.iloc[i+1]  # Next day (Morning outcome)
            close_p = float(today_bar['close'])
            day_gain_pct = cand.day_gain_pct
            vol_mult = cand.volume_multiplier
            bsjp_score = cand.bsjp_score

            # NEXT DAY OUTCOMES (Day T+1 Morning Data)
            next_open = float(tomorrow_bar['open'])
            next_high = float(tomorrow_bar['high'])
            next_low = float(tomorrow_bar['low'])
            next_close = float(tomorrow_bar['close'])

            # Return Metrics
            open_gap_pct = ((next_open / close_p) - 1.0) * 100.0
            max_high_gain_pct = ((next_high / close_p) - 1.0) * 100.0
            close_gain_pct = ((next_close / close_p) - 1.0) * 100.0
            is_gap_up = next_open > close_p

            # Hit ARA / Huge Winner Categories
            hit_5pct = max_high_gain_pct >= 5.0
            hit_8pct = max_high_gain_pct >= 8.0
            hit_10pct = max_high_gain_pct >= 10.0
            hit_15pct = max_high_gain_pct >= 15.0
            hit_ara_tier = max_high_gain_pct >= 20.0  # Approaching or hitting ARA

            # Simulate Morning Trading P&L (Exit: Sell at Open + 2.5% Target, or Open price if open > +2.5%, Stop Loss -2.0%)
            # Real fees: 0.15% buy, 0.25% sell (incl tax), 0.10% slippage
            buy_price = close_p * 1.0010  # 0.1% buy slippage
            buy_cost = buy_price * 1.0015

            # Morning Execution Logic
            if max_high_gain_pct >= 3.5:
                # Target Profit +3.5% hit in morning session
                raw_exit = close_p * 1.035
                exit_reason = "TAKE_PROFIT_MORNING"
            elif open_gap_pct >= 2.0:
                # Sold at Open Gap
                raw_exit = next_open
                exit_reason = "OPEN_GAP_EXIT"
            elif next_low <= close_p * 0.98:
                # Hit Morning Stop Loss -2.0%
                raw_exit = close_p * 0.98
                exit_reason = "STOP_LOSS_MORNING"
            else:
                # Exit at next day close
                raw_exit = next_close
                exit_reason = "CLOSE_EXIT"

            sell_proceeds = raw_exit * (1.0 - 0.0010) * (1.0 - 0.0025)
            trade_pnl_pct = ((sell_proceeds / buy_cost) - 1.0) * 100.0

            bsjp_signals.append({
                "symbol": sym,
                "name": name,
                "sector": sector,
                "buy_date": str(today_bar['date']),
                "buy_close_price": round(close_p, 2),
                "day_gain_pct": round(day_gain_pct, 2),
                "vol_mult": round(vol_mult, 2),
                "bsjp_score": round(bsjp_score, 1),
                "next_date": str(tomorrow_bar['date']),
                "next_open_price": round(next_open, 2),
                "next_high_price": round(next_high, 2),
                "next_low_price": round(next_low, 2),
                "next_close_price": round(next_close, 2),
                "open_gap_pct": round(open_gap_pct, 2),
                "max_high_gain_pct": round(max_high_gain_pct, 2),
                "close_gain_pct": round(close_gain_pct, 2),
                "is_gap_up": is_gap_up,
                "hit_5pct": hit_5pct,
                "hit_8pct": hit_8pct,
                "hit_10pct": hit_10pct,
                "hit_15pct": hit_15pct,
                "hit_ara_tier": hit_ara_tier,
                "trade_pnl_pct": round(trade_pnl_pct, 2),
                "exit_reason": exit_reason
            })

    print(f"\n[3/3] Menganalisis Statistik Kinerja BSJP ({len(bsjp_signals)} Total Sinyal Terdeteksi)...")

    if not bsjp_signals:
        print("Tidak ada sinyal yang terdeteksi.")
        return

    sig_df = pd.DataFrame(bsjp_signals)

    total_signals = len(sig_df)
    gap_up_count = sig_df['is_gap_up'].sum()
    gap_up_rate = (gap_up_count / total_signals) * 100.0

    avg_open_gap = sig_df['open_gap_pct'].mean()
    avg_max_high = sig_df['max_high_gain_pct'].mean()
    avg_close_gain = sig_df['close_gain_pct'].mean()

    hit_5_rate = (sig_df['hit_5pct'].sum() / total_signals) * 100.0
    hit_8_rate = (sig_df['hit_8pct'].sum() / total_signals) * 100.0
    hit_10_rate = (sig_df['hit_10pct'].sum() / total_signals) * 100.0
    hit_15_rate = (sig_df['hit_15pct'].sum() / total_signals) * 100.0
    hit_ara_rate = (sig_df['hit_ara_tier'].sum() / total_signals) * 100.0

    # Trade Metrics with fees
    wins = sig_df[sig_df['trade_pnl_pct'] > 0]
    losses = sig_df[sig_df['trade_pnl_pct'] < 0]
    win_rate = (len(wins) / total_signals) * 100.0
    profit_factor = (wins['trade_pnl_pct'].sum() / abs(losses['trade_pnl_pct'].sum())) if len(losses) > 0 else 99.0
    avg_trade_pnl = sig_df['trade_pnl_pct'].mean()

    # Top ARA / Monster Gainers
    top_ara_winners = sig_df.sort_values(by='max_high_gain_pct', ascending=False).head(10).to_dict(orient="records")

    summary = {
        "timestamp": datetime.now().isoformat(),
        "total_signals": total_signals,
        "gap_up_win_rate_pct": round(float(gap_up_rate), 2),
        "avg_morning_open_gap_pct": round(float(avg_open_gap), 2),
        "avg_morning_max_high_pct": round(float(avg_max_high), 2),
        "avg_next_close_gain_pct": round(float(avg_close_gain), 2),
        "hit_5pct_probability": round(float(hit_5_rate), 2),
        "hit_8pct_probability": round(float(hit_8_rate), 2),
        "hit_10pct_probability": round(float(hit_10_rate), 2),
        "hit_15pct_probability": round(float(hit_15_rate), 2),
        "hit_ara_tier_20pct_plus_probability": round(float(hit_ara_rate), 2),
        "simulated_strategy_metrics": {
            "win_rate_pct": round(float(win_rate), 2),
            "profit_factor": round(float(profit_factor), 2),
            "avg_trade_pnl_pct": round(float(avg_trade_pnl), 2),
            "total_trades": total_signals
        },
        "top_ara_super_trades": top_ara_winners
    }

    # Save to file
    out_file = os.path.join(os.path.dirname(__file__), "..", "bsjp_ara_test_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)

    print("\n" + "=" * 85)
    print("  HASIL PENGUJIAN HISTORIS BSJP -> TARGET ARA & MORNING GAP-UP")
    print("=" * 85)
    print(f"  Total Sinyal BSJP Teruji           : {total_signals} Sinyal")
    print(f"  Probabilitas Buka Gap-Up (Open > Close) : {gap_up_rate:.2f}%")
    print(f"  Rata-rata Lonjakan Pagi (Max High) : +{avg_max_high:.2f}%")
    print(f"  Peluang Lonjakan >= +5% Esok Pagi  : {hit_5_rate:.2f}%")
    print(f"  Peluang Lonjakan >= +8% Esok Pagi  : {hit_8_rate:.2f}%")
    print(f"  Peluang Lonjakan >= +10% Esok Pagi : {hit_10_rate:.2f}%")
    print(f"  Peluang Menyentuh ARA (>= +20%)    : {hit_ara_rate:.2f}% ({sig_df['hit_ara_tier'].sum()} Kali Kejadian)")
    print(f"  Win Rate Strategi Riil (Net Fee)   : {win_rate:.2f}%")
    print(f"  Profit Factor (Net Fee)            : {profit_factor:.2f}")
    print("=" * 85)

    return summary

if __name__ == "__main__":
    run_bsjp_historical_ara_test()
