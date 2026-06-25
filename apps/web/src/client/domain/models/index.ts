import { Market, TransactionType } from '@sar/shared';

export interface User {
  username: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  stockId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: string;
  memo: string | null;
  stock?: Stock;
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
  todayPnl: number | null;
  todayPnlPercent: number | null;
}

export interface Dashboard {
  summary: DashboardSummary;
  holdings: DashboardHolding[];
  lastRefreshedAt: string | null;
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

export interface MarketProviderStatus {
  market: Market;
  label: string;
  available: boolean;
  setupHint: string | null;
}

export interface FeaturedStockQuote {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  currentPrice: number | null;
  changePercent: number | null;
  unavailableReason: string | null;
  range?: import('@sar/shared').QuoteChartRange;
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

export interface FeaturedQuotesResult {
  kr: FeaturedStockQuote[];
  us: FeaturedStockQuote[];
  fetchedAt: string;
}

export interface LoginResult {
  accessToken: string;
  username: string;
}

export interface SessionResult {
  accessToken: string | null;
  username: string | null;
}

export interface CreateTransactionInput {
  stockSymbol: string;
  market: Market;
  name: string;
  yahooSymbol?: string;
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: string;
  memo?: string;
}
