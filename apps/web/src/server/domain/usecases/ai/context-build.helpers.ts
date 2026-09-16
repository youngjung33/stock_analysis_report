import { DEFAULT_PORTFOLIO_PREFERENCES } from '@sar/shared';
import type { PortfolioAnalysisResult } from '../../entities';
import { logWarn } from '@/server/observability/logger';

export const EMPTY_MARKET_CONTEXT = {
  macro: [],
  sectors: [],
  indices: [],
  usdKrwRate: null,
  usdKrwChange1d: null,
};

export const EMPTY_STOCK_ENRICHMENT = {
  candidateQuotes: [],
  technicalSnapshots: [],
  newsSnapshots: [],
  eventSnapshots: [],
  figureStatements: [],
};

export const EMPTY_PORTFOLIO_ANALYSIS: PortfolioAnalysisResult = {
  portfolioReturns: [],
  holdingReturns: [],
  benchmarkComparisons: [],
  holdingsInsights: [],
  fxRate: null,
  asOf: new Date(0).toISOString(),
  allocationByMarket: { krPercent: 0, usPercent: 0 },
};

export const EMPTY_PORTFOLIO_SIMULATION_BUNDLE = {
  preferences: {
    ...DEFAULT_PORTFOLIO_PREFERENCES,
    investorProfile: null,
  },
  simulation: {
    actions: [],
    stockAllocationByMarket: { krPercent: 0, usPercent: 0 },
    cashAllocationPercent: 0,
    deployableCashKrw: 0,
    totalValueKrw: 0,
    holdingCount: 0,
  },
  ledgerEntryCount: 0,
  asOf: new Date(0).toISOString(),
  investorProfile: null,
  recommendations: [],
  regimes: [],
};

export async function withContextFallback<T>(
  label: string,
  fallback: T,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logWarn('ai.context.partial_failure', {
      label,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}
