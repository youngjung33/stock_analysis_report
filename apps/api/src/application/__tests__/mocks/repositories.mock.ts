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
} from '../../../domain/repositories';
import { StockEntity, TransactionEntity, UserEntity } from '../../../domain/entities';

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
): jest.Mocked<IUserRepository> {
  return {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    ...overrides,
  } as jest.Mocked<IUserRepository>;
}

export function createMockRefreshTokenRepo(
  overrides: Partial<IRefreshTokenRepository> = {},
): jest.Mocked<IRefreshTokenRepository> {
  return {
    create: jest.fn(),
    findValidByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
    ...overrides,
  } as jest.Mocked<IRefreshTokenRepository>;
}

export function createMockPasswordHasher(
  valid = true,
): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn(),
    compare: jest.fn().mockResolvedValue(valid),
  } as jest.Mocked<IPasswordHasher>;
}

export function createMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn().mockReturnValue('access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    verifyAccessToken: jest.fn(),
    hashRefreshToken: jest.fn().mockReturnValue('token-hash'),
  } as jest.Mocked<ITokenService>;
}

export function createMockStockRepo(
  overrides: Partial<IStockRepository> = {},
): jest.Mocked<IStockRepository> {
  return {
    findBySymbolAndMarket: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findHeldByUser: jest.fn(),
    ...overrides,
  } as jest.Mocked<IStockRepository>;
}

export function createMockTransactionRepo(
  overrides: Partial<ITransactionRepository> = {},
): jest.Mocked<ITransactionRepository> {
  return {
    create: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
    findByUserAndStock: jest.fn(),
    ...overrides,
  } as jest.Mocked<ITransactionRepository>;
}

export function createMockQuoteRepo(
  overrides: Partial<IStockQuoteRepository> = {},
): jest.Mocked<IStockQuoteRepository> {
  return {
    upsert: jest.fn(),
    findByStockIds: jest.fn(),
    ...overrides,
  } as jest.Mocked<IStockQuoteRepository>;
}

export function createMockMarketProvider(
  market: Market,
  quote = { currentPrice: 150, changePercent: 2.5 },
): jest.Mocked<IMarketDataProvider> {
  return {
    supports: jest.fn().mockReturnValue(true),
    fetchQuote: jest.fn().mockResolvedValue(quote),
  } as unknown as jest.Mocked<IMarketDataProvider>;
}
