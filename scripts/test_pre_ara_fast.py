import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

import sys
sys.path.insert(0, os.path.abspath("."))

from src.data.universe import FULL_IDX_UNIVERSE
from src.data.collector import DataCollector
from src.analytics.pre_ara_hunter import PreARAHunterEngine
import time

t0 = time.time()
collector = DataCollector()
syms = [x['symbol'] for x in FULL_IDX_UNIVERSE]
ohlcv_map = collector.fetch_universe_ohlcv_parallel(syms, period="60d", max_workers=25)

candidates = PreARAHunterEngine.scan_pre_ara_universe(
    ohlcv_map=ohlcv_map,
    universe_list=FULL_IDX_UNIVERSE,
    min_score=60.0
)

print(f"Scanned {len(FULL_IDX_UNIVERSE)} stocks in {time.time()-t0:.2f}s. Found {len(candidates)} Pre-ARA candidates:")
for c in candidates:
    print(f"[{c.symbol}] {c.name} | Skor: {c.pre_ara_score} ({c.ara_probability}) | Early Gain: +{c.morning_gain_pct}% | Vol Velocity: {c.volume_velocity_multiplier}x | Sisa ke ARA: +{c.distance_to_ara_pct}% | Target ARA: {c.target_ara_sell}")
