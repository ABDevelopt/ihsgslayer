# Standard Backtest & Quantitative Evaluation Report

## 1. Metadata Strategi
- **Nama Strategi**: `[Strategy Name / e.g. Multi-Factor AI Score Top Decile + Demand Area]`
- **Periode Pengujian**: `YYYY-MM-DD` s.d. `YYYY-MM-DD`
- **Universe Saham**: `[IDX80 / LQ45 / All Liquid IDX (ADTV >= 1B)]`
- **Benchmark**: IHSG (`^JKSE`)
- **Initial Capital**: Rp 100.000.000,-
- **Fee Model**: Buy: 0.15%, Sell: 0.25% (termasuk pajak PPh 0.1%), Slippage: 0.10%

---

## 2. Executive Performance Summary

| Metric | Strategi | Benchmark (IHSG) | Delta / Alpha |
| :--- | :---: | :---: | :---: |
| **Total Return (CAGR)** | `%` | `%` | `%` |
| **Sharpe Ratio (Rf=6.0%)** | `x.xx` | `x.xx` | `+x.xx` |
| **Sortino Ratio** | `x.xx` | `x.xx` | `+x.xx` |
| **Max Drawdown (MDD)** | `-%` | `-%` | `+%` |
| **Calmar Ratio** | `x.xx` | `x.xx` | `+x.xx` |
| **Win Rate (% Trades)** | `%` | N/A | N/A |
| **Profit Factor** | `x.xx` | N/A | N/A |
| **Average Trade Duration**| `x Hari`| N/A | N/A |
| **Information Coefficient (Rank IC)** | `+0.xx` | N/A | N/A |
| **Top Decile vs Bottom Decile Spread**| `+x.xx%` | N/A | N/A |

---

## 3. Decile Spread & Information Coefficient Analysis
- **Decile 1 (Top Score 90-100)**: annualized return `%`
- **Decile 10 (Bottom Score 0-10)**: annualized return `%`
- **Monotonicity Score**: `High / Moderate / Low`

---

## 4. Regime Stress Testing
- **Bull Market Regime**: CAGR `+xx%`, Sharpe `x.x`
- **Bear Market / Crisis Regime**: MDD `-xx%`, Sharpe `x.x`
- **Sideways / Rangebound Regime**: Win Rate `xx%`, Sharpe `x.x`
