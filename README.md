# IHSG Slayer (Bandar Metrics × IHSG Screener Hybrid)

Platform analisis saham pasar modal Indonesia (IDX) hybrid berkinerja tinggi yang memadukan analisis mikrostruktur/order-flow bandar dengan scoring multi-faktor fundamental berbasis AI, deteksi 5 pola Smart Pick, screener fleksibel, dan backtesting kuantitatif institusional.

---

## Fitur Utama

- **5-Pillar Multi-Factor AI Intelligence Score**:
  - Profitabilitas (30%), Valuasi Relatif Sektoral (25%), Kesehatan Finansial (20%), Likuiditas (15%), Momentum (10%).
  - Hard Danger Zone Filter (perlindungan dari saham berisiko tinggi).
- **5 Smart Pick Institutional Patterns**:
  - `Area Demand`, `Throwback/Retest`, `Liquidity Sweep`, `Bull Divergence`, `Early Breakout`.
- **Order-Flow & Liquidity Pressure Model (LPM)**:
  - Cumulative Volume Delta (CVD) Leading Pressure Curve, Volume Intensity Spikes, Volume Rotation/Absorption Index.
- **Broker & Net Foreign Stalker**:
  - Top 3 & Top 5 Broker Concentration Ratios, Net Foreign Buying Flow, ORCA Filter.
- **Screener & Natural Language Search**:
  - Filter multi-kriteria dan parsing pencarian bahasa alami (contoh: *"saham banking undervalue demand area asing akumulasi"*).
- **Institutional-Grade Backtesting & Validation**:
  - Point-in-time pricing, realistic IDX fee/tax & slippage model, Rank IC (Information Coefficient), Decile Spread vs IHSG benchmark, Walk-Forward, Monte Carlo test.
- **Trading Journal & Notifications**:
  - FIFO Cost Accounting, Unitized NAV calculation, Telegram Alert integration.
- **FastAPI REST Service**:
  - Modern, asynchronous endpoints for all metrics, screeners, and backtest evaluations.

---

## Quickstart

### 1. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Run Tests
```bash
python -m pytest tests/ -v
```

### 3. Run FastAPI Application
```bash
python -m uvicorn src.api.main:app --reload --port 8000
```
Swagger UI documentation tersedia di `http://localhost:8000/docs`.

---

## Legal & Research Notice
Lihat [DISCLAIMER.md](docs/DISCLAIMER.md) untuk informasi hukum dan batasan penggunaan riset/edukasi.
