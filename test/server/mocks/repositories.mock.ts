import { vi } from 'vitest';
import { Market, TransactionType } from '@sar/shared';
import {
  IMarketDataProvider,
  IPasswordHasher,
  IRefreshTokenRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITokenService,
  ITransactionRepository,
  IUserRepository,
  ICorporateActionRepository,
} from '@server/domain/repositories';
import { IFxRateProvider } from '@server/domain/ports/market-data.ports';
import { StockEntity, TransactionEntity, UserEntity } from '@server/domain/entities';

export function createMockUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    username: 'admin',
    passwordHash: 'hash',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockStock(overrides: Partial<StockEntity> = {}): StockEntity {
  return {
    id: 'stock-1',
    symbol: 'AAPL',
    name: 'Apple',
    market: Market.US,
    currency: 'USD',
    yahooSymbol: 'AAPL',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockTransaction(
  overrides: Partial<TransactionEntity> = {},
): TransactionEntity {
  return {
    id: 'tx-1',
    userId: 'user-1',
    stockId: 'stock-1',
    type: TransactionType.BUY,
    quantity: 10,
    price: 100,
    tradedAt: new Date('2024-01-01'),
    memo: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockUserRepo(
  overrides: Partial<IUserRepository> = {},
): IUserRepository {
  return {
    findByUsername: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    ...overrides,
  };
}

export function createMockRefreshTokenRepo(
  overrides: Partial<IRefreshTokenRepository> = {},
): IRefreshTokenRepository {
  return {
    create: vi.fn(),
    findValidByHash: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
    ...overrides,
  };
}

export function createMockPasswordHasher(valid = true): IPasswordHasher {
  return {
    hash: vi.fn(),
    compare: vi.fn().mockResolvedValue(valid),
  };
}

export function createMockTokenService(): ITokenService {
  return {
    generateAccessToken: vi.fn().mockReturnValue('access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
    verifyAccessToken: vi.fn(),
    hashRefreshToken: vi.fn().mockReturnValue('token-hash'),
  };
}

export function createMockStockRepo(
  overrides: Partial<IStockRepository> = {},
): IStockRepository {
  return {
    findBySymbolAndMarket: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findHeldByUser: vi.fn(),
    ...overrides,
  };
}

export function createMockTransactionRepo(
  overrides: Partial<ITransactionRepository> = {},
): ITransactionRepository {
  return {
    create: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
    findByUserAndStock: vi.fn(),
    ...overrides,
  };
}

export function createMockQuoteRepo(
  overrides: Partial<IStockQuoteRepository> = {},
): IStockQuoteRepository {
  return {
    upsert: vi.fn(),
    findByStockIds: vi.fn(),
    ...overrides,
  };
}

export function createMockCorpActionRepo(
  overrides: Partial<ICorporateActionRepository> = {},
): ICorporateActionRepository {
  return {
    findByUser: vi.fn().mockResolvedValue([]),
    findByUserAndStock: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

export function createMockFxRateProvider(rate = 1300): IFxRateProvider {
  return {
    fetchUsdKrwRate: vi.fn().mockResolvedValue(rate),
  };
}

export function createMockMarketProvider(
  market: Market,
  quote = { currentPrice: 150, changePercent: 2.5 },
): IMarketDataProvider {
  return {
    supports: vi.fn().mockReturnValue(true),
    isAvailable: vi.fn().mockReturnValue(true),
    unavailableReason: vi.fn().mockReturnValue(null),
    fetchQuote: vi.fn().mockResolvedValue(quote),
  };
}
