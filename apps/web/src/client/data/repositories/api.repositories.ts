import { Market, QuoteChartRange } from '@sar/shared';
import {
  CorporateAction,
  CreateTransactionInput,
  FeaturedQuotesResult,
  LoginResult,
  MarketProviderStatus,
  PortfolioAnalysisResult,
  RefreshQuoteResult,
  SessionResult,
  StockQuoteSnapshot,
  WatchlistItem,
} from '../../domain/models';
import {
  CreateCorporateActionInput,
  IAuthRepository,
  ICorporateActionRepository,
  IMarketRepository,
  IPortfolioRepository,
  ITransactionRepository,
  IWatchlistRepository,
} from '../../domain/repositories';
import { apiClient } from '../api/client';
import { tokenStorage } from '../auth/token-storage';

export class ApiAuthRepository implements IAuthRepository {
  async login(username: string, password: string): Promise<LoginResult> {
    const { data } = await apiClient.post<LoginResult>('/auth/login', { username, password });
    return data;
  }

  async refresh(): Promise<LoginResult | null> {
    const { data } = await apiClient.post<SessionResult>('/auth/refresh');
    if (!data.username) {
      return null;
    }
    return { username: data.username };
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    tokenStorage.triggerUnauthorized();
  }
}

export class ApiTransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput) {
    const { data } = await apiClient.post('/transactions', input);
    return data;
  }

  async list(filters?: { stockId?: string; type?: string }) {
    const { data } = await apiClient.get('/transactions', { params: filters });
    return data;
  }

  async delete(id: string) {
    await apiClient.delete(`/transactions/${id}`);
  }
}

export class ApiPortfolioRepository implements IPortfolioRepository {
  async getDashboard() {
    const { data } = await apiClient.get('/portfolio/dashboard');
    return data;
  }

  async getHolding(symbol: string, market: Market) {
    const { data } = await apiClient.get<{ holding: import('../../domain/models').PortfolioHolding | null }>(
      '/portfolio/holding',
      { params: { symbol, market } },
    );
    return data.holding;
  }

  async getAnalysis() {
    const { data } = await apiClient.get<PortfolioAnalysisResult>('/portfolio/analysis');
    return data;
  }

  async refreshQuotes() {
    const { data } = await apiClient.post('/market/refresh');
    return data;
  }
}

export class ApiMarketRepository implements IMarketRepository {
  async getFeaturedQuotes() {
    const { data } = await apiClient.get<FeaturedQuotesResult>('/market/featured');
    return data;
  }

  async getStockQuote(symbol: string, market: Market, range: QuoteChartRange) {
    const { data } = await apiClient.get<StockQuoteSnapshot>('/market/quote', {
      params: { symbol, market, range },
    });
    return data;
  }

  async getMarketStatus() {
    const { data } = await apiClient.get<MarketProviderStatus[]>('/market/status');
    return data;
  }

  async getMarketAnalysis() {
    const { data } = await apiClient.get<import('@sar/shared').MarketAnalysisReport>('/market/analysis');
    return data;
  }

  async searchStocks(query: string, market: Market) {
    const { data } = await apiClient.get<import('@sar/shared').StockSearchResult[]>('/market/search', {
      params: { q: query, market },
    });
    return data;
  }

  async getFxRate() {
    const { data } = await apiClient.get<{ usdKrwRate: number | null; fetchedAt: string }>('/market/fx');
    return data;
  }

  async fetchBatchQuotes(stocks: { stockId: string; symbol: string; market: Market }[]) {
    const { data } = await apiClient.post<{
      updated: number;
      quotes: { stockId: string; currentPrice: number; changePercent: number | null; fetchedAt: string }[];
      succeeded: RefreshQuoteResult['succeeded'];
      failed: RefreshQuoteResult['failed'];
    }>('/market/quotes', { stocks });
    return data;
  }
}

export class ApiWatchlistRepository implements IWatchlistRepository {
  async list() {
    const { data } = await apiClient.get<{ items: WatchlistItem[] }>('/watchlist');
    return data.items;
  }

  async add(input: { symbol: string; name: string; market: Market }) {
    const { data } = await apiClient.post<{ item: WatchlistItem }>('/watchlist', input);
    return data.item;
  }

  async remove(id: string) {
    await apiClient.delete(`/watchlist/${id}`);
  }
}

export class ApiCorporateActionRepository implements ICorporateActionRepository {
  async create(input: CreateCorporateActionInput) {
    await apiClient.post('/corporate-actions', input);
  }

  async list() {
    const { data } = await apiClient.get<{ items: CorporateAction[] }>('/corporate-actions');
    return data.items;
  }

  async delete(id: string) {
    await apiClient.delete(`/corporate-actions/${id}`);
  }
}
