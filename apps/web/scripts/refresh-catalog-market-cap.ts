#!/usr/bin/env tsx
/**
 * StockCatalog marketCap 갱신 (Yahoo chart meta).
 *   npm run refresh:catalog-market-cap
 *   npm run refresh:catalog-market-cap -- --market KR --limit 500
 */
import { PrismaClient } from '@prisma/client';
import { Market } from '@sar/shared';
import { fetchYahooMarketCap } from '../src/server/data/market/yahoo-chart.client';

const prisma = new PrismaClient();
const PAUSE_MS = 120;

function parseArgs(): { market?: Market; limit: number } {
  const args = process.argv.slice(2);
  const marketIdx = args.indexOf('--market');
  const limitIdx = args.indexOf('--limit');
  const marketRaw = marketIdx >= 0 ? args[marketIdx + 1] : undefined;
  const market =
    marketRaw === Market.KR || marketRaw === Market.US ? (marketRaw as Market) : undefined;
  const limit =
    limitIdx >= 0 && args[limitIdx + 1] ? Math.max(1, Number.parseInt(args[limitIdx + 1]!, 10)) : 2000;
  return { market, limit };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { market, limit } = parseArgs();
  const rows = await prisma.stockCatalog.findMany({
    where: {
      isActive: true,
      ...(market ? { market } : {}),
    },
    select: { symbol: true, market: true, yahooSymbol: true },
    take: limit,
    orderBy: [{ market: 'asc' }, { symbol: 'asc' }],
  });

  console.log(`갱신 대상: ${rows.length}종`);
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const cap = await fetchYahooMarketCap(row.yahooSymbol);
      if (cap == null) {
        failed += 1;
      } else {
        await prisma.stockCatalog.update({
          where: { symbol_market: { symbol: row.symbol, market: row.market } },
          data: { marketCap: BigInt(cap) },
        });
        updated += 1;
      }
    } catch {
      failed += 1;
    }
    await sleep(PAUSE_MS);
  }

  console.log(`완료 — updated: ${updated}, skipped/failed: ${failed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
