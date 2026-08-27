import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { Market, type StockCatalogEntry } from '@sar/shared';
import { SearchStocksUseCase } from '@server/domain/usecases/market/search-stocks.use-case';
import { PrismaStockCatalogRepository } from '@server/data/persistence/stock-catalog.repository';
import { createMockMarketData } from '../mocks/repositories.mock';
import { isE2EDatabaseConfigured } from '../../e2e/member-e2e-env';

const FIXTURE_SYMBOL = 'E2ETST';
const prisma = new PrismaClient();

describe('stock catalog import integration', () => {
  beforeAll(async () => {
    if (!isE2EDatabaseConfigured()) return;

    const fixturePath = path.resolve(__dirname, '../../fixtures/e2e-catalog-entry.json');
    const raw = await readFile(fixturePath, 'utf8');
    const entries = JSON.parse(raw) as StockCatalogEntry[];
    const entry = entries[0]!;

    await prisma.stockCatalog.upsert({
      where: { symbol_market: { symbol: entry.symbol, market: entry.market } },
      create: {
        symbol: entry.symbol,
        name: entry.name,
        market: entry.market,
        board: entry.board,
        yahooSymbol: entry.yahooSymbol,
        isActive: true,
      },
      update: {
        name: entry.name,
        board: entry.board,
        yahooSymbol: entry.yahooSymbol,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    if (!isE2EDatabaseConfigured()) return;
    await prisma.stockCatalog.deleteMany({ where: { symbol: FIXTURE_SYMBOL, market: Market.KR } });
    await prisma.$disconnect();
  });

  it('finds imported catalog row via SearchStocksUseCase', async () => {
    if (!isE2EDatabaseConfigured()) {
      return;
    }

    const useCase = new SearchStocksUseCase(new PrismaStockCatalogRepository(prisma), createMockMarketData());
    const results = await useCase.execute('E2E Catalog', Market.KR);

    expect(results.some((row) => row.symbol === FIXTURE_SYMBOL)).toBe(true);
  });
});
