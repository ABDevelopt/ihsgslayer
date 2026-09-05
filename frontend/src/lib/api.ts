import {
  StockUniverseItem,
  BuySignalCandidate,
  PreARACandidate,
  BPJSCandidate,
  BSJPCandidate,
  StockAnalysisData,
  PortfolioSummary,
  EvaluationSummary,
  EvaluatedTrade,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText} at ${endpoint}`);
  }

  return res.json();
}

export const api = {
  // Danger Shield (Anti-FCA / Suspensi / ARB)
  async getDangerShieldRadar(filterType = "ALL", limit = 50): Promise<any> {
    return fetchJson(`/shield/radar?filter_type=${filterType}&limit=${limit}`);
  },

  async checkStockSafety(symbol: string): Promise<any> {
    return fetchJson(`/shield/check/${symbol}`);
  },
  // Stocks Universe
  async getUniverse(): Promise<{ count: number; universe: StockUniverseItem[] }> {
    return fetchJson("/stocks/");
  },

  async getStockAnalysis(symbol: string): Promise<StockAnalysisData> {
    return fetchJson(`/stocks/${symbol}`);
  },

  async getStockOrderFlow(symbol: string, period = "60d"): Promise<any> {
    return fetchJson(`/stocks/${symbol}/order-flow?period=${period}`);
  },

  // Screeners
  async getBuySignals(minScore = 65.0): Promise<{ count: number; candidates: BuySignalCandidate[] }> {
    return fetchJson(`/screener/buy-signals?min_score=${minScore}`);
  },

  async getPreARACandidates(minScore = 60.0): Promise<{ count: number; candidates: PreARACandidate[] }> {
    return fetchJson(`/screener/pre-ara?min_score=${minScore}`);
  },

  async getBPJSCandidates(minScore = 60.0): Promise<{ count: number; candidates: BPJSCandidate[]; timing_gate?: any }> {
    return fetchJson(`/screener/bpjs?min_score=${minScore}`);
  },

  async getBSJPCandidates(minScore = 50.0): Promise<{ count: number; candidates: BSJPCandidate[]; friday_shield?: any }> {
    return fetchJson(`/screener/bsjp?min_score=${minScore}`);
  },

  async getSmartPickStocks(): Promise<{ count: number; candidates: any[] }> {
    return fetchJson("/screener/smart-pick");
  },

  async queryNLP(query: string): Promise<any> {
    return fetchJson("/screener/query", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },

  // Portfolio Journal
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    return fetchJson("/journal/portfolio-summary");
  },

  async addJournalEntry(data: {
    symbol: string;
    entry_price: number;
    shares_lot: number;
    notes?: string;
  }): Promise<any> {
    return fetchJson("/journal/entries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Outcome Evaluation & Audit
  async getEvaluationSummary(): Promise<EvaluationSummary> {
    return fetchJson("/evaluation/summary");
  },

  async getEvaluationRecords(strategy?: string, outcome?: string, date?: string, limit = 100, tradingCategory?: string): Promise<{ count: number; total_records: number; records: EvaluatedTrade[] }> {
    const params = new URLSearchParams();
    if (strategy) params.append("strategy", strategy);
    if (outcome) params.append("status", outcome);
    if (date) params.append("date", date);
    if (tradingCategory && tradingCategory !== "ALL") params.append("trading_category", tradingCategory);
    params.append("limit", limit.toString());
    return fetchJson(`/evaluation/records?${params.toString()}`);
  },

  async getCategoriesSummary(): Promise<Record<string, any>> {
    return fetchJson("/evaluation/categories");
  },

  async getCategoryScreener(categoryName: string): Promise<any> {
    return fetchJson(`/screener/category/${categoryName}`);
  },

  async getAvailableAuditDates(): Promise<{ count: number; dates: string[] }> {
    return fetchJson("/evaluation/dates");
  },

  async getStockEvaluation(symbol: string): Promise<any> {
    const clean = symbol.replace(".JK", "");
    return fetchJson(`/evaluation/stock/${clean}`);
  },

  async evaluateNow(): Promise<any> {
    return fetchJson("/evaluation/evaluate-now", { method: "POST" });
  },

  async getSignalHistory(signalType?: string, limit = 100): Promise<any> {
    const params = new URLSearchParams();
    if (signalType) params.append("signal_type", signalType);
    params.append("limit", limit.toString());
    return fetchJson(`/evaluation/history?${params.toString()}`);
  },

  async getMultiScreenerConfluence(minConfluence = 2, minScore = 55): Promise<any> {
    const params = new URLSearchParams();
    params.append("min_confluence", minConfluence.toString());
    params.append("min_score", minScore.toString());
    return fetchJson(`/screener/confluence?${params.toString()}`);
  },

  // Forward Test & Paper Trading Studio
  async getForwardTestStatus(): Promise<any> {
    return fetchJson("/forward-test/status");
  },

  async openForwardPosition(data: {
    symbol: string;
    strategy: string;
    entry_price: number;
    shares_lot: number;
    target_tp1: number;
    target_tp2: number;
    stop_loss: number;
    name?: string;
    sector?: string;
    selling_time_window?: string;
    notes?: string;
  }): Promise<any> {
    return fetchJson("/forward-test/open", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async closeForwardPosition(data: {
    position_id: string;
    close_price?: number;
    exit_reason?: string;
    notes?: string;
  }): Promise<any> {
    return fetchJson("/forward-test/close", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async syncForwardPrices(): Promise<any> {
    return fetchJson("/forward-test/sync-prices", {
      method: "POST",
    });
  },

  async updateBotSettings(data: any): Promise<any> {
    return fetchJson("/forward-test/bot-settings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async resetForwardPortfolio(initial_capital = 100000000): Promise<any> {
    return fetchJson("/forward-test/reset", {
      method: "POST",
      body: JSON.stringify({ initial_capital }),
    });
  },

  async runAutonomousBotCycle(): Promise<any> {
    return fetchJson("/forward-test/bot/run-cycle", {
      method: "POST",
    });
  },

  async getBotLogs(limit = 50): Promise<any> {
    return fetchJson(`/forward-test/bot/logs?limit=${limit}`);
  },

  // Tactical Alerts & Playbooks
  async getAlertSettings(): Promise<any> {
    return fetchJson("/alerts/settings");
  },

  async updateAlertSettings(data: any): Promise<any> {
    return fetchJson("/alerts/settings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async testTelegramAlert(data: { bot_token: string; chat_id: string }): Promise<any> {
    return fetchJson("/alerts/test-telegram", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async testWhatsAppAlert(data: { provider: string; api_token: string; target_phone: string; endpoint_url?: string }): Promise<any> {
    return fetchJson("/alerts/test-whatsapp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async previewPlaybook(data: any): Promise<any> {
    return fetchJson("/alerts/preview-playbook", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Portfolio Multi-Analysis & Daily Recommendations
  async getPortfolioAdvisor(cashBalance = 50000000): Promise<any> {
    return fetchJson(`/portfolio/analysis?cash_balance=${cashBalance}`);
  },

  async getPortfolioHoldings(): Promise<any> {
    return fetchJson("/portfolio/holdings");
  },

  async addPortfolioHolding(data: {
    symbol: string;
    entry_price: number;
    shares_lot: number;
    target_tp1?: number;
    target_tp2?: number;
    stop_loss?: number;
    entry_date?: string;
    notes?: string;
  }): Promise<any> {
    return fetchJson("/portfolio/add", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async sellPortfolioHolding(data: {
    holding_id: string;
    exit_price: number;
    shares_lot: number;
    exit_date?: string;
    reason?: string;
  }): Promise<any> {
    return fetchJson("/portfolio/sell", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deletePortfolioHolding(holdingId: string): Promise<any> {
    return fetchJson(`/portfolio/holding/${holdingId}`, {
      method: "DELETE",
    });
  },

  async resetDemoPortfolio(): Promise<any> {
    return fetchJson("/portfolio/reset-demo", {
      method: "POST",
    });
  },

  async getPortfolioClosedTrades(): Promise<any> {
    return fetchJson("/portfolio/closed-trades");
  },
};
