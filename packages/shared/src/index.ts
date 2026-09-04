export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALE_COOKIE_KEY,
  LOCALE_LABELS,
  isSupportedLocale,
  normalizeLocale,
} from './i18n';
export type { SupportedLocale } from './i18n';

export {
  THEME_MODES,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEME_COOKIE_KEY,
  THEME_LABELS,
  isThemeMode,
  normalizeTheme,
} from './theme';
export type { ThemeMode } from './theme';

export { newsToneFromTitle } from './news-tone';
export type { NewsTone } from './news-tone';

export { Market, TransactionType } from './enums';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_COOKIE = 'accessToken';

export {
  GUEST_SESSION_COOKIE,
  PUBLIC_PAGE_PATHS,
  normalizePagePath,
  isPublicPagePath,
  hasAppSessionCookie,
  sanitizePostAuthPath,
} from './route-access';
export { isAllowedOAuthRedirectUri } from './oauth-redirect';
export {
  issueGuestSessionToken,
  verifyGuestSessionToken,
} from './guest-session-token';
export { isPlausibleRefreshToken, isJwtNotExpired } from './session-cookie';

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
  AppSuccessCode,
  APP_SUCCESS_MESSAGES,
  isAppSuccessCode,
  resolveAppSuccessMessage,
  apiSuccessBody,
} from './app-success-codes';
export type { ApiSuccessBody, ApiSuccessResult } from './app-success-codes';

