from datetime import date, datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Float, Integer, BigInteger, Boolean, Date, DateTime, Text, JSON, PrimaryKeyConstraint
)
from sqlalchemy.orm import declarative_base
from pydantic import BaseModel, Field

Base = declarative_base()

# ==========================================
# SQLAlchemy ORM Models
# ==========================================

class InstrumentModel(Base):
    __tablename__ = "instruments"

    symbol = Column(String(16), primary_key=True)  # e.g., BBCA.JK
    name = Column(String(255), nullable=False)
    sector = Column(String(64), nullable=False)
    sub_sector = Column(String(64), nullable=True)
    listing_date = Column(Date, nullable=True)
    shares_outstanding = Column(BigInteger, nullable=True)
    is_active = Column(Boolean, default=True)


class OHLCVDailyModel(Base):
    __tablename__ = "ohlcv_daily"

    symbol = Column(String(16), nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
    value = Column(Float, default=0.0)
    adj_close = Column(Float, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("symbol", "date", name="pk_ohlcv_daily"),
    )


class FundamentalSnapshotModel(Base):
    __tablename__ = "fundamental_snapshots"

    symbol = Column(String(16), nullable=False)
    period_end = Column(Date, nullable=False)
    filing_date = Column(Date, nullable=False)
    market_cap = Column(Float, default=0.0)
    per = Column(Float, nullable=True)
    pbv = Column(Float, nullable=True)
    roe = Column(Float, nullable=True)
    roa = Column(Float, nullable=True)
    npm = Column(Float, nullable=True)
    der = Column(Float, nullable=True)
    revenue_growth = Column(Float, nullable=True)
    net_profit_growth = Column(Float, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("symbol", "period_end", name="pk_fundamental_snapshots"),
    )


class ForeignBrokerFlowModel(Base):
    __tablename__ = "foreign_broker_flow"

    symbol = Column(String(16), nullable=False)
    date = Column(Date, nullable=False)
    foreign_buy_val = Column(Float, default=0.0)
    foreign_sell_val = Column(Float, default=0.0)
    foreign_net_val = Column(Float, default=0.0)
    top3_buy_concentration = Column(Float, default=0.0)
    top3_sell_concentration = Column(Float, default=0.0)
    top_buyer_brokers = Column(JSON, default=list)
    top_seller_brokers = Column(JSON, default=list)

    __table_args__ = (
        PrimaryKeyConstraint("symbol", "date", name="pk_foreign_broker_flow"),
    )


class AIScoreModel(Base):
    __tablename__ = "ai_scores"

    symbol = Column(String(16), nullable=False)
    date = Column(Date, nullable=False)
    ai_score = Column(Float, nullable=False)
    profitability_score = Column(Float, default=0.0)
    valuation_score = Column(Float, default=0.0)
    health_score = Column(Float, default=0.0)
    liquidity_score = Column(Float, default=0.0)
    momentum_score = Column(Float, default=0.0)
    is_danger_zone = Column(Boolean, default=False)
    active_patterns = Column(JSON, default=list)
    liquidity_pressure = Column(Float, default=0.0)
    volume_intensity = Column(Float, default=0.0)

    __table_args__ = (
        PrimaryKeyConstraint("symbol", "date", name="pk_ai_scores"),
    )


class SignalEvaluationModel(Base):
    __tablename__ = "signal_evaluation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    strategy_type = Column(String(32), nullable=False)  # BPJS, BSJP, BUY_SIGNAL
    symbol = Column(String(16), nullable=False)
    name = Column(String(255), nullable=True)
    sector = Column(String(64), nullable=True)
    signal_date = Column(Date, nullable=False)
    signal_time = Column(String(32), nullable=False)
    entry_price = Column(Float, nullable=False)
    target_tp1 = Column(Float, nullable=False)
    target_tp2 = Column(Float, nullable=False)
    stop_loss = Column(Float, nullable=False)
    target_exit_time = Column(String(64), nullable=False)
    actual_exit_price = Column(Float, nullable=True)
    actual_highest_price = Column(Float, nullable=True)
    actual_lowest_price = Column(Float, nullable=True)
    realized_pnl_pct = Column(Float, nullable=True)
    outcome_status = Column(String(16), default="PENDING")  # WIN, LOSS, PENDING, EXPIRED
    win_reason = Column(Text, nullable=True)
    eval_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    evaluated_at = Column(DateTime, nullable=True)


# ==========================================
# Pydantic Schemas for Validation & API
# ==========================================

class InstrumentSchema(BaseModel):
    symbol: str
    name: str
    sector: str
    sub_sector: Optional[str] = None
    listing_date: Optional[date] = None
    shares_outstanding: Optional[int] = None
    is_active: bool = True


class OHLCVSchema(BaseModel):
    symbol: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    value: float = 0.0
    adj_close: float


class FundamentalSchema(BaseModel):
    symbol: str
    period_end: date
    filing_date: date
    market_cap: float = 0.0
    per: Optional[float] = None
    pbv: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    npm: Optional[float] = None
    der: Optional[float] = None
    revenue_growth: Optional[float] = None
    net_profit_growth: Optional[float] = None


class AIScoreResult(BaseModel):
    symbol: str
    date: date
    ai_score: float
    label: str
    profitability_score: float
    valuation_score: float
    health_score: float
    liquidity_score: float
    momentum_score: float
    is_danger_zone: bool
    danger_zone_reasons: List[str] = Field(default_factory=list)
    components: Dict[str, Any] = Field(default_factory=dict)


class PatternSignalResult(BaseModel):
    symbol: str
    date: date
    pattern_name: str
    is_detected: bool
    strength: float
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
