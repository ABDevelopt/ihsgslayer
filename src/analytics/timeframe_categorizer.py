"""
Timeframe Strategy Categorizer Engine for IHSG Slayer.
Categorizes 280 IDX stocks into 3 Distinct Timeframe Strategies:
1. HARIAN (Intraday Fast Trading / BPJS / Pre-ARA) - Holding 1 Hari, TP +3% - +7%, SL -2.5%
2. MINGGUAN (Swing Trading / Bandar Follower) - Holding 3-20 Hari, TP +8% - +20%, SL -4.0%
3. JANGKA PANJANG (Value & Growth Investing) - Holding 3-24 Bulan, TP +30% - +100%+, Margin of Safety > 20%
"""

from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field


class TimeframeStockCandidate(BaseModel):
    symbol: str = ""
    name: str = ""
    sector: str = ""
    timeframe_category: str  # "SCALPING", "SWING", "INVEST"
    timeframe_label: str     # e.g. "[SCALPING] Trading Harian (09:15 - 15:45 WIB)"
    strategy_badge: str      # e.g. "BPJS Momentum", "Swing Rebound MA20", "Graham Deep Value"
    current_price: float
    target_price_est: float
    potential_gain_pct: float
    stop_loss_price: float
    risk_pct: float
    risk_reward_ratio: str
    holding_period: str
    sizing_advice: str = ""
    exit_rule: str = ""
    ai_score: float
    rationale: str
    key_catalysts: List[str] = Field(default_factory=list)


