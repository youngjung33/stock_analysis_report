import { AccessTokenPayload } from '../auth.types';
import {
  RefreshTokenEntity,
  StockEntity,
  StockQuoteEntity,
  TransactionEntity,
  UserEntity,
  CorporateActionEntity,
  WatchlistItemEntity,
} from '../entities';
import { Market, TransactionType } from '@sar/shared';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
export const STOCK_QUOTE_REPOSITORY = Symbol('STOCK_QUOTE_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface IUserRepository {
  findByUsername(username: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(user: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity>;
  count(): Promise<number>;
}

export interface IRefreshTokenRepository {
  create(data: Omit<RefreshTokenEntity, 'id' | 'revokedAt'>): Promise<RefreshTokenEntity>;
  findValidByHash(tokenHash: string): Promise<(RefreshTokenEntity & { user: UserEntity }) | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface IStockRepository {
  findBySymbolAndMarket(symbol: string, market: Market): Promise<StockEntity | null>;
  findById(id: string): Promise<StockEntity | null>;
  create(stock: Omit<StockEntity, 'id' | 'createdAt'>): Promise<StockEntity>;
  findHeldByUser(userId: string): Promise<StockEntity[]>;
}

export interface ITransactionRepository {
  create(data: Omit<TransactionEntity, 'id' | 'createdAt'>): Promise<TransactionEntity>;
  findByUser(userId: string, filters?: { stockId?: string; type?: TransactionType }): Promise<
    (TransactionEntity & { stock: StockEntity })[]
  >;
  findById(id: string): Promise<(TransactionEntity & { stock: StockEntity }) | null>;
  delete(id: string): Promise<void>;
  findByUserAndStock(userId: string, stockId: string): Promise<TransactionEntity[]>;
}

export interface IStockQuoteRepository {
  upsert(quote: StockQuoteEntity): Promise<StockQuoteEntity>;
  findByStockIds(stockIds: string[]): Promise<StockQuoteEntity[]>;
}

export interface ICorporateActionRepository {
  findByUser(userId: string): Promise<(CorporateActionEntity & { stock: StockEntity; targetStock: StockEntity | null })[]>;
  findByUserAndStock(userId: string, stockId: string): Promise<CorporateActionEntity[]>;
  create(data: Omit<CorporateActionEntity, 'id' | 'createdAt' | 'stock' | 'targetStock'>): Promise<CorporateActionEntity>;
  delete(id: string, userId: string): Promise<void>;
}

export interface IWatchlistRepository {
  findByUser(userId: string): Promise<WatchlistItemEntity[]>;
  create(data: Omit<WatchlistItemEntity, 'id' | 'createdAt'>): Promise<WatchlistItemEntity>;
  delete(id: string, userId: string): Promise<void>;
  findByUserSymbolMarket(userId: string, symbol: string, market: Market): Promise<WatchlistItemEntity | null>;
}

export interface IStockCatalogRepository {
  countByMarket(market: Market): Promise<number>;
  search(query: string, market: Market, limit?: number): Promise<import('@sar/shared').StockSearchResult[]>;
}

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  generateAccessToken(payload: { sub: string; username: string }): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  hashRefreshToken(token: string): string;
}

export interface CreateTransactionInput {
  userId: string;
  stockSymbol: string;
  market: Market;
  name: string;
  yahooSymbol?: string;
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: Date;
  memo?: string;
}
