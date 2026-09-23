import { buildStockRecommendations } from './market-recommendation/engine';
import type { IndexContextSnapshot, MarketContextInput } from './market-recommendation/types';
import type { MarketInsightsResult, StockRecommendation } from './market-insights.types';

export function buildMarketInsights(
  indices: IndexContextSnapshot[],
  maxRecommendations = 4,
  options?: Omit<MarketContextInput, 'indices'>,
): MarketInsightsResult {
  const result = buildStockRecommendations({ indices, ...options }, maxRecommendations);
  return {
    kr: result.kr,
    us: result.us,
    recommendations: result.recommendations as StockRecommendation[],
    regimes: result.regimes,
  };
}
