import {
  AppErrorCode,
  DEFAULT_PORTFOLIO_PREFERENCES,
  type BuiltInvestorProfile,
  type StoredInvestorProfile,
} from '@sar/shared';
import type { PortfolioSimulationResult } from '@sar/shared';
import type { MarketRegime } from '@sar/shared';
import type { StockRecommendation } from '@sar/shared';
import type { PortfolioAnalysisResult } from '../../entities';
import type { BuiltMarketContextData } from '../market/build-market-context.use-case';
import { ValidationError } from '../../errors/domain.errors';
import { logWarn } from '@/server/observability/logger';
import type {
  FigureStatementSnapshot,
  QuoteInsightInput,
  StockEventSnapshot,
  StockNewsSnapshot,
  StockTechnicalSnapshot,
} from '@sar/shared';

export const EMPTY_MARKET_CONTEXT: BuiltMarketContextData = {
  macro: [],
  sectors: [],
  indices: [],
  usdKrwRate: null,
  usdKrwChange1d: null,
  indexInputs: [],
  macroInputs: [],
  sectorInputs: [],
};

export type StockEnrichmentBundle = {
  candidateQuotes: QuoteInsightInput[];
  technicalSnapshots: StockTechnicalSnapshot[];
  newsSnapshots: StockNewsSnapshot[];
  eventSnapshots: StockEventSnapshot[];
  figureStatements: FigureStatementSnapshot[];
};

export const EMPTY_STOCK_ENRICHMENT: StockEnrichmentBundle = {
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

export type PortfolioSimulationBundleFallback = {
  preferences: {
    targetKrPercent: number;
    targetUsPercent: number;
    maxSingleWeightPercent: number;
    investorProfile: StoredInvestorProfile | null;
  };
  simulation: PortfolioSimulationResult;
  ledgerEntryCount: number;
  asOf: string;
  investorProfile: BuiltInvestorProfile | null;
  recommendations: StockRecommendation[];
  regimes: MarketRegime[] | undefined;
};

export const EMPTY_PORTFOLIO_SIMULATION_BUNDLE: PortfolioSimulationBundleFallback = {
  preferences: {
    ...DEFAULT_PORTFOLIO_PREFERENCES,
    investorProfile: null,
  },
  simulation: {
    cash: { krw: 0, usd: 0 },
    cashTotalKrw: 0,
    investedKrw: 0,
    totalAssetsKrw: 0,
    cashPercent: 0,
    investedPercent: 0,
    stockAllocationByMarket: { krPercent: 0, usPercent: 0 },
    targetAllocationByMarket: { krPercent: 0, usPercent: 0 },
    allocationGapPercent: { kr: 0, us: 0 },
    actions: [],
    projectedCash: { krw: 0, usd: 0 },
    projectedCashTotalKrw: 0,
    projectedInvestedKrw: 0,
    projectedTotalAssetsKrw: 0,
    projectedStockAllocation: { krPercent: 0, usPercent: 0 },
    headline: '',
    description: '',
    headlineKey: 'shared.portfolio.simulation.empty',
    descriptionKey: 'shared.portfolio.simulation.empty',
  },
  ledgerEntryCount: 0,
  asOf: new Date(0).toISOString(),
  investorProfile: null,
  recommendations: [],
  regimes: [],
};

/** Maps critical context dependency failures to AI_CONTEXT_UNAVAILABLE */
export function rethrowAiContextUnavailable(error: unknown): never {
  if (error instanceof ValidationError && error.code === AppErrorCode.AI_CONTEXT_UNAVAILABLE) {
    throw error;
  }
  logWarn('ai.context.unavailable', {
    error: error instanceof Error ? error.message : String(error),
  });
  throw new ValidationError(AppErrorCode.AI_CONTEXT_UNAVAILABLE);
}

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
