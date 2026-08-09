import { Market } from '../enums';
import type { MacroIndicatorSnapshot } from '../market-macro';
import type { SectorEtfSnapshot } from '../market-sector';
import type {
  QuoteInsightInput,
  RecommendationTag,
  RegionSentiment,
} from '../market-sentiment';
import type { StockRecommendation } from '../market-insights.types';

export interface IndexContextSnapshot {
  yahooSymbol: string;
  name: string;
  market: Market;
  changePercent1d: number | null;
}

export type MarketRegimeId =
  | 'globalRiskOff'
  | 'globalRiskOn'
  | 'fxKrwWeak'
  | 'fxKrwStrong'
  | 'usLeadingKr'
  | 'syncBull'
  | 'syncBear'
  | 'diverged';

export interface MarketRegime {
  id: MarketRegimeId;
  labelKey: string;
}

export interface RecommendationEvidenceItem {
  key: string;
  params?: Record<string, string | number>;
}

export interface ScoreBreakdownItem {
  factor: string;
  delta: number;
  evidenceKey: string;
  evidenceParams?: Record<string, string | number>;
}

export interface EnrichedStockRecommendation extends StockRecommendation {
  score: number;
  scoreBreakdown: ScoreBreakdownItem[];
  evidenceItems: RecommendationEvidenceItem[];
  regimeContext: MarketRegimeId[];
  sectorAlignment?: string;
}

export interface CandidateStockInput {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  yahooSymbol?: string;
  source?: 'featured' | 'watchlist' | 'holding' | 'sector' | 'catalog';
}

export interface MarketContextInput {
  krQuotes: QuoteInsightInput[];
  usQuotes: QuoteInsightInput[];
  candidateQuotes?: QuoteInsightInput[];
  macro?: MacroIndicatorSnapshot[];
  sectors?: SectorEtfSnapshot[];
  indices?: IndexContextSnapshot[];
  usdKrwRate?: number | null;
  usdKrwChange1d?: number | null;
  investorProfile?: import('../investor-survey/profile').BuiltInvestorProfile | null;
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
  preferredTags?: RecommendationTag[];
  catalogSymbols?: Array<{ symbol: string; market: Market; name: string; yahooSymbol?: string }>;
}

export interface MarketContext {
  krSentiment: RegionSentiment;
  usSentiment: RegionSentiment;
  regimes: MarketRegime[];
  macro: MacroIndicatorSnapshot[];
  sectors: SectorEtfSnapshot[];
  indices: IndexContextSnapshot[];
  usdKrwRate: number | null;
  usdKrwChange1d: number | null;
  preferredTags: RecommendationTag[];
  heldSymbols: Set<string>;
  watchlistSymbols: Set<string>;
  leadingKrSectors: string[];
  leadingUsSectors: string[];
}

export interface StockRecommendationsResult {
  kr: RegionSentiment;
  us: RegionSentiment;
  regimes: MarketRegime[];
  recommendations: EnrichedStockRecommendation[];
}

export interface RecommendationContextResponse {
  macro: MacroIndicatorSnapshot[];
  sectors: SectorEtfSnapshot[];
  indices: IndexContextSnapshot[];
  usdKrwRate: number | null;
  usdKrwChange1d: number | null;
}

export type StockSectorTag =
  | 'semiconductor'
  | 'export'
  | 'platform'
  | 'auto'
  | 'finance'
  | 'energy'
  | 'healthcare'
  | 'domestic';
