import { vi } from 'vitest';
import { Market, OAuthProvider, OAUTH_PROVIDER_META, TransactionType } from '@sar/shared';
import {
  IAuthRepository,
  IPortfolioRepository,
  ITransactionRepository,
} from '@/client/domain/repositories';
import { Dashboard, LoginResult, RegisterResult, RefreshQuoteResult, Transaction } from '@/client/domain/models';

export function createFakeAuthRepository(
  overrides: Partial<IAuthRepository> = {},
): IAuthRepository {
  return {
    login: vi.fn().mockResolvedValue({
      username: 'admin',
    } satisfies LoginResult),
    register: vi.fn().mockResolvedValue({
      username: 'new_user',
      isNewUser: true,
    } satisfies RegisterResult),
    listOAuthProviders: vi.fn().mockResolvedValue([OAUTH_PROVIDER_META[OAuthProvider.GOOGLE]]),
    checkUsernameAvailability: vi.fn().mockResolvedValue({
      available: true,
      message: '사용 가능한 아이디입니다.',
    }),
    startOAuthLogin: vi.fn().mockResolvedValue({
      authorizationUrl: 'https://oauth.example/authorize',
      state: 'state-1',
    }),
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
  name: 'Apple Inc.',
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
        todayPnl: null,
        todayPnlPercent: null,
        totalCostBasisKrw: 0,
        totalMarketValueKrw: null,
        totalUnrealizedPnlKrw: null,
        totalRealizedPnlKrw: 0,
        todayPnlKrw: null,
        todayPnlPercentKrw: null,
        usdKrwRate: null,
        hasUsdHoldings: false,
        allocationByMarket: { krPercent: 0, usPercent: 0 },
      },
      holdings: [],
      lastRefreshedAt: null,
    } satisfies Dashboard),
    refreshQuotes: vi.fn().mockResolvedValue({
      updated: 0,
      succeeded: [],
      failed: [],
    } satisfies RefreshQuoteResult),
    getHolding: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}
