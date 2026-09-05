export interface HazardStockItem {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  current_price: number;
  change_pct: number;
  safety_score: number;
  risk_score: number;
  risk_level: string;
  shield_verdict: string;
  risk_badge: string;
  risk_color: string;
  is_safe_to_buy: boolean;
  is_fca_hazard: boolean;
  fca_reasons: string[];
  is_suspension_hazard: boolean;
  suspension_reasons: string[];
  is_arb_hazard: boolean;
  arb_reasons: string[];
  warning_flags: string[];
  human_advice: string;
}

export interface DangerRadarResponse {
  total_scanned: number;
  total_hazardous_count: number;
  total_safe_count: number;
  fca_count: number;
  suspension_count: number;
  arb_count: number;
  fca_hazards: HazardStockItem[];
  suspension_hazards: HazardStockItem[];
  arb_hazards: HazardStockItem[];
  safe_stocks: HazardStockItem[];
}

export interface StockUniverseItem {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  confidence_level?: string;
  trading_category?: "SCALPING" | "SWING" | "INVEST" | string;
  confidence_score?: number;
}

export interface HeroStats {
  top_tier: {
    symbol: string;
    name: string;
    ai_score: number;
    description: string;
  };
  bandar_active: {
    symbol: string;
    name: string;
    absorption_ratio: number;
    status: string;
  };
  smart_pick: {
    pattern: string;
    symbols: string[];
    description: string;
  };
  danger_shield: {
    status: string;
    description: string;
    filtered_count: number;
  };
}

export interface BuySignalCandidate {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  current_price: number;
  ai_score: number;
  verdict_category: string;
  why_buy_summary: string;
  why_buy_points: string[];
  entry_zone: string;
  target_tp1: string;
  tp1_price?: number;
  predicted_gain_tp1_pct?: number;
  target_tp2: string;
  tp2_price?: number;
  predicted_gain_tp2_pct?: number;
  stop_loss: string;
  stop_loss_price?: number;
  predicted_stop_loss_pct?: number;
  selling_time_window?: string;
  selling_trigger_rule?: string;
  risk_reward_ratio: string;
  safety_shield_status: string;
  active_patterns: string[];
  is_orca_signal: boolean;
  graham_fair_value?: number;
  margin_of_safety_pct?: number;
  entry_price_mid?: number;
}

export interface PreARACandidate {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  current_price: number;
  morning_gain_pct: number;
  ara_probability: string;
  pre_ara_score: number;
  volume_velocity_multiplier: number;
  buyer_dominance_pct: number;
  distance_to_ara_pct: number;
  ara_ceiling_price: number;
  predicted_target_price?: number;
  predicted_gain_pct?: number;
  predicted_tp1_price?: number;
  predicted_tp1_gain_pct?: number;
  predicted_stop_loss_price?: number;
  predicted_stop_loss_pct?: number;
  selling_time_window?: string;
  selling_trigger_rule?: string;
  holding_duration_guide?: string;
  tp1_target_time?: string;
  ara_target_time?: string;
  max_exit_time?: string;
  exit_strategy_tip?: string;
  entry_zone: string;
  target_ara_sell: string;
  stop_loss: string;
  risk_reward_ratio: string;
  safety_status: string;
  pre_ara_rationale: string;
  pre_ara_signals: string[];
}

export interface BPJSCandidate {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  current_price: number;
  morning_gain_pct: number;
  bpjs_score: number;
  win_probability: string;
  volume_multiplier: number;
  open_to_low_rejection_pct: number;
  rsi_14: number;
  adtv_miliar: number;
  safety_shield_status: string;
  entry_zone: string;
  target_tp1_intraday: string;
  target_tp1_price: number;
  predicted_gain_tp1_pct?: number;
  target_tp2_intraday: string;
  target_tp2_price: number;
  predicted_gain_tp2_pct?: number;
  stop_loss_intraday: string;
  stop_loss_price: number;
  predicted_stop_loss_pct?: number;
  selling_time_window?: string;
  selling_trigger_rule?: string;
  execution_window: string;
  rationale: string;
  why_bpjs_points: string[];
  entry_price_mid: number;
}

