import { PrismaClient } from '@prisma/client';
import { Market, TransactionType } from '@sar/shared';
import {
  StockEntity,
  StockQuoteEntity,
  TransactionEntity,
  UserEntity,
} from '../../domain/entities';
import {
  IRefreshTokenRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
  IUserRepository,
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

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? { ...user } : null;
  }

  async create(user: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity> {
    return this.prisma.user.create({ data: user });
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
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
