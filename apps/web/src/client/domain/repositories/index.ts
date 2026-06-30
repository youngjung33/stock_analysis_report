import {
  CreateTransactionInput,
  Dashboard,
  FeaturedQuotesResult,
  LoginResult,
  MarketProviderStatus,
  PortfolioAnalysisResult,
  PortfolioHolding,
  RefreshQuoteResult,
  StockQuoteSnapshot,
  Transaction,
  User,
  WatchlistItem,
} from '../models';
import {
  CorporateActionType,
  Market,
  MarketAnalysisReport,
  QuoteChartRange,
  StockSearchResult,
} from '@sar/shared';

export interface CreateCorporateActionInput {
  stockSymbol: string;
  name: string;
  market: Market;
  type: CorporateActionType;
  effectiveAt: string;
  cashAmount?: number;
  splitRatio?: number;
  targetSymbol?: string;
  targetMarket?: Market;
  targetName?: string;
  targetQuantity?: number;
  targetPrice?: number;
  memo?: string;
}

export interface IAuthRepository {
  login(username: string, password: string): Promise<LoginResult>;
  refresh(): Promise<LoginResult | null>;
  logout(): Promise<void>;
}

export interface ITransactionRepository {
  create(input: CreateTransactionInput): Promise<Transaction>;
  list(filters?: { stockId?: string; type?: string }): Promise<Transaction[]>;
  delete(id: string): Promise<void>;
}

export interface IPortfolioRepository {
  getDashboard(): Promise<Dashboard>;
  getHolding(symbol: string, market: Market): Promise<PortfolioHolding | null>;
  getAnalysis(): Promise<PortfolioAnalysisResult>;
  refreshQuotes(): Promise<RefreshQuoteResult>;
}

export interface IMarketRepository {
  getFeaturedQuotes(): Promise<FeaturedQuotesResult>;
  getStockQuote(symbol: string, market: Market, range: QuoteChartRange): Promise<StockQuoteSnapshot>;
  getMarketStatus(): Promise<MarketProviderStatus[]>;
  getMarketAnalysis(): Promise<MarketAnalysisReport>;
  searchStocks(query: string, market: Market): Promise<StockSearchResult[]>;
  getFxRate(): Promise<{ usdKrwRate: number | null; fetchedAt: string }>;
  fetchBatchQuotes(
    stocks: { stockId: string; symbol: string; market: Market }[],
  ): Promise<{
    updated: number;
    quotes: { stockId: string; currentPrice: number; changePercent: number | null; fetchedAt: string }[];
    succeeded: RefreshQuoteResult['succeeded'];
    failed: RefreshQuoteResult['failed'];
  }>;
}

export interface IWatchlistRepository {
  list(): Promise<WatchlistItem[]>;
  add(input: { symbol: string; name: string; market: Market }): Promise<WatchlistItem>;
  remove(id: string): Promise<void>;
}

export interface ICorporateActionRepository {
  create(input: CreateCorporateActionInput): Promise<void>;
}

export interface IGuestSessionPort {
  isActive(): boolean;
  activate(): void;
  clear(): void;
}

export interface IGuestStorePort {
  clear(): void;
}

export interface IAuthSessionPort {
  onUnauthorized(callback: () => void): void;
}

export interface ITokenStoragePort {
  getAccessToken(): string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
