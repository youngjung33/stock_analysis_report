import { Market, TransactionType } from '@sar/shared';

export interface UserEntity {
  id: string;
  username: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  createdAt: Date;
}

export interface AuthTokenEntity {
  id: string;
  userId: string;
  type: string;
  tokenHash: string;
  email: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface UserOAuthAccountEntity {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  createdAt: Date;
}

export interface OAuthStateEntity {
  id: string;
  state: string;
  provider: string;
  redirectUri: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface StockEntity {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  yahooSymbol: string | null;
  createdAt: Date;
}

export interface TransactionEntity {
  id: string;
  userId: string;
  stockId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: Date;
  memo: string | null;
  createdAt: Date;
}

export interface StockQuoteEntity {
  stockId: string;
  currentPrice: number;
  changePercent: number | null;
  fetchedAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface QuoteResult {
  currentPrice: number;
  changePercent: number | null;
}

export interface DashboardHolding {
  stockId: string;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  changePercent: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
  costBasis: number;
  costBasisKrw: number;
  marketValueKrw: number | null;
  unrealizedPnlKrw: number | null;
  realizedPnlKrw: number;
  weightPercent: number | null;
}

export interface DashboardSummary {
  totalCostBasis: number;
  totalMarketValue: number | null;
  totalUnrealizedPnl: number | null;
  totalRealizedPnl: number;
  holdingsCount: number;
  /** 당일 시세 등락 기준 평가 변화 (전일 종가 대비) */
  todayPnl: number | null;
  todayPnlPercent: number | null;
  totalCostBasisKrw: number;
  totalMarketValueKrw: number | null;
  totalUnrealizedPnlKrw: number | null;
  totalRealizedPnlKrw: number;
  todayPnlKrw: number | null;
  todayPnlPercentKrw: number | null;
  usdKrwRate: number | null;
  hasUsdHoldings: boolean;
  allocationByMarket: import('@sar/shared').AllocationByMarket;
}

export interface DashboardResult {
  summary: DashboardSummary;
  holdings: DashboardHolding[];
  lastRefreshedAt: Date | null;
}

export interface HoldingResult extends DashboardHolding {
  usdKrwRate: number | null;
}

export interface MarketProviderStatus {
  market: Market;
  label: string;
  available: boolean;
  setupHint: string | null;
}

export interface RefreshQuoteResult {
  updated: number;
  succeeded: { stockId: string; symbol: string; market: Market }[];
  failed: {
    stockId: string;
    symbol: string;
    market: Market;
    reason: string;
    reasonCode: 'not_configured' | 'fetch_error' | 'no_provider';
  }[];
}

export interface FeaturedStockQuote {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  currentPrice: number | null;
  changePercent: number | null;
  unavailableReason: string | null;
}

export interface FeaturedQuotesResult {
  kr: FeaturedStockQuote[];
  us: FeaturedStockQuote[];
  fetchedAt: string;
}

export interface StockPricePoint {
  timestamp: string;
  close: number;
}

export interface StockQuoteSnapshot {
  symbol: string;
  market: Market;
  currency: string;
  range: import('@sar/shared').QuoteChartRange;
  currentPrice: number;
  changePercent: number | null;
  fetchedAt: string;
  points: StockPricePoint[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
}

export interface CorporateActionEntity {
  id: string;
  userId: string;
  stockId: string;
  type: import('@sar/shared').CorporateActionType;
  effectiveAt: Date;
  cashAmount: number | null;
  splitRatio: number | null;
  targetStockId: string | null;
  targetQuantity: number | null;
  targetPrice: number | null;
  memo: string | null;
  createdAt: Date;
  stock?: StockEntity;
  targetStock?: StockEntity | null;
}

export interface WatchlistItemEntity {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  market: Market;
  createdAt: Date;
}

export interface PortfolioAnalysisResult {
  portfolioReturns: {
    period: import('@sar/shared').PortfolioPeriod;
    label: string;
    returnPercent: number | null;
    coveragePercent: number;
  }[];
  holdingReturns: {
    symbol: string;
    market: Market;
    periodReturns: Partial<Record<import('@sar/shared').PortfolioPeriod, number | null>>;
  }[];
  benchmarkComparisons: {
    period: import('@sar/shared').PortfolioPeriod;
    label: string;
    portfolioReturn: number | null;
    benchmarkName: string;
    benchmarkReturn: number | null;
    alpha: number | null;
  }[];
  holdingsInsights: {
    symbol: string;
    market: Market;
    name: string;
    rsi14: number | null;
    rsiLabel: string;
    news: { title: string; url: string; source: string }[];
  }[];
  fxRate: number | null;
  asOf: string;
  allocationByMarket: import('@sar/shared').AllocationByMarket;
}
