import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import sys
sys.path.insert(0, os.path.abspath("."))

import pandas as pd
import numpy as np
import yfinance as yf
from src.data.universe import FULL_IDX_UNIVERSE

def run_deep_historical_evaluation():
    # Top 40 Most Liquid IDX stocks with high retail & institutional participation
    test_universe = [
        "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "TLKM.JK", "ASII.JK", "UNVR.JK", "ICBP.JK",
        "ADRO.JK", "PTBA.JK", "SMGR.JK", "BRIS.JK", "KLBF.JK", "CPIN.JK", "INDF.JK", "MAPA.JK",
        "GJTL.JK", "TOWR.JK", "MYOR.JK", "ACES.JK", "MEDC.JK", "PGAS.JK", "INKP.JK", "TKIM.JK",
        "MAPI.JK", "AKRA.JK", "AMRT.JK", "JPFA.JK", "MIKA.JK", "HEAL.JK", "INCO.JK", "ANTM.JK",
        "BRPT.JK", "TPIA.JK", "GOTO.JK", "BUMI.JK", "ENRG.JK", "PGEO.JK", "MBMA.JK", "EMTK.JK"
    ]

    print(f"Menganalisis data historis 1 Tahun untuk {len(test_universe)} emiten terlikuid BEI...")

    bpjs_trades = []
    bsjp_trades = []

    for sym in test_universe:
        try:
            ticker = yf.Ticker(sym)
            df = ticker.history(period="1y", auto_adjust=False)
            if df.empty or len(df) < 30:
                continue

            df = df.reset_index()
            df.columns = [c.lower().replace(" ", "_") for c in df.columns]
            df["vol_ma20"] = df["volume"].rolling(window=20, min_periods=5).mean()

            for i in range(20, len(df) - 1):
                curr = df.iloc[i]
                prev = df.iloc[i - 1]
                nxt = df.iloc[i + 1]

                d_str = curr["date"].strftime("%Y-%m-%d") if hasattr(curr["date"], "strftime") else str(curr["date"])[:10]
                o, h, l, c, v = float(curr["open"]), float(curr["high"]), float(curr["low"]), float(curr["close"]), float(curr["volume"])
                v_ma = float(curr["vol_ma20"])
                prev_c = float(prev["close"])
                prev_h = float(prev["high"])

                candle_range = max(h - l, 1.0)
                lower_shadow_pct = (min(o, c) - l) / candle_range
                upper_shadow_pct = (h - max(o, c)) / candle_range
                vol_mult = v / (v_ma + 1e-6)

                # ==========================================
                # EVALUASI STRATEGI 1: BPJS (Beli Pagi Jual Sore)
                # ==========================================
                # Rule: Gain pagi, Vol >= 1.35x, Lower Shadow tipis <= 25%
                if (
                    c > prev_c
                    and o >= prev_c * 0.995
                    and vol_mult >= 1.35
                    and lower_shadow_pct <= 0.25
                    and c >= 100.0
                ):
                    entry = o
                    tp1 = entry * 1.035
                    sl = entry * 0.975

                    if l <= sl:
                        pnl = ((sl - entry) / entry) * 100.0
                        win = False
                        exit_type = "CUT_LOSS"
                    elif h >= tp1:
                        pnl = ((tp1 - entry) / entry) * 100.0
                        win = True
                        exit_type = "TP1_HIT"
                    else:
                        pnl = ((c - entry) / entry) * 100.0
                        win = pnl > 0
                        exit_type = "SORE_CLOSE"

                    bpjs_trades.append({
                        "symbol": sym,
                        "date": d_str,
                        "entry": entry,
                        "exit": tp1 if exit_type == "TP1_HIT" else (sl if exit_type == "CUT_LOSS" else c),
                        "pnl_pct": pnl,
                        "is_win": win,
                        "exit_type": exit_type,
                        "mfe_high_pct": ((h - entry) / entry) * 100.0,
                        "mae_low_pct": ((l - entry) / entry) * 100.0
                    })

                # ==========================================
                # EVALUASI STRATEGI 2: BSJP (Beli Sore Jual Pagi)
                # ==========================================
                # Rule: Bullish close (+1% to +9%), Upper shadow tipis <= 20%, Volume >= 1.4x
                if (
                    c >= prev_c * 1.01
                    and c <= prev_c * 1.09
                    and upper_shadow_pct <= 0.20
                    and vol_mult >= 1.40
                ):
                    entry = c
                    tp1 = entry * 1.035
                    sl = entry * 0.975

                    nxt_o, nxt_h, nxt_l, nxt_c = float(nxt["open"]), float(nxt["high"]), float(nxt["low"]), float(nxt["close"])

                    # Priority 1: Gap-up open at 09:00 WIB >= +1.5%
                    if nxt_o >= entry * 1.015:
                        pnl = ((nxt_o - entry) / entry) * 100.0
                        win = True
                        exit_type = "GAP_UP_OPEN"
                    # Priority 2: Morning Surge 09:15 WIB hits TP1 (+3.5%)
                    elif nxt_h >= tp1:
                        pnl = ((tp1 - entry) / entry) * 100.0
                        win = True
                        exit_type = "MORNING_SURGE_TP1"
                    # Priority 3: Low hits stop loss (-2.5%)
                    elif nxt_l <= sl:
                        pnl = ((sl - entry) / entry) * 100.0
                        win = False
                        exit_type = "CUT_LOSS"
                    else:
                        pnl = ((nxt_c - entry) / entry) * 100.0
                        win = pnl > 0
                        exit_type = "CLOSE_H1"

                    bsjp_trades.append({
                        "symbol": sym,
                        "date": d_str,
                        "entry": entry,
                        "exit": nxt_o if exit_type == "GAP_UP_OPEN" else (tp1 if exit_type == "MORNING_SURGE_TP1" else (sl if exit_type == "CUT_LOSS" else nxt_c)),
                        "pnl_pct": pnl,
                        "is_win": win,
                        "exit_type": exit_type,
                        "gap_open_pct": ((nxt_o - entry) / entry) * 100.0,
                        "max_surge_pct": ((nxt_h - entry) / entry) * 100.0
                    })

        except Exception as e:
            print(f"Error {sym}: {e}")
            continue

    df_bpjs = pd.DataFrame(bpjs_trades)
    df_bsjp = pd.DataFrame(bsjp_trades)

    print("\n=======================================================")
    print("HASIL ANALISIS HISTORIS 1 TAHUN (DATA RIIL BEI)")
    print("=======================================================")

    # BPJS Summary
    n_bpjs = len(df_bpjs)
    w_bpjs = len(df_bpjs[df_bpjs["is_win"]])
    wr_bpjs = (w_bpjs / n_bpjs * 100.0) if n_bpjs > 0 else 0
    avg_win_bpjs = df_bpjs[df_bpjs["is_win"]]["pnl_pct"].mean() if w_bpjs > 0 else 0
    avg_loss_bpjs = df_bpjs[~df_bpjs["is_win"]]["pnl_pct"].mean() if (n_bpjs - w_bpjs) > 0 else 0
    tot_gain_bpjs = df_bpjs[df_bpjs["is_win"]]["pnl_pct"].sum()
    tot_loss_bpjs = abs(df_bpjs[~df_bpjs["is_win"]]["pnl_pct"].sum())
    pf_bpjs = tot_gain_bpjs / (tot_loss_bpjs + 1e-6)

    print(f"\n1. BPJS (Beli Pagi Jual Sore - Intraday Momentum):")
    print(f"   - Total Sinyal Diuji: {n_bpjs} trade")
    print(f"   - Sinyal Menang (WIN): {w_bpjs} trade")
    print(f"   - Sinyal Kalah (LOSS): {n_bpjs - w_bpjs} trade")
    print(f"   - Win Rate: {wr_bpjs:.1f}%")
    print(f"   - Rata-rata Gain saat Win: +{avg_win_bpjs:.2f}%")
    print(f"   - Rata-rata Loss saat Loss: {avg_loss_bpjs:.2f}%")
    print(f"   - Profit Factor: {pf_bpjs:.2f}x")
    print(f"   - Rata-rata High Harian (MFE): +{df_bpjs['mfe_high_pct'].mean():.2f}%")

    # BSJP Summary
    n_bsjp = len(df_bsjp)
    w_bsjp = len(df_bsjp[df_bsjp["is_win"]])
    wr_bsjp = (w_bsjp / n_bsjp * 100.0) if n_bsjp > 0 else 0
    avg_win_bsjp = df_bsjp[df_bsjp["is_win"]]["pnl_pct"].mean() if w_bsjp > 0 else 0
    avg_loss_bsjp = df_bsjp[~df_bsjp["is_win"]]["pnl_pct"].mean() if (n_bsjp - w_bsjp) > 0 else 0
    tot_gain_bsjp = df_bsjp[df_bsjp["is_win"]]["pnl_pct"].sum()
    tot_loss_bsjp = abs(df_bsjp[~df_bsjp["is_win"]]["pnl_pct"].sum())
    pf_bsjp = tot_gain_bsjp / (tot_loss_bsjp + 1e-6)

    print(f"\n2. BSJP (Beli Sore Jual Pagi - Overnight Swing):")
    print(f"   - Total Sinyal Diuji: {n_bsjp} trade")
    print(f"   - Sinyal Menang (WIN): {w_bsjp} trade")
    print(f"   - Sinyal Kalah (LOSS): {n_bsjp - w_bsjp} trade")
    print(f"   - Win Rate: {wr_bsjp:.1f}%")
    print(f"   - Rata-rata Gain saat Win: +{avg_win_bsjp:.2f}%")
    print(f"   - Rata-rata Loss saat Loss: {avg_loss_bsjp:.2f}%")
    print(f"   - Profit Factor: {pf_bsjp:.2f}x")
    print(f"   - Rata-rata Gap Pembukaan Pagi: {df_bsjp['gap_open_pct'].mean():.2f}%")
    print(f"   - Rata-rata Lonjakan Pagi (Surge High): +{df_bsjp['max_surge_pct'].mean():.2f}%")

    # Exit Type Breakdown
    print("\n3. Distribusi Tipe Eksekusi BPJS:")
    for et, count in df_bpjs["exit_type"].value_counts().items():
        pct = (count / n_bpjs) * 100
        print(f"   - {et}: {count} ({pct:.1f}%)")

    print("\n4. Distribusi Tipe Eksekusi BSJP:")
    for et, count in df_bsjp["exit_type"].value_counts().items():
        pct = (count / n_bsjp) * 100
        print(f"   - {et}: {count} ({pct:.1f}%)")

if __name__ == "__main__":
    run_deep_historical_evaluation()
