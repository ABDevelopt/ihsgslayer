# Quantitative Hypothesis Log & Mathematical Specifications

Dokumen ini memuat formulasi kuantitatif original, hipotesis matematis, dan logika operasional untuk platform **IHSG Slayer**.

---

## 1. Multi-Factor AI Intelligence Score (0–100)

### 1.1 Filosofi & 5 Pilar
Score disusun dari 5 pilar dengan total bobot 100:

| Pilar | Bobot | Metrik Input | Arah Preferensi |
| :--- | :---: | :--- | :--- |
| **Profitabilitas** | 30% | $ROE$ (15%), $NPM$ (10%), $ROA$ (5%) | Lebih tinggi = lebih baik |
| **Valuasi Relatif** | 25% | $PER$ vs Median Sektor (15%), $PBV$ vs Median Sektor (10%) | Lebih rendah vs sektor = lebih baik |
| **Kesehatan Finansial** | 20% | $DER$ (20%) | Lebih rendah = lebih baik |
| **Likuiditas Pasar** | 15% | $\text{ADTV}_{20}$ (20-day Average Daily Turnover) | Likuiditas memadai = skor tinggi |
| **Konfirmasi Momentum** | 10% | Return 1 Bulan (5%) + Return 3 Bulan (5%) | Positif & terkontrol = skor tinggi |

### 1.2 Normalisasi Sektoral (Percentile Rank)
Untuk setiap saham $i$ dalam sektor $S$:
1. Metrik searah positif (contoh $ROE$):
   $$\text{Rank}(x_i) = \frac{\text{count}(x_j \le x_i)}{N_S} \times 100$$
2. Metrik terbalik (contoh $PER$, $DER$ di mana nilai lebih rendah lebih disukai):
   $$\text{Rank}_{\text{inv}}(x_i) = \left(1 - \frac{\text{count}(x_j \le x_i)}{N_S}\right) \times 100$$
   *(Jika $PER \le 0$ atau $PBV \le 0$, diberikan skor default pinalti 10).*

### 1.3 Danger Zone Hard Cap
Jika suatu emiten memiliki kombinasi bahaya struktural:
- $DER > 3.0$ **DAN** $NPM < 0$ (Rugi bersih dengan utang tinggi), ATAU
- $ROE < -15\%$
Maka:
$$\text{AI Score} = \min(\text{Raw Score}, 35)$$
Status ditandai sebagai `DANGER_ZONE`.

### 1.4 Kategori Skor
- $\text{AI Score} \ge 75$: **High Quality Undervalue**
- $60 \le \text{AI Score} < 75$: **Moderate / Fair Value**
- $40 \le \text{AI Score} < 60$: **Neutral / Speculative**
- $\text{AI Score} < 40$: **Avoid / Overvalued / Distressed**

---

## 2. Lima (5) Smart Pick Patterns

### 2.1 Area Demand
- **Kondisi 1**: Harga berada pada jarak $\le 2.5\%$ di atas level support swing 20–50 hari ($P_{\text{low\_support}}$).
- **Kondisi 2**: Terjadi pola *buying tail / hammer* (Lower shadow $\ge 50\%$ total range candle).
- **Kondisi 3**: Volume pada candle rejection $\ge 1.2 \times \text{SMA}(V, 20)$ atau volume 3 candle sebelumnya mengalami *volume dry-up* ($V < 0.7 \times \text{SMA}(V, 20)$).

### 2.2 Throwback / Retest
- **Kondisi 1**: Terjadi breakout di atas level resistance swing dalam 3–10 bar terakhir ($P_{\text{breakout}}$).
- **Kondisi 2**: Harga mengalami koreksi minor (pullback) menguji kembali level $P_{\text{breakout}} \pm 1.5\%$.
- **Kondisi 3**: Volume saat pullback menurun ($V_{\text{pullback}} < \text{SMA}(V, 20)$).
- **Kondisi 4**: Candle konfirmasi bullish muncul di level retest.

