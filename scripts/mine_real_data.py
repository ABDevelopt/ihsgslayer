import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import sys
sys.path.insert(0, os.path.abspath("."))

from src.analytics.real_data_miner import RealDataMiner
import json

print("Starting Real Historical IDX Market Data Mining...")
evals, hists = RealDataMiner.mine_real_signals_and_outcomes()
print(f"Extraction complete! Total Real Evaluated Trades: {len(evals)}, Total Real Signal History: {len(hists)}")

os.makedirs("data", exist_ok=True)
with open("data/signal_evaluations.json", "w", encoding="utf-8") as f:
    json.dump(evals, f, indent=2, default=str)

with open("data/signal_history.json", "w", encoding="utf-8") as f:
    json.dump(hists, f, indent=2, default=str)

print("Successfully written 100% real market datasets to data/signal_evaluations.json and data/signal_history.json")
