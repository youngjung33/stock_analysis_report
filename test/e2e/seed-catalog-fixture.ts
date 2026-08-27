import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { StockCatalogEntry } from '@sar/shared';

export async function seedE2ECatalogFixture(webRoot: string): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const fixturePath = path.resolve(webRoot, '../../test/fixtures/e2e-catalog-entry.json');
    const raw = await readFile(fixturePath, 'utf8');
    const entries = JSON.parse(raw) as StockCatalogEntry[];

    for (const entry of entries) {
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
    }
  } finally {
    await prisma.$disconnect();
  }
}
