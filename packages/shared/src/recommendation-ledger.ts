/** Recommendation engine semver — bump when scoring rules change materially */
export const RECOMMENDATION_ENGINE_VERSION = '1.0.0';

export const GLOBAL_RECOMMENDATION_PROFILE_KEY = 'global';

export const RECOMMENDATION_OUTCOME_HORIZONS = ['1d', '1w', '1m'] as const;
export type RecommendationOutcomeHorizon = (typeof RECOMMENDATION_OUTCOME_HORIZONS)[number];

/** Calendar day offsets from batch runAt for outcome evaluation */
export const RECOMMENDATION_HORIZON_DAY_OFFSETS: Record<RecommendationOutcomeHorizon, number> = {
  '1d': 1,
  '1w': 7,
  '1m': 30,
};

export interface RecommendationBenchmarkAtRun {
  yahooSymbol: string;
  name: string;
  market: import('./enums').Market;
  priceAtRun: number;
}

export interface RecommendationBatchMacroSnapshot {
  usdKrwRate: number | null;
  usdKrwChange1d: number | null;
  krSentimentLabel: string;
  usSentimentLabel: string;
  benchmarks: RecommendationBenchmarkAtRun[];
}

/** KST calendar date YYYY-MM-DD for batch dedupe key */
export function kstTradingDate(from: Date = new Date()): string {
  return from.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function horizonReady(runAt: Date, horizon: RecommendationOutcomeHorizon, now: Date = new Date()): boolean {
  const offsetMs = RECOMMENDATION_HORIZON_DAY_OFFSETS[horizon] * 24 * 60 * 60 * 1000;
  return now.getTime() >= runAt.getTime() + offsetMs;
}

export function computeReturnPercent(priceAtRun: number, priceAtHorizon: number): number {
  if (priceAtRun <= 0) return 0;
  return ((priceAtHorizon / priceAtRun - 1) * 100);
}

/** API / client view — dates as ISO strings */
export interface RecommendationOutcomeView {
  id: string;
  horizon: RecommendationOutcomeHorizon;
  evaluatedAt: string;
  returnPercent: number;
  benchmarkReturn: number | null;
  alphaVsBenchmark: number | null;
}

export interface RecommendationItemView {
  id: string;
  rank: number;
  symbol: string;
  market: import('./enums').Market;
  tag: string;
  score: number;
  priceAtRun: number;
  changePercent1d: number | null;
  outcomes: RecommendationOutcomeView[];
}

export interface RecommendationBatchView {
  id: string;
  runAt: string;
  tradingDate: string;
  engineVersion: string;
  profileKey: string;
  regimes: unknown;
  items: RecommendationItemView[];
}

export interface RecommendationHistoryResponse {
  batches: RecommendationBatchView[];
}
