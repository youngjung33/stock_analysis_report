import { buildStockRecommendations } from './market-recommendation/engine';
import type { MarketContextInput } from './market-recommendation/types';
import type {
  MarketInsightsResult,
  QuoteInsightInput,
  StockRecommendation,
} from './market-insights.types';

export function buildMarketInsights(
  krQuotes: QuoteInsightInput[],
  usQuotes: QuoteInsightInput[],
  maxRecommendations = 4,
  options?: Omit<MarketContextInput, 'krQuotes' | 'usQuotes'>,
): MarketInsightsResult {
  const result = buildStockRecommendations(
    { krQuotes, usQuotes, ...options },
    maxRecommendations,
  );
  return {
    kr: result.kr,
    us: result.us,
    recommendations: result.recommendations as StockRecommendation[],
    regimes: result.regimes,
  };
}
