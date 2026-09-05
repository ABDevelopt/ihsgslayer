# Risk Management Matrix & Strategy Kill Criteria

Dokumen ini mendefinisikan parameter mitigasi risiko kuantitatif dan aturan penghentian strategi otomatis (*Kill Criteria*) untuk melindungi modal.

---

## 1. Quantitative Risk Parameters

| Parameter | Batas Toleransi | Tindakan Mitigasi |
| :--- | :--- | :--- |
| **Max Portfolio Drawdown** | $\le 15.0\%$ | Pangkas eksposur portofolio sebesar 50% |
| **Single Trade Risk ($R$)**| $1.0\% - 1.5\%$ modal | Hitung *Position Sizing* berbasis ATR / Stop Loss |
| **Max Sector Exposure** | $\le 30.0\%$ portofolio | Batasi alokasi maksimal per sektor industri |
| **Minimum Daily Liquidity**| ADTV 20-hari $\ge$ Rp 1 Miliar | Hindari saham tidak likuid (*illiquid trap*) |
| **Max Slippage Allowance** | 0.5% per transaksi | Gunakan limit order pada harga bid/ask wajar |

---

## 2. Hard Kill Switches (Strategy Shutdown)

Strategi sinyal/model wajib dihentikan otomatis (*killed/paused for review*) jika terjadi salah satu dari kondisi berikut:

1. **Win Rate Breakdown**:
   - Win Rate Live / Forward Testing turun di bawah **40%** setelah minimum 40 *closed trades*.
2. **Profit Factor Degeneracy**:
   - Profit Factor rolling 3 bulan turun di bawah **1.10** ($\sum \text{Gains} / \sum \text{Losses} < 1.10$).
3. **Drawdown Breach**:
   - Max Drawdown Live melebihi **$1.5\times$** Max Drawdown historis pada backtest.
4. **Information Coefficient (Rank IC) Collapse**:
   - Rolling 20-day Rank IC AI Score terhadap forward return 20-hari berada di bawah **0.00** selama 4 minggu berturut-turut (alpha decay/hilangnya edge prediktif).
5. **Regime Shift / Market Crisis**:
   - Volatilitas IHSG harian melonjak $> 3\times$ standar deviasi historis atau IHSG breakdown di bawah MA200 sebesar $> 7\%$.

---

## 3. Position Sizing Formula (ATR Risk-Based)

$$\text{Shares} = \left\lfloor \frac{\text{Capital} \times \text{RiskPct}}{\text{EntryPrice} - \text{StopLossPrice}} \right\rfloor$$
Disesuaikan dengan aturan kelipatan lot IDX (1 lot = 100 lembar saham):
$$\text{Lots} = \left\lfloor \frac{\text{Shares}}{100} \right\rfloor$$
Maksimal ukuran posisi dibatasi $\le 20\%$ dari total NAV portofolio.
