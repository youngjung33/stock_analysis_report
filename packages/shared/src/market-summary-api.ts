import type { Market } from './enums';
import type { MarketInsightsResult } from './market-insights.types';

export interface RegionIndexQuote {
  name: string;
  yahooSymbol: string;
  market: Market;
  currentPrice: number | null;
  changePercent1d: number | null;
}

export interface MarketIndicesResult {
  indices: RegionIndexQuote[];
  fetchedAt: string;
}

export interface MarketSentimentSummaryResult {
  indices: RegionIndexQuote[];
  insights: MarketInsightsResult;
  fetchedAt: string;
}
