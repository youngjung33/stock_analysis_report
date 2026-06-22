import { Market, TransactionType } from '@sar/shared';

export interface UserEntity {
  id: string;
  username: string;
  passwordHash: string;
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
}

export interface DashboardSummary {
  totalCostBasis: number;
  totalMarketValue: number | null;
  totalUnrealizedPnl: number | null;
  totalRealizedPnl: number;
  holdingsCount: number;
}

export interface DashboardResult {
  summary: DashboardSummary;
  holdings: DashboardHolding[];
  lastRefreshedAt: Date | null;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
}