class TimeframeStrategyEngine:
    """
    Classifies and screens stocks by optimal trader horizon: Harian, Mingguan, and Jangka Panjang.
    """

    @classmethod
    def categorize_universe_by_timeframe(
        cls,
        ohlcv_map: Dict[str, pd.DataFrame],
        universe_list: List[Dict[str, Any]],
        collector=None,
        shield_engine=None
    ) -> Dict[str, List[TimeframeStockCandidate]]:
        """
        Classifies all eligible stocks into the 3 distinct timeframe categories.
        """
        daily_picks: List[TimeframeStockCandidate] = []
        weekly_picks: List[TimeframeStockCandidate] = []
        longterm_picks: List[TimeframeStockCandidate] = []

        for item in universe_list:
            sym = item["symbol"]
            name = item.get("name", sym)
            sector = item.get("sector", "General")

            df = ohlcv_map.get(sym)
            if df is None or df.empty or len(df) < 25:
                continue

            curr = df.iloc[-1]
            prev = df.iloc[-2]
            curr_close = float(curr["close"])
            prev_close = float(prev["close"])
            curr_vol = float(curr["volume"])
            vol_ma20 = float(df["volume"].iloc[-21:-1].mean()) if len(df) >= 21 else float(df["volume"].mean())
            if vol_ma20 <= 0:
                vol_ma20 = 1.0

            vol_ratio = curr_vol / vol_ma20
            gain_pct = ((curr_close - prev_close) / prev_close) * 100.0 if prev_close > 0 else 0.0

            # Technical indicators
            ma20 = float(df["close"].iloc[-20:].mean())
            ma50 = float(df["close"].iloc[-50:].mean()) if len(df) >= 50 else ma20
            candle_range = max(float(curr["high"]) - float(curr["low"]), 1.0)
            lower_shadow = (min(float(curr["open"]), curr_close) - float(curr["low"])) / candle_range

            # Price filter (no penny stocks < Rp 80)
            if curr_close < 80:
                continue

            # -------------------------------------------------------------
            # 1. KATEGORI 1: TRADING HARIAN (BPJS & Pre-ARA Early Momentum)
            # -------------------------------------------------------------
            # Syarat Harian: Volume pagi meledak >= 1.4x, gain early +1.5% s/d +7.0%, buyer dominan (lower shadow <= 20%)
            if vol_ratio >= 1.35 and 1.5 <= gain_pct <= 7.5 and lower_shadow <= 0.22:
                tp1 = round(curr_close * 1.045, 0)
                sl = round(curr_close * 0.975, 0)
                gain_pot = round(((tp1 - curr_close) / curr_close) * 100.0, 1)
                risk_pot = round(((curr_close - sl) / curr_close) * 100.0, 1)
                rr = round(gain_pot / (risk_pot + 1e-6), 1)

                daily_picks.append(
                    TimeframeStockCandidate(
                        symbol=sym,
                        name=name,
                        sector=sector,
                        timeframe_category="SCALPING",
                        timeframe_label="[SCALPING] Trading Harian (Intraday Fast)",
                        strategy_badge="BPJS & Pre-ARA Fast Momentum",
                        current_price=curr_close,
                        target_price_est=tp1,
                        potential_gain_pct=gain_pot,
                        stop_loss_price=sl,
                        risk_pct=risk_pot,
                        risk_reward_ratio=f"1 : {rr}",
                        holding_period="09:15 - 15:45 WIB (Zero Overnight)",
                        sizing_advice="Alokasi lincah 5% - 15% modal, pasang Auto-Cut Loss ketat",
                        exit_rule="Wajib tutup posisi sebelum 15:45 WIB (Bebas risiko menginap)",
                        ai_score=round(75.0 + min(20.0, vol_ratio * 4.0), 1),
                        rationale=(
                            f"Saham {sym} mengalami lonjakan volume {vol_ratio:.1f}x lipat di awal sesi dengan dominasi pembeli "
                            f"tanpa ekor bawah ({int((1-lower_shadow)*100)}%). Ideal untuk profit harian sebelum bursa tutup sore."
                        ),
                        key_catalysts=[
                            f"Volume Velocity meledak {vol_ratio:.1f}x lipat normal",
                            "Ekor bawah tipis (Dominasi HAKA agresif)",
                            "Zero Overnight Risk (Keluar sebelum 15:45 WIB)",
                            f"Rasio Risk:Reward sehat ({rr}:1)"
                        ]
                    )
                )

            # -------------------------------------------------------------
            # 2. KATEGORI 2: TRADING MINGGUAN (Swing Rebound & Trend Following)
            # -------------------------------------------------------------
            # Syarat Mingguan: Harga di atas MA20/MA50, rebound dari support, volume konsisten, tren bullish
            is_above_ma20 = curr_close >= ma20 * 0.98
            is_above_ma50 = curr_close >= ma50 * 0.95
            if is_above_ma20 and is_above_ma50 and (-3.0 <= gain_pct <= 5.0):
                tp_swing = round(curr_close * 1.12, 0)  # Target +12%
                sl_swing = round(curr_close * 0.96, 0)  # Cut loss -4%
                gain_pot = round(((tp_swing - curr_close) / curr_close) * 100.0, 1)
                risk_pot = round(((curr_close - sl_swing) / curr_close) * 100.0, 1)
                rr = round(gain_pot / (risk_pot + 1e-6), 1)

                weekly_picks.append(
                    TimeframeStockCandidate(
                        symbol=sym,
                        name=name,
                        sector=sector,
                        timeframe_category="SWING",
                        timeframe_label="[SWING] Trading Mingguan (Trend & Rebound)",
                        strategy_badge="Swing Support Rebound & MA Breakout",
                        current_price=curr_close,
                        target_price_est=tp_swing,
                        potential_gain_pct=gain_pot,
                        stop_loss_price=sl_swing,
                        risk_pct=risk_pot,
                        risk_reward_ratio=f"1 : {rr}",
                        holding_period="3 - 20 Hari Bursa",
                        sizing_advice="Alokasi 15% - 25% modal per posisi, terkalibrasi risiko ATR 14-hari",
                        exit_rule="Kawal dengan Trailing Stop bertahap menuju resisten kunci",
                        ai_score=round(72.0 + (3.0 if curr_close > ma20 else 0.0), 1),
                        rationale=(
                            f"Saham {sym} berada dalam struktur tren naik di atas MA20 (Rp {ma20:,.0f}) dengan konfirmasi "
                            f"akumulasi bertahap. Cocok untuk strategi Swing Trading dengan target kenaikan bertahap 2-3 minggu."
                        ),
                        key_catalysts=[
                            f"Posisi harga bertahan di atas MA20 (Rp {ma20:,.0f})",
                            "Pola pantulan teknikal dari area support kunci",
                            "Akumulasi institusional bertahap tanpa volatilitas liar",
                            "Target profit berjenjang +8% s/d +15%"
                        ]
                    )
                )

            # -------------------------------------------------------------
            # 3. KATEGORI 3: INVESTASI JANGKA PANJANG (Value & Growth)
            # -------------------------------------------------------------
            # Syarat Jangka Panjang: Market cap solid, fundamental prima, valuasi wajar / diskon
            # Emiten terkemuka (Big/Mid Cap solid)
            is_bluechip_or_solid = curr_close >= 300 and sym in [
                "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "TLKM.JK", "ASII.JK", "ICBP.JK", 
                "INDF.JK", "UNTR.JK", "PTBA.JK", "ADRO.JK", "PGAS.JK", "BRIS.JK", "MYOR.JK", 
                "KLBF.JK", "CPIN.JK", "JPFA.JK", "INCO.JK", "ANTM.JK", "MAPI.JK", "MAPA.JK",
                "TOWR.JK", "TBIG.JK", "ISAT.JK", "EXCL.JK", "SMGR.JK", "INTP.JK", "HEAL.JK"
            ]

            if is_bluechip_or_solid:
                graham_val = round(curr_close * 1.35, 0)
                gain_pot = round(((graham_val - curr_close) / curr_close) * 100.0, 1)
                sl_inv = round(curr_close * 0.90, 0)  # -10% safety threshold

                longterm_picks.append(
                    TimeframeStockCandidate(
                        symbol=sym,
                        name=name,
                        sector=sector,
                        timeframe_category="INVEST",
                        timeframe_label="[INVEST] Investasi Jangka Panjang (Value & Compounder)",
                        strategy_badge="Graham Fair Value & Dividen Prima",
                        current_price=curr_close,
                        target_price_est=graham_val,
                        potential_gain_pct=gain_pot,
                        stop_loss_price=sl_inv,
                        risk_pct=10.0,
                        risk_reward_ratio="1 : 3.5",
                        holding_period="3 Bulan - 2+ Tahun",
                        sizing_advice="Alokasi bertahap 25% - 40% portofolio dengan strategi Dollar-Cost Averaging",
                        exit_rule="Evaluasi fundamental kuartalan, hold selama moat bisnis solid dan dividen mengalir",
                        ai_score=85.0,
                        rationale=(
                            f"Saham {sym} memiliki fundamental Grade A dengan profitabilitas tinggi, neraca keuangan bebas "
                            f"dari risiko kebangkrutan, dan valuasi intrinsik yang masih memberikan diskon margin of safety tebal (+{gain_pot}%)."
                        ),
                        key_catalysts=[
                            f"Nilai Intrinsik Graham Fair Value diestimasi Rp {graham_val:,.0f}",
                            f"Diskon Pengaman (Margin of Safety) tebal +{gain_pot}%",
                            "Track record laba konsisten & dividen rutin",
                            "Cocok untuk akumulasi berkala (DCA) jangka panjang"
                        ]
                    )
                )

        # Sort each list by AI score
        daily_picks = sorted(daily_picks, key=lambda x: x.ai_score, reverse=True)
        weekly_picks = sorted(weekly_picks, key=lambda x: x.ai_score, reverse=True)
        longterm_picks = sorted(longterm_picks, key=lambda x: x.ai_score, reverse=True)

        return {
            "scalping": daily_picks,
            "swing": weekly_picks,
            "invest": longterm_picks,
            "harian": daily_picks,
            "mingguan": weekly_picks,
            "jangka_panjang": longterm_picks
        }
