export { Market, TransactionType } from './enums';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_COOKIE = 'accessToken';

export const GUEST_DISPLAY_NAME = '비회원';

export function isGuestUsername(username: string | null | undefined): boolean {
  return username === GUEST_DISPLAY_NAME;
}

export {
  AppErrorCode,
  APP_ERROR_MESSAGES,
  isAppErrorCode,
  isInternalAppErrorCode,
  resolveAppErrorMessage,
  apiErrorBody,
  USER_FACING_SERVER_ERROR_MESSAGE,
} from './app-error-codes';
export type { ApiErrorBody } from './app-error-codes';

export {
  OAuthProvider,
  OAUTH_PROVIDERS,
  OAUTH_PROVIDER_META,
  isOAuthProvider,
  validateRegisterInput,
  validateRegisterFields,
  getRegisterValidationError,
  validateUsernameFormat,
  validatePasswordFormat,
  validateLoginInput,
  proposeUsernameFromOAuthProfile,
  withUsernameSuffix,
  AUTH_USERNAME_HINT,
  AUTH_PASSWORD_HINT,
  USERNAME_PATTERN,
  PASSWORD_PATTERN,
} from './auth';
export { AuthTokenType, AUTH_TOKEN_TTL_MS } from './auth-tokens';
export type { AuthTokenType as AuthTokenTypeId } from './auth-tokens';
export type {
  OAuthProviderId,
  OAuthProviderMeta,
  RegisterInput,
  RegisterField,
  RegisterFieldErrors,
  OAuthUserProfile,
} from './auth';

export { computePosition } from './position-calculator';
export type { PositionState, PositionTransaction } from './position-calculator';
export {
  aggregatePortfolioTodayPnl,
  computeHoldingTodayPnl,
} from './portfolio-today-pnl';
export type { TodayPnlHoldingInput } from './portfolio-today-pnl';
export {
  aggregateKrwSummary,
  convertToKrw,
  enrichHoldingKrw,
} from './portfolio-fx';
export type {
  HoldingFxInput,
  HoldingKrwFields,
  KrwDashboardSummary,
} from './portfolio-fx';
export { computeAllocation } from './portfolio-allocation';
export { isPortfolioEmpty } from './portfolio-empty';
export type { AllocationByMarket, AllocationHoldingInput, AllocationItem, AllocationResult } from './portfolio-allocation';
export {
  formatAmount,
  formatAmountInput,
  parseAmountInput,
} from './amount-format';
export type { AmountFormatOptions } from './amount-format';
export {
  CashLedgerType,
  computeCashBalances,
  cashToKrw,
  formatCashAmount,
} from './cash-ledger';
export type { CashBalances, CashCurrency, CashLedgerEntryInput } from './cash-ledger';
export {
  DEFAULT_PORTFOLIO_PREFERENCES,
  buildPortfolioSimulation,
} from './portfolio-simulation';
export type {
  PortfolioPreferences,
  PortfolioSimulationResult,
  SimulationAction,
  SimulationActionType,
  SimulationHoldingInput,
} from './portfolio-simulation';
export {
  PORTFOLIO_PERIODS,
  PERIOD_LABELS,
  computeMaxTotalReturn,
  computeWeightedPeriodReturn,
  periodReturnFromCloses,
} from './portfolio-period-returns';
export type { PeriodReturnInput, PortfolioPeriod, PortfolioPeriodReturn } from './portfolio-period-returns';
export { blendBenchmarkReturn, compareToBenchmark, selectBlendedBenchmark } from './portfolio-benchmark';
export type { BenchmarkComparison } from './portfolio-benchmark';
export { applyCorporateActions } from './corporate-actions';
export type { CorporateActionInput, CorporateActionType } from './corporate-actions';
export { resolveCurrency, resolveYahooSymbol } from './stock-symbol';
export {
  dedupeSearchResults,
  parseYahooSearchQuote,
  searchFeaturedStocks,
} from './stock-search';
export type { StockSearchResult, YahooSearchQuote } from './stock-search';
export {
  dedupeCatalogEntries,
  parseKindCorpListHtml,
  parseNasdaqListedTxt,
  parseOtherListedTxt,
} from './stock-catalog';
export type { StockCatalogEntry } from './stock-catalog';
export {
  FEATURED_KR_STOCKS,
  FEATURED_US_STOCKS,
  FEATURED_STOCKS,
  featuredStockId,
  findFeaturedStock,
} from './featured-stocks';
export type { FeaturedStock } from './featured-stocks';
export {
  buildMarketInsights,
  computeRegionSentiment,
  sentimentBadgeClass,
  SENTIMENT_LABEL_KO,
  TAG_LABEL_KO,
} from './market-insights';
export type {
  MarketInsightsResult,
  QuoteInsightInput,
  RecommendationTag,
  RegionSentiment,
  SentimentLabel,
  StockRecommendation,
} from './market-insights';
export {
  QUOTE_CHART_RANGES,
  QUOTE_RANGE_LABELS,
  QUOTE_CHART_RANGE_HINT,
  isQuoteChartRange,
} from './chart-range';
export type { QuoteChartRange } from './chart-range';
export { sma, rsi, ema, macdLine, stdDev, rangePosition, volumeRatio, bollingerBands, stochastic, changePercentOverBars } from './technical-analysis';
export type { BollingerBandsResult, StochasticResult } from './technical-analysis';
export {
  INDEX_BENCHMARKS,
  MACRO_INDICATORS,
  SECTOR_ETFS,
  US_SECTOR_BENCHMARK,
  KR_SECTOR_BENCHMARK,
  yahooChartUrl,
} from './market-benchmarks';
export type { BenchmarkDefinition, MacroKind } from './market-benchmarks';
export { buildMacroSnapshot } from './market-macro';
export type { MacroIndicatorSnapshot, MacroSeriesInput, MacroTone } from './market-macro';
export { buildSectorSnapshot, rankSectorSnapshots, groupSectorsByMarket } from './market-sector';
export type { SectorEtfSnapshot, SectorSeriesInput } from './market-sector';
export {
  buildMarketAnalysisReport,
  buildIndexSnapshot,
  ANALYSIS_CATEGORY_LABEL,
} from './market-analysis';
export type {
  AnalysisCategory,
  AnalysisInsight,
  AnalysisLink,
  AnalysisTone,
  BollingerSnapshot,
  IndexTechnicalInput,
  IndexTechnicalSnapshot,
  MarketAnalysisReport,
  NewsAnalysisInput,
  StochasticSnapshot,
} from './market-analysis';
