import os
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.collector import DataCollector
from src.analytics.bsjp import BSJPEngine
from scripts.run_live_market_test import UNIVERSE

def run_bsjp_scan():
    print("=" * 80)
    print("  MEMINDAI KANDIDAT BELI SORE JUAL PAGI (BSJP) DARI BURSA EFEK INDONESIA")
    print(f"  Waktu Sesi: Pre-Closing (15:45 - 16:00 WIB) | As of: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 80)

    collector = DataCollector()
    universe_ohlcv = {}

    print("Mengunduh data intraday/daily terkini...")
    for item in UNIVERSE:
        sym = item['symbol']
        df = collector.fetch_historical_ohlcv(sym, period="60d")
        universe_ohlcv[sym] = df

    candidates = BSJPEngine.scan_bsjp_universe(universe_ohlcv, UNIVERSE, min_score=50.0)

    print(f"\nDitemukan {len(candidates)} Saham Potensial BSJP:")
    print("-" * 80)
    for i, c in enumerate(candidates, 1):
        print(f"[{i}] {c.symbol} ({c.name}) - Sektor: {c.sector}")
        print(f"    Harga Penutupan: Rp {c.close_price:,.0f} (+{c.day_gain_pct:.2f}%)")
        print(f"    BSJP Score: {c.bsjp_score:.1f}/100 | Probabilitas Gap-Up Pagi: {c.gap_up_probability}")
        print(f"    Volume Multiplier: {c.volume_multiplier:.2f}x SMA20 | Close to High: {c.close_to_high_ratio_pct:.1f}%")
        print(f"    🎯 Target Jual Pagi (09:00 - 09:15 WIB): Rp {c.target_sell_morning_min:,.0f} (+2.5%) s.d Rp {c.target_sell_morning_max:,.0f} (+6.0%)")
        print(f"    🛑 Stop Loss Pagi: < Rp {c.stop_loss_morning:,.0f} (-2.0%)")
        print(f"    Alasan Terpilih: {', '.join(c.reasons)}")
        print("-" * 80)

if __name__ == "__main__":
    run_bsjp_scan()
