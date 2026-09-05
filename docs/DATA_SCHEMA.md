# Database Schema & Data Dictionary

Database dirancang fleksibel untuk berjalan di SQLite (Development/Test) atau TimescaleDB/PostgreSQL (Production).

---

## 1. Relational Entities & Data Types

### 1.1 `instruments` (Master Data Saham IDX)
| Column | Type | Description |
| :--- | :--- | :--- |
| `symbol` | `VARCHAR(16)` (PK) | Kode saham (contoh: `BBCA.JK`, `BBRI.JK`) |
| `name` | `VARCHAR(255)` | Nama lengkap perusahaan |
| `sector` | `VARCHAR(64)` | Sektor IDX (e.g. `Financials`, `Energy`, `Consumer Non-Cyclicals`) |
| `sub_sector` | `VARCHAR(64)` | Sub-sektor industri |
| `listing_date` | `DATE` | Tanggal IPO / pencatatan perdana di BEI |
| `shares_outstanding`| `BIGINT` | Jumlah lembar saham beredar |
| `is_active` | `BOOLEAN` | Status perdagangan aktif/suspensi |

### 1.2 `ohlcv_daily` (Time-Series Data Harga Harian)
| Column | Type | Description |
| :--- | :--- | :--- |
| `symbol` | `VARCHAR(16)` (PK/FK) | Kode saham |
| `date` | `DATE` (PK) | Tanggal bursa (YYYY-MM-DD) |
| `open` | `DOUBLE PRECISION` | Harga pembukaan |
| `high` | `DOUBLE PRECISION` | Harga tertinggi |
| `low` | `DOUBLE PRECISION` | Harga terendah |
| `close` | `DOUBLE PRECISION` | Harga penutupan |
| `volume` | `BIGINT` | Volume perdagangan (lot / shares) |
| `value` | `DOUBLE PRECISION` | Total nilai transaksi (IDR) |
| `adj_close` | `DOUBLE PRECISION` | Harga penutupan disesuaikan dividen & stock split |

### 1.3 `fundamental_snapshots` (Point-in-Time Fundamentals)
| Column | Type | Description |
| :--- | :--- | :--- |
| `symbol` | `VARCHAR(16)` (PK/FK) | Kode saham |
| `period_end` | `DATE` (PK) | Periode laporan keuangan (e.g. 2023-12-31) |
| `filing_date` | `DATE` | Tanggal rilis laporan keuangan (Point-in-Time) |
| `market_cap` | `DOUBLE PRECISION` | Kapitalisasi pasar pada tanggal filing |
| `per` | `DOUBLE PRECISION` | Price to Earnings Ratio |
| `pbv` | `DOUBLE PRECISION` | Price to Book Value |
| `roe` | `DOUBLE PRECISION` | Return on Equity (%) |
| `roa` | `DOUBLE PRECISION` | Return on Assets (%) |
| `npm` | `DOUBLE PRECISION` | Net Profit Margin (%) |
| `der` | `DOUBLE PRECISION` | Debt to Equity Ratio |
| `revenue_growth`| `DOUBLE PRECISION` | YoY Revenue Growth (%) |
| `net_profit_growth` | `DOUBLE PRECISION` | YoY Net Profit Growth (%) |

### 1.4 `foreign_broker_flow` (Foreign & Broker Summary Daily)
| Column | Type | Description |
| :--- | :--- | :--- |
| `symbol` | `VARCHAR(16)` (PK/FK) | Kode saham |
| `date` | `DATE` (PK) | Tanggal transaksi |
| `foreign_buy_val` | `DOUBLE PRECISION` | Nilai beli investor asing (IDR) |
| `foreign_sell_val`| `DOUBLE PRECISION` | Nilai jual investor asing (IDR) |
| `foreign_net_val` | `DOUBLE PRECISION` | Net foreign buy (+) / sell (-) |
| `top3_buy_concentration` | `DOUBLE PRECISION` | Konsentrasi beli top 3 broker (0.0 - 1.0) |
| `top3_sell_concentration`| `DOUBLE PRECISION` | Konsentrasi jual top 3 broker (0.0 - 1.0) |
| `top_buyer_brokers` | `JSON/TEXT` | List broker teratas e.g. `["YP", "PD", "CC"]` |
| `top_seller_brokers`| `JSON/TEXT` | List broker net seller e.g. `["BK", "AK", "KZ"]` |

### 1.5 `ai_scores` & `pattern_signals`
| Column | Type | Description |
| :--- | :--- | :--- |
| `symbol` | `VARCHAR(16)` (PK/FK) | Kode saham |
| `date` | `DATE` (PK) | Tanggal evaluasi |
| `ai_score` | `DOUBLE PRECISION` | Composite AI Score (0 - 100) |
| `profitability_score`| `DOUBLE PRECISION` | Sub-skor profitabilitas |
| `valuation_score` | `DOUBLE PRECISION` | Sub-skor valuasi relatif |
| `health_score` | `DOUBLE PRECISION` | Sub-skor kesehatan finansial |
| `liquidity_score` | `DOUBLE PRECISION` | Sub-skor likuiditas |
| `momentum_score` | `DOUBLE PRECISION` | Sub-skor momentum |
| `is_danger_zone` | `BOOLEAN` | Flag resiko tinggi |
| `active_patterns`| `JSON/TEXT` | List pattern aktif e.g. `["AREA_DEMAND", "BULL_DIVERGENCE"]` |
| `liquidity_pressure` | `DOUBLE PRECISION` | Nilai LPM saat ini |
| `volume_intensity` | `DOUBLE PRECISION` | Nilai rasio intensitas volume |

---

## 2. Partition & Indexing Strategy
- **TimescaleDB**: Hypertable pada `ohlcv_daily(date, symbol)` dan `foreign_broker_flow(date, symbol)`.
- **Composite Indexes**:
  - `idx_ohlcv_symbol_date` ON `ohlcv_daily (symbol, date DESC)`
  - `idx_ai_score_date_score` ON `ai_scores (date DESC, ai_score DESC)`