export interface BSJPCandidate {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  close_price: number;
  entry_price: number;
  current_price: number;
  target_price: number;
  target_sell_morning_min: number;
  predicted_gain_tp1_pct?: number;
  target_sell_morning_max: number;
  predicted_gain_tp2_pct?: number;
  stop_loss_morning: number;
  predicted_stop_loss_pct?: number;
  selling_time_window?: string;
  selling_trigger_rule?: string;
  day_gain_pct: number;
  bsjp_score: number;
  gap_up_probability: string;
  volume_multiplier: number;
  close_to_high_ratio_pct: number;
  upper_shadow_pct: number;
  signed_delta_ratio: number;
  market_regime_ok: boolean;
  reasons: string[];
  rationale: string;
  adtv_20?: number;
  is_weekend_qualified?: boolean;
  weekend_exposure_hours?: number;
  weekend_risk_badge?: string;
}

export interface StockShieldReport {
  symbol: string;
  name: string;
  is_safe_to_buy: boolean;
  shield_verdict: string;
  risk_level: string;
  warning_flags: string[];
  positive_flags: string[];
  human_advice: string;
}

export interface StockAnalysisData {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  current_price: number;
  ai_score: number;
  graham_fair_value: number;
  margin_of_safety_pct: number;
  verdict_category: string;
  verdict_explanation: string;
  fundamental_summary: string;
  bandar_summary: string;
  technical_summary: string;
  risk_summary: string;
  score_breakdown: {
    profitability: number;
    valuation: number;
    solvency: number;
    liquidity: number;
    momentum: number;
  };
  metrics: {
    pe_ratio: number;
    pbv_ratio: number;
    roe_pct: number;
    der_ratio: number;
    revenue_growth_pct: number;
    lpm_score: number;
    volume_intensity: number;
    accumulation_fraction: number;
  };
  shield_report: StockShieldReport;
}

export interface JournalRecord {
  id: string;
  symbol: string;
  entry_price: number;
  shares_lot: number;
  entry_date: string;
  exit_price?: number;
  exit_date?: string;
  status: "OPEN" | "CLOSED";
  realized_pnl_pct?: number;
  realized_pnl_rp?: number;
  notes?: string;
}

export interface PortfolioSummary {
  total_equity: number;
  cash_balance: number;
  stock_market_value: number;
  total_pnl_rp: number;
  total_pnl_pct: number;
  open_positions: JournalRecord[];
  closed_positions: JournalRecord[];
  nav_history: { date: string; nav: number }[];
}

export interface EvaluationSummary {
  total_signals: number;
  total_trades?: number;
  evaluated_count: number;
  win_count: number;
  loss_count: number;
  pending_count: number;
  win_rate_pct: number;
  profit_factor: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  payoff_ratio?: number;
  expectancy_pct?: number;
  kelly_criterion_pct?: number;
  half_kelly_pct?: number;
  z_score_stat?: number;
  p_value_text?: string;
  is_statistically_significant?: boolean;
  max_consecutive_wins?: number;
  max_consecutive_losses?: number;
  net_total_pnl_pct?: number;
  bpjs_metrics: {
    total: number;
    win_rate: number;
    avg_pnl: number;
  };
  bsjp_metrics: {
    total: number;
    win_count: number;
    win_rate: number;
    avg_pnl: number;
  };
  pre_ara_metrics?: {
    total: number;
    win_count: number;
    win_rate: number;
    avg_pnl: number;
  };
  buy_layak_metrics?: {
    total: number;
    win_count: number;
    win_rate: number;
    avg_pnl: number;
  };
  buy_layak_win_rate_pct?: number;
  scalping_metrics?: {
    name: string;
    holding: string;
    target_pnl: string;
    cut_loss: string;
    total: number;
    win_count: number;
    win_rate: number;
    avg_pnl: number;
    strategies: string[];
  };
  swing_metrics?: {
    name: string;
    holding: string;
    target_pnl: string;
    cut_loss: string;
    total: number;
    win_count: number;
    win_rate: number;
    avg_pnl: number;
    strategies: string[];
  };
  invest_metrics?: {
    name: string;
    holding: string;
    target_pnl: string;
    cut_loss: string;
    total: number;
    win_count: number;
    win_rate: number;
    avg_pnl: number;
    strategies: string[];
  };
}

export interface EvaluatedTrade {
  id: number | string;
  strategy_type?: "BPJS" | "BSJP" | string;
  strategy?: "BPJS" | "BSJP" | string;
  symbol: string;
  name: string;
  sector?: string;
  signal_date?: string;
  signal_time: string;
  entry_price: number;
  target_tp1: number;
  target_tp2?: number;
  stop_loss: number;
  target_exit_time?: string;
  actual_exit_price?: number;
  actual_exit_time?: string;
  exit_price?: number;
  actual_highest_price?: number;
  actual_lowest_price?: number;
  realized_pnl_pct?: number;
  outcome_status?: "WIN" | "LOSS" | "PENDING" | string;
  outcome?: "WIN" | "LOSS" | "PENDING" | string;
  win_reason?: string;
  exit_trigger?: string;
  created_at?: string;
  evaluated_at?: string;
  is_sharia?: boolean;
  confidence_level?: string;
  confidence_score?: number;
}


