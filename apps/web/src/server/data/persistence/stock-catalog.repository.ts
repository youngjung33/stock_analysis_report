import { PrismaClient } from '@prisma/client';
import { Market, StockSearchResult } from '@sar/shared';
import { prisma as defaultPrisma } from './prisma.service';
import { IStockCatalogRepository } from '../../domain/repositories';

export class PrismaStockCatalogRepository implements IStockCatalogRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async countByMarket(market: Market): Promise<number> {
    return this.prisma.stockCatalog.count({
      where: { market, isActive: true },
    });
  }

  async search(query: string, market: Market, limit = 15): Promise<StockSearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    const rows = await this.prisma.stockCatalog.findMany({
      where: {
        market,
        isActive: true,
        OR: [
          { symbol: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [{ symbol: 'asc' }],
    });

    return rows.map((row) => ({
      symbol: row.symbol,
      name: row.name,
      market: row.market as Market,
      yahooSymbol: row.yahooSymbol,
      exchange: row.board,
    }));
  }
}
