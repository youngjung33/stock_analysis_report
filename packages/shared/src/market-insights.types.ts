import type { MarketRegime, MarketRegimeId, RecommendationEvidenceItem, ScoreBreakdownItem } from './market-recommendation/types';
import type { QuoteInsightInput, RecommendationTag, RegionSentiment, SentimentLabel } from './market-sentiment';

export type { QuoteInsightInput, RecommendationTag, RegionSentiment, SentimentLabel };

export interface StockRecommendation {
  symbol: string;
  name: string;
  market: import('./enums').Market;
  currency: string;
  currentPrice: number;
  changePercent: number;
  tag: RecommendationTag;
  /** @deprecated use tag + translateTag */
  tagLabel: string;
  /** @deprecated use reasonKey */
  reason: string;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
  score?: number;
  scoreBreakdown?: ScoreBreakdownItem[];
  evidenceItems?: RecommendationEvidenceItem[];
  regimeContext?: MarketRegimeId[];
  sectorAlignment?: string;
}

export interface MarketInsightsResult {
  kr: RegionSentiment;
  us: RegionSentiment;
  recommendations: StockRecommendation[];
  regimes?: MarketRegime[];
}
