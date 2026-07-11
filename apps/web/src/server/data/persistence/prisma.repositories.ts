import { PrismaClient } from '@prisma/client';
import { Market, TransactionType } from '@sar/shared';
import {
  StockEntity,
  StockQuoteEntity,
  TransactionEntity,
  UserEntity,
  CorporateActionEntity,
  WatchlistItemEntity,
} from '../../domain/entities';
import {
  IRefreshTokenRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
  IUserRepository,
  ICorporateActionRepository,
  IWatchlistRepository,
} from '../../domain/repositories';
import { prisma as defaultPrisma } from './prisma.service';

function mapStock(stock: {
  id: string;
  symbol: string;
  name: string;
  market: string;
  currency: string;
  yahooSymbol: string | null;
  createdAt: Date;
}): StockEntity {
  return {
    ...stock,
    market: stock.market as Market,
  };
}

function mapTransaction(tx: {
  id: string;
  userId: string;
  stockId: string;
  type: string;
  quantity: number;
  price: number;
  tradedAt: Date;
  memo: string | null;
  createdAt: Date;
}): TransactionEntity {
  return {
    ...tx,
    type: tx.type as TransactionType,
  };
}

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? { ...user } : null;
  }

  async create(user: Omit<UserEntity, 'id' | 'createdAt' | 'emailVerifiedAt'> & { emailVerifiedAt?: Date | null }) {
    return this.prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
      },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async updateEmail(userId: string, email: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { email, emailVerifiedAt: null },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async delete(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.refreshToken.create({ data });
  }

  async findValidByHash(tokenHash: string) {
    const token = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });
    return token;
  }

  async revoke(id: string) {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export class PrismaStockRepository implements IStockRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findBySymbolAndMarket(symbol: string, market: Market) {
    const stock = await this.prisma.stock.findUnique({
      where: { symbol_market: { symbol, market } },
    });
    return stock ? mapStock(stock) : null;
  }

  async findById(id: string) {
    const stock = await this.prisma.stock.findUnique({ where: { id } });
    return stock ? mapStock(stock) : null;
  }

  async create(stock: Omit<StockEntity, 'id' | 'createdAt'>) {
    const created = await this.prisma.stock.create({ data: stock });
    return mapStock(created);
  }

  async findHeldByUser(userId: string) {
    const stockIds = await this.prisma.transaction.findMany({
      where: { userId },
      select: { stockId: true },
      distinct: ['stockId'],
    });

    if (stockIds.length === 0) return [];

    const stocks = await this.prisma.stock.findMany({
      where: { id: { in: stockIds.map((s) => s.stockId) } },
    });
    return stocks.map(mapStock);
  }
}

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async create(data: Omit<TransactionEntity, 'id' | 'createdAt'>) {
    const created = await this.prisma.transaction.create({ data });
    return mapTransaction(created);
  }

  async findByUser(userId: string, filters?: { stockId?: string; type?: TransactionType }) {
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        ...(filters?.stockId ? { stockId: filters.stockId } : {}),
        ...(filters?.type ? { type: filters.type } : {}),
      },
      include: { stock: true },
      orderBy: { tradedAt: 'desc' },
    });

    return rows.map((row) => ({
      ...mapTransaction(row),
      stock: mapStock(row.stock),
    }));
  }

  async findById(id: string) {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      include: { stock: true },
    });
    if (!row) return null;
    return { ...mapTransaction(row), stock: mapStock(row.stock) };
  }

  async delete(id: string) {
    await this.prisma.transaction.delete({ where: { id } });
  }

  async findByUserAndStock(userId: string, stockId: string) {
    const rows = await this.prisma.transaction.findMany({
      where: { userId, stockId },
      orderBy: { tradedAt: 'asc' },
    });
    return rows.map(mapTransaction);
  }
}

export class PrismaStockQuoteRepository implements IStockQuoteRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async upsert(quote: StockQuoteEntity) {
    return this.prisma.stockQuote.upsert({
      where: { stockId: quote.stockId },
      create: quote,
      update: {
        currentPrice: quote.currentPrice,
        changePercent: quote.changePercent,
        fetchedAt: quote.fetchedAt,
      },
    });
  }

  async findByStockIds(stockIds: string[]): Promise<StockQuoteEntity[]> {
    if (stockIds.length === 0) return [];
    return this.prisma.stockQuote.findMany({
      where: { stockId: { in: stockIds } },
    });
  }
}

export class PrismaCorporateActionRepository implements ICorporateActionRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findByUser(userId: string) {
    const rows = await this.prisma.corporateAction.findMany({
      where: { userId },
      include: { stock: true, targetStock: true },
      orderBy: { effectiveAt: 'desc' },
    });
    return rows.map((row) => ({
      ...row,
      type: row.type as CorporateActionEntity['type'],
      stock: mapStock(row.stock),
      targetStock: row.targetStock ? mapStock(row.targetStock) : null,
    }));
  }

  async findByUserAndStock(userId: string, stockId: string) {
    const rows = await this.prisma.corporateAction.findMany({
      where: { userId, stockId },
      orderBy: { effectiveAt: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      type: row.type as CorporateActionEntity['type'],
    }));
  }

  async create(data: Omit<CorporateActionEntity, 'id' | 'createdAt' | 'stock' | 'targetStock'>) {
    const created = await this.prisma.corporateAction.create({
      data: {
        userId: data.userId,
        stockId: data.stockId,
        type: data.type,
        effectiveAt: data.effectiveAt,
        cashAmount: data.cashAmount,
        splitRatio: data.splitRatio,
        targetStockId: data.targetStockId,
        targetQuantity: data.targetQuantity,
        targetPrice: data.targetPrice,
        memo: data.memo,
      },
    });
    return { ...created, type: created.type as CorporateActionEntity['type'] };
  }

  async delete(id: string, userId: string) {
    await this.prisma.corporateAction.deleteMany({ where: { id, userId } });
  }
}

export class PrismaWatchlistRepository implements IWatchlistRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async findByUser(userId: string) {
    const rows = await this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({ ...row, market: row.market as Market }));
  }

  async create(data: Omit<WatchlistItemEntity, 'id' | 'createdAt'>) {
    const created = await this.prisma.watchlistItem.create({ data });
    return { ...created, market: created.market as Market };
  }

  async delete(id: string, userId: string) {
    await this.prisma.watchlistItem.deleteMany({ where: { id, userId } });
  }

  async findByUserSymbolMarket(userId: string, symbol: string, market: Market) {
    const row = await this.prisma.watchlistItem.findUnique({
      where: { userId_symbol_market: { userId, symbol, market } },
    });
    return row ? { ...row, market: row.market as Market } : null;
  }
}
