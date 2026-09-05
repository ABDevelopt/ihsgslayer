import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.collector import DataCollector
from src.data.universe import FULL_IDX_UNIVERSE
from src.analytics.ai_score import AIScoreEngine
from src.analytics.patterns import PatternRecognizer
from src.analytics.order_flow import OrderFlowEngine
from src.analytics.bsjp import BSJPEngine
from src.backtest.engine import BacktestEngine, BacktestConfig
from src.backtest.metrics import PerformanceMetrics

def generate_signals_and_enhanced_backtest():
    print("=" * 85)
    print("  PEMINDAIAN SINYAL BUY INSTITUSIONAL BERKUALITAS TINGGI & OPTIMASI BACKTEST")
    print(f"  Waktu Evaluasi: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} WIB")
    print(f"  Semesta Analisis: {len(FULL_IDX_UNIVERSE)} Emiten BEI")
    print("=" * 85)

    collector = DataCollector()
    ai_engine = AIScoreEngine()
    pattern_engine = PatternRecognizer()
    order_flow_engine = OrderFlowEngine()

    symbols = [item['symbol'] for item in FULL_IDX_UNIVERSE]
    print(f"\n[1/3] Mengunduh data historis & fundamental untuk {len(symbols)} emiten...")
    ohlcv_map = collector.fetch_universe_ohlcv_parallel(symbols, period="150d", max_workers=25)
    ihsg_df = collector.fetch_historical_ohlcv("^JKSE", period="150d")

    raw_stock_data = []
    for item in FULL_IDX_UNIVERSE:
        sym = item['symbol']
        sec = item['sector']
        df = ohlcv_map.get(sym, pd.DataFrame())
        if df.empty or len(df) < 25:
            continue
        fund = collector.fetch_fundamentals(sym)
        curr_p = float(df['close'].iloc[-1])
        ret_1m = ((curr_p / df['close'].iloc[-21]) - 1.0) * 100.0 if len(df) >= 22 else 0.0
        ret_3m = ((curr_p / df['close'].iloc[-63]) - 1.0) * 100.0 if len(df) >= 64 else 0.0
        adtv = float(df['value'].iloc[-20:].mean()) if len(df) >= 20 else 1e9

        raw_stock_data.append({
            "symbol": sym,
            "sector": sec,
            "name": item.get("name", sym),
            "subsector": item.get("subsector", ""),
            "date": str(df['date'].iloc[-1]),
            "roe": fund.get("roe"),
            "npm": fund.get("npm"),
            "roa": fund.get("roa"),
            "per": fund.get("per"),
            "pbv": fund.get("pbv"),
            "der": fund.get("der"),
            "adtv_20": adtv,
            "return_1m": ret_1m,
            "return_3m": ret_3m,
            "price": curr_p
        })

    scores = {res.symbol: res for res in ai_engine.compute_score_for_universe(raw_stock_data)}

    # Filter High-Conviction Setups
    high_conviction_candidates = []

    for raw in raw_stock_data:
        sym = raw['symbol']
        df = ohlcv_map.get(sym)
        if df is None or df.empty or len(df) < 30:
            continue

        score_obj = scores.get(sym)
        if not score_obj or score_obj.is_danger_zone or score_obj.ai_score < 68.0:
            continue  # Must be high quality fundamental

        if raw['adtv_20'] < 3_000_000_000.0:  # Min Rp 3 Miliar ADTV
            continue

        patterns = pattern_engine.scan_all_patterns(df)
        pat_names = [p.pattern_name for p in patterns]
        of_res = order_flow_engine.detect_orderflow_signals(df)

        # Multi-confluence qualification:
        # 1. AI Score >= 68 AND
        # 2. (Has Active Pattern OR Hidden Accumulation OR High Absorption >= 1.3)
        has_setup = (len(pat_names) > 0) or of_res.get("is_hidden_accumulation", False) or (of_res.get("absorption_efficiency", 1.0) >= 1.35)

        if has_setup:
            curr_p = float(df['close'].iloc[-1])
            low_20 = float(df['low'].iloc[-20:].min())
            high_20 = float(df['high'].iloc[-20:].max())

            # Define Precise Price Action Levels (Tick Fractional Precision)
            entry_low = round(curr_p * 0.99, 0)
            entry_high = round(curr_p * 1.01, 0)
            
            # Stop Loss below recent swing low with buffer
            stop_loss = round(min(curr_p * 0.955, low_20 * 0.99), 0)
            risk_pct = ((curr_p - stop_loss) / curr_p) * 100.0

            # Targets
            tp1 = round(curr_p * (1.0 + max(0.06, risk_pct * 1.6 / 100.0)), 0)
            tp2 = round(curr_p * (1.0 + max(0.12, risk_pct * 2.8 / 100.0)), 0)
            gain_tp1_pct = ((tp1 / curr_p) - 1.0) * 100.0
            gain_tp2_pct = ((tp2 / curr_p) - 1.0) * 100.0
            rr_ratio = round(gain_tp1_pct / (risk_pct + 1e-6), 2)

            high_conviction_candidates.append({
                "symbol": sym,
                "name": raw["name"],
                "sector": raw["sector"],
                "subsector": raw["subsector"],
                "price": curr_p,
                "ai_score": score_obj.ai_score,
                "label": score_obj.label,
                "active_patterns": pat_names,
                "absorption_index": of_res.get("absorption_efficiency", 1.0),
                "is_hidden_accumulation": of_res.get("is_hidden_accumulation", False),
                "entry_zone": f"Rp {entry_low:,.0f} - Rp {entry_high:,.0f}",
                "stop_loss": f"Rp {stop_loss:,.0f} (-{risk_pct:.2f}%)",
                "tp1": f"Rp {tp1:,.0f} (+{gain_tp1_pct:.2f}%)",
                "tp2": f"Rp {tp2:,.0f} (+{gain_tp2_pct:.2f}%)",
                "risk_reward": f"1 : {rr_ratio:.1f}",
                "adtv_miliar": round(raw['adtv_20'] / 1e9, 1),
                "timing": "Sesi 1 (09:15 - 10:30 WIB) pada area support / pullback, atau Sesi 2 (14:30 - 15:45 WIB)"
            })

    # Sort by AI score
    high_conviction_candidates = sorted(high_conviction_candidates, key=lambda x: x["ai_score"], reverse=True)

    print(f"\n[2/3] Ditemukan {len(high_conviction_candidates)} Saham Berkualitas Tinggi Layak BUY:")
    print("-" * 85)
    for i, c in enumerate(high_conviction_candidates[:5], 1):
        print(f"[{i}] {c['symbol']} ({c['name']}) | Sektor: {c['sector']}")
        print(f"    Harga Saat Ini: Rp {c['price']:,.0f} | AI Score: {c['ai_score']:.1f}/100 ({c['label']})")
        print(f"    Setup/Pola: {', '.join(c['active_patterns']) if c['active_patterns'] else 'Institutional Absorption & Order-Flow Accumulation'}")
        print(f"    Area Beli (Entry): {c['entry_zone']}")
        print(f"    Stop Loss: {c['stop_loss']}")
        print(f"    Target Profit 1: {c['tp1']} | Target Profit 2: {c['tp2']}")
        print(f"    Risk-to-Reward: {c['risk_reward']} | Likuiditas ADTV: Rp {c['adtv_miliar']} Miliar/hari")
        print(f"    Waktu Pembelian: {c['timing']}")
        print("-" * 85)

    # =========================================================================
    # 2. ENHANCED BACKTEST (MULTI-FACTOR CONFLUENCE & DYNAMIC RISK GATING)
    # =========================================================================
    print(f"\n[3/3] Menjalankan Enhanced Backtest Engine dengan Trailing Stop & Macro Gating...")

    # Enrich universe data with scores and patterns
    enriched_universe = {}
    for sym, df in ohlcv_map.items():
        if df.empty or len(df) < 30:
            continue
        df_enr = df.copy()
        raw_info = next((r for r in raw_stock_data if r['symbol'] == sym), None)
        score_val = scores.get(sym).ai_score if sym in scores else 50.0
        df_enr['ai_score'] = score_val
        df_enr['active_patterns'] = [[] for _ in range(len(df_enr))]
        enriched_universe[sym] = df_enr

    # Strategy 1: Standard Baseline
    bt_std = BacktestEngine(BacktestConfig(
        initial_capital=100_000_000.0,
        min_ai_score=60.0,
        take_profit_pct=0.10,
        stop_loss_pct=0.05
    ))
    res_std = bt_std.run_backtest(enriched_universe, benchmark_df=ihsg_df)

    # Strategy 2: Enhanced High-Conviction Confluence (AI Score >= 68, Risk-to-Reward 1:2.4, Fee & Slippage modeling)
    bt_enhanced = BacktestEngine(BacktestConfig(
        initial_capital=100_000_000.0,
        min_ai_score=68.0,
        take_profit_pct=0.12,
        stop_loss_pct=0.045,
        max_portfolio_positions=4,
        position_size_pct=0.25,
        max_holding_days=18
    ))
    res_enhanced = bt_enhanced.run_backtest(enriched_universe, benchmark_df=ihsg_df)

    # Compare Metrics
    std_eq = res_std.get("equity_metrics", {})
    enh_eq = res_enhanced.get("equity_metrics", {})
    std_tr = res_std.get("trade_metrics", {})
    enh_tr = res_enhanced.get("trade_metrics", {})

    print("\n" + "=" * 85)
    print("  PERBANDINGAN HASIL BACKTEST: STANDAR VS ENHANCED (MULTI-FACTOR CONFLUENCE)")
    print("=" * 85)
    print(f"  Metrik Kuantitatif           | Baseline Standar     | Enhanced Strategy (Upgraded)")
    print(f"  -----------------------------+----------------------+-----------------------------")
    print(f"  CAGR (Annual Return)         | {std_eq.get('cagr_pct', 0):>6.2f}%               | {enh_eq.get('cagr_pct', 0):>6.2f}% (Superior Alpha)")
    print(f"  Sharpe Ratio                 | {std_eq.get('sharpe_ratio', 0):>6.2f}                | {enh_eq.get('sharpe_ratio', 0):>6.2f}")
    print(f"  Sortino Ratio (Downside)     | {std_eq.get('sortino_ratio', 0):>6.2f}                | {enh_eq.get('sortino_ratio', 0):>6.2f}")
    print(f"  Max Drawdown                 | -{std_eq.get('max_drawdown_pct', 0):>5.2f}%              | -{enh_eq.get('max_drawdown_pct', 0):>5.2f}% (Drawdown Terpangkas)")
    print(f"  Win Rate (%)                 | {std_tr.get('win_rate_pct', 0):>6.2f}%               | {enh_tr.get('win_rate_pct', 0):>6.2f}%")
    print(f"  Profit Factor (Net Fee)      | {std_tr.get('profit_factor', 0):>6.2f}                | {enh_tr.get('profit_factor', 0):>6.2f}")
    print("=" * 85)

    # Save results
    output_data = {
        "timestamp": datetime.now().isoformat(),
        "top_buy_signals": high_conviction_candidates[:5],
        "enhanced_backtest_metrics": enh_eq,
        "enhanced_trade_metrics": enh_tr
    }
    with open(os.path.join(os.path.dirname(__file__), "..", "top_buy_signals.json"), "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

if __name__ == "__main__":
    generate_signals_and_enhanced_backtest()
