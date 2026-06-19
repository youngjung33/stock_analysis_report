import { vi } from 'vitest';
import { Market, TransactionType } from '@sar/shared';
import {
  IAuthRepository,
  IPortfolioRepository,
  ITransactionRepository,
} from '@/client/domain/repositories';
import { Dashboard, LoginResult, RefreshQuoteResult, Transaction } from '@/client/domain/models';

export function createFakeAuthRepository(
  overrides: Partial<IAuthRepository> = {},
): IAuthRepository {
  return {
    login: vi.fn().mockResolvedValue({
      accessToken: 'token',
      username: 'admin',
    } satisfies LoginResult),
    refresh: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

export function createFakeTransactionRepository(
  overrides: Partial<ITransactionRepository> = {},
): ITransactionRepository {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'tx-1',
      userId: 'user-1',
      stockId: 'stock-1',
      type: TransactionType.BUY,
      quantity: 10,
      price: 100,
      tradedAt: new Date().toISOString(),
      memo: null,
    } satisfies Transaction),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
    ...overrides,
  };
}

export const sampleTransactionInput = {
  stockSymbol: 'AAPL',
  market: Market.US,
  type: TransactionType.BUY,
  quantity: 10,
  price: 100,
  tradedAt: new Date().toISOString(),
};

export function createFakePortfolioRepository(
  overrides: Partial<IPortfolioRepository> = {},
): IPortfolioRepository {
  return {
    getDashboard: vi.fn().mockResolvedValue({
      summary: {
        totalCostBasis: 0,
        totalMarketValue: null,
        totalUnrealizedPnl: null,
        totalRealizedPnl: 0,
        holdingsCount: 0,
      },
      holdings: [],
      lastRefreshedAt: null,
    } satisfies Dashboard),
    refreshQuotes: vi.fn().mockResolvedValue({
      updated: 0,
      failed: [],
    } satisfies RefreshQuoteResult),
    ...overrides,
  };
}
