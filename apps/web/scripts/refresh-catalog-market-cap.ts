#!/usr/bin/env tsx
/**
 * StockCatalog marketCap 갱신 (Yahoo chart meta).
 *   npm run refresh:catalog-market-cap
 *   npm run refresh:catalog-market-cap -- --market KR
 *   npm run refresh:catalog-market-cap -- --limit 500   # 이번 실행에서 최대 500종만
 *   npm run refresh:catalog-market-cap -- --batch-size 100
 */
import { PrismaClient } from '@prisma/client';
import { Market } from '@sar/shared';
import { fetchYahooMarketCap } from '../src/server/data/market/yahoo-chart.client';

const prisma = new PrismaClient();
const PAUSE_MS = 120;
const DEFAULT_BATCH_SIZE = 200;

export type RefreshCatalogMarketCapArgs = {
  market?: Market;
  /** undefined = active catalog 전체 */
  maxRows?: number;
  batchSize: number;
};

export function parseRefreshCatalogMarketCapArgs(argv: string[]): RefreshCatalogMarketCapArgs {
  const args = argv.slice(2);
  const marketIdx = args.indexOf('--market');
  const limitIdx = args.indexOf('--limit');
  const batchIdx = args.indexOf('--batch-size');
  const marketRaw = marketIdx >= 0 ? args[marketIdx + 1] : undefined;
  const market =
    marketRaw === Market.KR || marketRaw === Market.US ? (marketRaw as Market) : undefined;
  const maxRows =
    limitIdx >= 0 && args[limitIdx + 1]
      ? Math.max(1, Number.parseInt(args[limitIdx + 1]!, 10))
      : undefined;
  const batchSize =
    batchIdx >= 0 && args[batchIdx + 1]
      ? Math.max(1, Math.min(500, Number.parseInt(args[batchIdx + 1]!, 10)))
      : DEFAULT_BATCH_SIZE;
  return { market, maxRows, batchSize };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { market, maxRows, batchSize } = parseRefreshCatalogMarketCapArgs(process.argv);
  const where = {
    isActive: true,
    ...(market ? { market } : {}),
  };

  const total = await prisma.stockCatalog.count({ where });
  const targetTotal = maxRows != null ? Math.min(maxRows, total) : total;
  console.log(
    `갱신 대상: 최대 ${targetTotal}종 (active ${total}종${market ? `, market=${market}` : ''})`,
  );

  let updated = 0;
  let failed = 0;
  let processed = 0;
  let cursor: { symbol: string; market: string } | undefined;

  while (processed < targetTotal) {
    const take = Math.min(batchSize, targetTotal - processed);
    const rows = await prisma.stockCatalog.findMany({
      where,
      select: { symbol: true, market: true, yahooSymbol: true },
      orderBy: [{ market: 'asc' }, { symbol: 'asc' }],
      take,
      ...(cursor
        ? {
            skip: 1,
            cursor: { symbol_market: { symbol: cursor.symbol, market: cursor.market } },
          }
        : {}),
    });

    if (rows.length === 0) break;

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
      processed += 1;
      await sleep(PAUSE_MS);
      if (processed >= targetTotal) break;
    }

    const last = rows[rows.length - 1]!;
    cursor = { symbol: last.symbol, market: last.market };
    if (rows.length < take) break;
  }

  console.log(`완료 — processed: ${processed}, updated: ${updated}, skipped/failed: ${failed}`);
}

const isMain =
  typeof process.argv[1] === 'string' && process.argv[1].includes('refresh-catalog-market-cap');

if (isMain) {
  main()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