export interface ScreenerHit {
  code: string;
  label: string;
  badge_color: string;
  score: number;
  key_metric: string;
}

export interface FundamentalAnalysisData {
  roe_pct: number;
  der_ratio: number;
  pbv_ratio: number;
  per_ratio: number;
  npm_pct: number;
  graham_fair_value: number;
  margin_of_safety_pct: number;
  solvency_status: string;
  valuation_status: string;
  fundamental_summary: string;
}

export interface TechnicalAnalysisData {
  rsi_14: number;
  trend_status: string;
  ma20: number;
  ma50: number;
  support_level: number;
  resistance_level: number;
  atr_pct: number;
  volume_surge_ratio: number;
  technical_summary: string;
}

export interface ConfluenceCandidate {
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  current_price: number;
  change_pct: number;
  confluence_count: number;
  confluence_score: number;
  confluence_tier: string;
  screeners_passed: ScreenerHit[];
  primary_strategy: string;
  entry_zone: string;
  target_tp1: number;
  predicted_gain_tp1_pct?: number;
  target_tp2: number;
  predicted_gain_tp2_pct?: number;
  stop_loss: number;
  predicted_stop_loss_pct?: number;
  selling_time_window?: string;
  selling_trigger_rule?: string;
  risk_reward_ratio: string;
  volume_velocity_multiplier: number;
  buyer_dominance_pct: number;
  lpm_score: number;
  ai_score: number;
  confluence_rationale: string;
  active_catalysts: string[];
  fundamental_analysis?: FundamentalAnalysisData;
  technical_analysis?: TechnicalAnalysisData;
}

export interface ConfluenceResponse {
  total_universe_scanned: number;
  total_confluence_found: number;
  ultra_confluence_count: number;
  high_confluence_count: number;
  dual_confluence_count: number;
  candidates: ConfluenceCandidate[];
}

export interface ForwardPosition {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  is_sharia?: boolean;
  strategy: "BPJS" | "BSJP" | "PRE_ARA" | "CONFLUENCE" | "SMARTPICK" | "MANUAL" | string;
  entry_time: string;
  entry_date: string;
  entry_price: number;
  shares_lot: number;
  total_shares: number;
  invested_capital: number;
  current_price: number;
  highest_price: number;
  lowest_price: number;
  floating_pnl_amt: number;
  floating_pnl_pct: number;
  target_tp1: number;
  predicted_gain_tp1_pct: number;
  target_tp2: number;
  predicted_gain_tp2_pct: number;
  stop_loss: number;
  predicted_stop_loss_pct: number;
  trailing_stop_active: boolean;
  trailing_stop_price: number;
  trailing_stop_pct: number;
  breakeven_lock_active?: boolean;
  breakeven_price?: number;
  selling_time_window: string;
  status: "OPEN" | "CLOSED" | string;
  close_time?: string;
  close_price?: number;
  realized_pnl_amt?: number;
  realized_pnl_pct?: number;
  exit_reason?: string;
  notes?: string;
}

export interface BotLogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ALERT" | "TRADE" | string;
  action: string;
  symbol?: string;
  message: string;
}

export interface ForwardTestPortfolio {
  initial_capital: number;
  cash_balance: number;
  portfolio_equity: number;
  total_invested: number;
  total_floating_pnl_amt: number;
  total_floating_pnl_pct: number;
  total_realized_pnl_amt: number;
  total_realized_pnl_pct: number;
  win_rate_pct: number;
  profit_factor: number;
  total_trades_count: number;
  winning_trades_count: number;
  losing_trades_count: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  max_drawdown_pct: number;
  auto_bot_enabled: boolean;
  bot_settings: {
    max_concurrent_positions: number;
    default_lot_per_trade: number;
    auto_tp_enabled: boolean;
    auto_sl_enabled: boolean;
    auto_time_stop_enabled: boolean;
    trailing_stop_enabled: boolean;
    min_score_filter: number;
  };
  open_positions: ForwardPosition[];
  closed_positions: ForwardPosition[];
  equity_history: {
    time: string;
    equity: number;
    cash: number;
    invested: number;
    open_count: number;
  }[];
  bot_logs?: BotLogEntry[];
}