export {
  OAuthProvider,
  OAUTH_PROVIDERS,
  OAUTH_PROVIDER_META,
  isOAuthProvider,
  validateRegisterInput,
  validateRegisterFields,
  getRegisterValidationError,
  validateUsernameFormat,
  validateUsernameFormatCode,
  validatePasswordFormat,
  validatePasswordFormatCode,
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

export {
  formatCashLedgerMemo,
  formatTradeLedgerMemo,
  formatDividendLedgerMemo,
} from './ledger-memo';
export type { CashLedgerMemoKind } from './ledger-memo';
export type {
  QuoteFailureReasonCode,
  QuoteSetupHintCode,
  QuoteUnavailableReasonCode,
} from './quote-reason-codes';

export { computePosition, toPositionTransaction } from './position-calculator';
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
export {
  resolveSimulationAddPriority,
  resolveSimulationDeployCapRatio,
  sortRecommendationsForSimulationAdd,
  extractNarrativeDivergence,
} from './simulation-ranking';
export type { SimulationAddPriority, SimulationAddPriorityResult } from './simulation-ranking';
export {
  buildRankedPortfolioSimulation,
  toFeaturedQuoteInputs,
} from './portfolio-capital-simulation';
export type {
  FeaturedQuoteInput,
  RankedPortfolioSimulationResult,
} from './portfolio-capital-simulation';
export {
  buildDashboardFromRawHoldings,
  normalizeDashboardSummary,
} from './portfolio-dashboard';
export {
  buildHoldingWithKrw,
  buildRawDashboardHolding,
  buildRawHoldingsFromStockBundles,
  nextQuoteRefreshState,
} from './portfolio-holding-build';
export type {
  HoldingQuoteSnapshot,
  QuoteRefreshState,
  StockHoldingBundle,
} from './portfolio-holding-build';
export type {
  DashboardSummaryNormalized,
  RawDashboardHolding,
  BuiltDashboardHolding,
  DashboardSummaryResult,
  BuildDashboardFromHoldingsInput,
} from './portfolio-dashboard';
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
export {
  extractRealizedEvents,
  filterEventsByYear,
} from './realized-events';
export type { SellEvent, DividendEvent } from './realized-events';
export {
  estimateKoreanTax,
  resolveApplicableTaxRules,
  OTHER_INCOME_BRACKETS,
  DEFAULT_OTHER_INCOME_BRACKET_ID,
  resolveEstimatedOtherIncomeKrw,
  mapOtherIncomeToBracket,
  KOREAN_TAX_RULES_REFERENCE,
  KOREAN_INCOME_TAX_BRACKETS,
  FOREIGN_DIVIDEND_WITHHOLDING,
  DEFAULT_KOREAN_TAX_PROFILE,
  FINANCIAL_INCOME_THRESHOLD_KRW,
  CAPITAL_GAINS_BASIC_DEDUCTION_KRW,
  DOMESTIC_DIVIDEND_WITHHOLDING_RATE,
  FOREIGN_CAPITAL_GAINS_RATE,
  SECURITIES_TRANSACTION_TAX_RATE,
  computeKrSecuritiesTransactionTax,
  computeKrSellNetProceeds,
  ISA_ACCOUNT_OPTIONS,
  ISA_OVERFLOW_TAX_RATE,
  PENSION_SAVINGS_ANNUAL_LIMIT_KRW,
  PENSION_SAVINGS_CREDIT_MAX_KRW,
  PENSION_SAVINGS_CREDIT_RATE,
  computeIsaAccountTax,
  computePensionSavingsCredit,
  resolveIsaTaxFreeLimit,
  splitIncomeByIsaAccount,
} from './korean-tax';
export type { TradeCashSettlement } from './trade-settlement';
export { computeTradeCashSettlement } from './trade-settlement';
export type {
  KoreanTaxProfile,
  KoreanTaxRuleItem,
  KoreanTaxEstimate,
  TaxLineItem,
  TaxStockHistory,
  ForeignDividendSource,
  ForeignDividendWithholdingRule,
  ApplicableTaxRule,
  ApplicableTaxStatus,
  OtherIncomeBracket,
  OtherIncomeBracketId,
  IsaAccountType,
} from './korean-tax';
export { resolveCurrency, resolveYahooSymbol } from './stock-symbol';
export {
  dedupeSearchResults,
  parseYahooSearchQuote,
  searchFeaturedStocks,
} from './stock-search';
export type { StockSearchResult, YahooSearchQuote } from './stock-search';
export {
  dedupeCatalogEntries,
  enrichKrCatalogWithDartCorpCodes,
  parseDartCorpCodeXml,
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
  buildStockRecommendations,
  buildMarketContext,
  detectMarketRegimes,
  buildCandidatePool,
  scoreCandidates,
  scoreKrCandidate,
  scoreUsCandidate,
  buildStockTechnicalSnapshot,
  applyTechnicalEnrichment,
  buildStockNewsSnapshot,
  applyNewsEnrichment,
  computeNarrativeDivergence,
  applyNarrativeEnrichment,
  buildStockEventSnapshot,
  buildStockEventFromHeadline,
  buildStockEventFromKrDisclosure,
  classifyKrDisclosureReport,
  resolveKrCorpCode,
  KR_CORP_CODE_FALLBACK,
  isKrCorpCodeRegistered,
  applyEventEnrichment,
  buildFigureStatementSnapshots,
  mergeFigureStatementArticles,
  buildFigureSnsNewsQuery,
  FIGURE_RSS_FETCH_LIMIT,
  FIGURE_SNS_FETCH_LIMIT,
  FIGURE_STATEMENT_ARTICLE_SCAN_LIMIT,
  applyFigureEnrichment,
  applyFigureEnrichmentsForCandidate,
  FIGURE_REGISTRY,
  indexTechnicalSnapshots,
  indexNewsSnapshots,
  indexEventSnapshots,
  technicalSymbolKey,
  applyEnrichmentCaps,
  applyEnrichmentDedupe,
  applyScorePipeline,
  enrichmentFactor,
  figureLinkScopeAllowsSymbolDelta,
  ENRICHMENT_SCORE_CAPS,
  resolveUsdKrwChange1d,
  resolveUsdKrwRate,
} from './market-recommendation';
export type {
  MarketContext,
  MarketContextInput,
  MarketRegime,
  MarketRegimeId,
  EnrichedStockRecommendation,
  StockTechnicalSnapshot,
  StockNewsSnapshot,
  StockNarrativeSnapshot,
  StockEventSnapshot,
  FigureStatementSnapshot,
  FigureStatementSourceChannel,
  NarrativeDivergenceKind,
  StockRecommendationsResult,
  RecommendationContextResponse,
  IndexContextSnapshot,
} from './market-recommendation';
export {
  RECOMMENDATION_ENGINE_VERSION,
  GLOBAL_RECOMMENDATION_PROFILE_KEY,
  RECOMMENDATION_OUTCOME_HORIZONS,
  RECOMMENDATION_HORIZON_DAY_OFFSETS,
  kstTradingDate,
  horizonReady,
  computeReturnPercent,
} from './recommendation-ledger';
export {
  computeRecommendationBacktestSummary,
} from './recommendation-backtest';
export type {
  RecommendationBacktestSummary,
  RecommendationBacktestHorizonStats,
  RecommendationBacktestTagStats,
} from './recommendation-backtest';
export {
  suggestDeltaTuningHints,
  ENRICHMENT_DELTA_PROFILE_VERSION,
  enrichmentScoreCapsSnapshot,
} from './market-recommendation/enrichment-delta-tuning';
export type { DeltaTuningHint, DeltaTuningHintSeverity } from './market-recommendation/enrichment-delta-tuning';
export type {
  RecommendationOutcomeHorizon,
  RecommendationBenchmarkAtRun,
  RecommendationBatchMacroSnapshot,
  RecommendationOutcomeView,
  RecommendationItemView,
  RecommendationBatchView,
  RecommendationHistoryResponse,
} from './recommendation-ledger';
export { buildGlobalBaselineRecommendations } from './build-global-baseline-recommendations';
export {
  QUOTE_CHART_RANGES,
  QUOTE_RANGE_LABELS,
  QUOTE_CHART_RANGE_HINT,
  isQuoteChartRange,
} from './chart-range';
export type { QuoteChartRange } from './chart-range';
export { sma, rsi, ema, macdLine, stdDev, rangePosition, volumeRatio, bollingerBands, stochastic, changePercentOverBars, dailyChangePercentFromCloses } from './technical-analysis';
export type { DailyChangeFromClosesOptions } from './technical-analysis';
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
export { buildMarketMoveReasonInsights } from './market-move-reason';
export {
  buildStockPriceExplanationReport,
  pickStockEnrichment,
  filterPriceFirstBreakdown,
} from './stock-price-explanation';
export type { StockPriceExplanationReport } from './stock-price-explanation';
export {
  computeStockActionPlan,
  deriveConservativeBuyBelow,
  deriveConservativeSellAbove,
  STOCK_ACTION_RULES,
} from './stock-action-plan';
export type {
  StockActionStance,
  StockActionPlan,
  StockActionRuleId,
} from './stock-action-plan';
export type {
  AnalysisCategory,
  AnalysisInsight,
  AnalysisLink,
  AnalysisTone,
  BollingerSnapshot,
  EvidenceItem,
  IndexTechnicalInput,
  IndexTechnicalSnapshot,
  MarketAnalysisReport,
  NewsAnalysisInput,
  StochasticSnapshot,
} from './market-analysis';

export {
  GUIDE_CATEGORIES,
  GUIDE_FAQ_CATALOG,
  isGuideCategoryId,
} from './guide';
export type { GuideCategoryId, GuideFaqItemDef, GuideRelatedLink } from './guide';

export {
  INVESTOR_SURVEY_STEP_COUNT,
  INVESTOR_SURVEY_STEP_IDS,
  INVESTOR_SURVEY_OPTION_IDS,
  INVESTOR_TYPE_IDS,
  INVESTOR_TYPE_PROFILES,
  GUIDE_ANALYSIS_TEST_LINKS,
  MINI_ANALYSIS_TEST_IDS,
  MINI_ANALYSIS_TESTS,
  computeInvestorSurveyResult,
  computeMiniAnalysisResult,
  computeSurveyTotalScore,
  getAnalysisTestLink,
  getInvestorTypeProfile,
  isAnalysisTestId,
  isInvestorSurveyStepId,
  isInvestorTypeId,
  isMiniAnalysisTestId,
  resolveInvestorTypeFromScore,
  ANALYSIS_TEST_IDS,
  DEFAULT_ADJUSTMENT_PERCENT,
  MAX_ADJUSTMENT_PERCENT,
  MIN_ADJUSTMENT_PERCENT,
  TEST_SCORE_WEIGHTS,
  buildInvestorProfile,
  clampAdjustmentPercent,
  computeCompositePercent,
  createDefaultStoredProfile,
  createEmptyLedger,
  effectivePercentFromComposite,
  getDefaultTypeProfile,
  normalizePercentScore,
  rankRecommendationsByTags,
  scoreEntryFromInvestorSurvey,
  scoreEntryFromMiniTest,
  totalScoreFromEffectivePercent,
  upsertTestScore,
} from './investor-survey';
export type {
  AnalysisTestId,
  AnalysisTestLinkDef,
  BuiltInvestorProfile,
  InvestorAssetMix,
  InvestorScoreLedger,
  InvestorSurveyAnswers,
  InvestorSurveyOptionId,
  InvestorSurveyResult,
  InvestorSurveyStepId,
  InvestorTypeId,
  InvestorTypeProfile,
  MiniAnalysisResult,
  MiniAnalysisTestDef,
  MiniAnalysisTestId,
  StoredInvestorProfile,
  TestScoreEntry,
} from './investor-survey';