### 2.3 Liquidity Sweep (Spring / Stop-Hunt Reversal)
- **Kondisi 1**: Harga membuat *Intraday Low* baru menembus support swing sebelumnya ($L_t < \text{Low}_{\text{swing\_20}}$).
- **Kondisi 2**: Harga ditutup kembali di atas level support tersebut ($C_t > \text{Low}_{\text{swing\_20}}$).
- **Kondisi 3**: Volume tinggi ($V_t \ge 1.5 \times \text{SMA}(V, 20)$) menandakan absorpsi likuiditas retail oleh *market maker*.

### 2.4 Bull Divergence
- **Kondisi 1**: Harga membentuk *Lower Low* ($P_{t} < P_{t-k}$).
- **Kondisi 2**: Indikator Momentum ($RSI_{14}$ atau Cumulative Volume Delta) membentuk *Higher Low* ($RSI_t > RSI_{t-k}$).
- **Kondisi 3**: Slope divergensi positif dan terjadi konfirmasi pembalikan arah harga.

### 2.5 Early Breakout (Volatility Squeeze Expansion)
- **Kondisi 1**: Bandwidth Bollinger Bands $\le \text{Percentile}_{20}(\text{Bandwidth}_{60})$ menandakan konsolidasi sempit (squeeze).
- **Kondisi 2**: Harga menembus Upper Bollinger Band ($C_t > \text{UpperBB}_t$).
- **Kondisi 3**: Lonjakan volume eksplosif ($V_t \ge 2.0 \times \text{SMA}(V, 20)$).

---

## 3. Order-Flow & Liquidity Pressure Model (LPM)

### 3.1 Bar Volume Delta Approximation
Karena data tick granular order book berbayar tidak selalu tersedia, kita menggunakan estimasi Bar Signed Delta:
$$\Delta V_t = V_t \cdot \left(\frac{2 \cdot (C_t - L_t)}{H_t - L_t + \epsilon} - 1\right)$$
- Jika $C_t = H_t$ (close di pucuk): $\Delta V_t = +V_t$ (100% buy pressure).
- Jika $C_t = L_t$ (close di dasar): $\Delta V_t = -V_t$ (100% sell pressure).

### 3.2 Cumulative Liquidity Pressure Curve (LPM)
Pressure diakumulasi dengan faktor peluruhan (decay $\lambda = 0.95$):
$$\text{LPM}_t = \lambda \cdot \text{LPM}_{t-1} + \Delta V_t$$
Divergensi terjadi ketika $\Delta \text{LPM} > 0$ saat $\Delta \text{Price} \le 0$ (**Hidden Accumulation**).

### 3.3 Volume Intensity Spikes
Mengukur anomali ledakan aktivitas:
$$\text{Intensity}_t = \left(\frac{V_t}{\text{SMA}(V_t, 20)}\right) \cdot \left(\frac{H_t - L_t}{\text{ATR}_{14}(t)}\right)$$
- $\text{Intensity} \ge 2.5$: Ledakan aktivitas tinggi / potensial markup atau distribusi.

### 3.4 Volume Rotation / Absorption Efficiency
$$\text{Absorption}_t = \frac{V_t / \text{SMA}(V_t, 20)}{(H_t - L_t) / \text{ATR}_{14}(t) + 0.01}$$
- Volume tinggi dengan rentang harga sempit ($\text{Absorption} \ge 2.0$) mengindikasikan akumulasi/absorpsi tersembunyi.

---

## 4. Broker Flow & Net Foreign Tracking

### 4.1 Top Concentration Ratio (CR3 & CR5)
$$\text{CR}_3 = \frac{\sum_{k=1}^3 \text{BuyValue}_k}{\text{TotalBuyValue}}, \quad \text{NetTop}_3 = \sum_{k=1}^3 \text{NetValue}_k$$
- $\text{CR}_3 > 60\%$ dan $\text{NetTop}_3 > 0$: Akumulasi terkonsentrasi oleh broker bandar / institusi.

### 4.2 Net Foreign Strength Index (NFSI)
$$\text{NFSI}_t = \frac{\sum_{i=0}^4 \text{NetForeignValue}_{t-i}}{\sum_{i=0}^4 \text{TotalValue}_{t-i}} \times 100$$
- $\text{NFSI} > +15\%$: Akumulasi Asing Signifikan.
- $\text{NFSI} < -15\%$: Distribusi Asing Signifikan.
