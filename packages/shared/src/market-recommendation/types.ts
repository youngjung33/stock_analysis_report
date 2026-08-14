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
  /** §9.0.2 — groups same fact across channels for dedupe gate */
  dedupeKey?: string;
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
  /** Phase G — per-symbol chart snapshots keyed via technicalSymbolKey */
  technicalSnapshots?: import('./technical-enrichment').StockTechnicalSnapshot[];
  /** Phase H — per-symbol news snapshots */
  newsSnapshots?: import('./news-enrichment').StockNewsSnapshot[];
  /** Phase I — per-symbol event snapshots (earnings, dividend) */
  eventSnapshots?: import('./event-enrichment').StockEventSnapshot[];
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
  /** symbolKey → StockTechnicalSnapshot (Phase G) */
  technicalBySymbol: Record<string, import('./technical-enrichment').StockTechnicalSnapshot>;
  /** symbolKey → StockNewsSnapshot (Phase H) */
  newsBySymbol: Record<string, import('./news-enrichment').StockNewsSnapshot>;
  /** symbolKey → StockEventSnapshot (Phase I) */
  eventsBySymbol: Record<string, import('./event-enrichment').StockEventSnapshot>;
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
