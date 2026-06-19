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
}

export interface Dashboard {
  summary: DashboardSummary;
  holdings: DashboardHolding[];
  lastRefreshedAt: string | null;
}

export interface RefreshQuoteResult {
  updated: number;
  failed: { stockId: string; symbol: string; reason: string }[];
}

export interface LoginResult {
  accessToken: string;
  username: string;
}

export interface CreateTransactionInput {
  stockSymbol: string;
  market: Market;
  name?: string;
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: string;
  memo?: string;
}
