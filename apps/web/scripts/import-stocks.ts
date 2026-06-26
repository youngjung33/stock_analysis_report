#!/usr/bin/env tsx
/**
 * 로컬 JSON 파일 → Supabase(PostgreSQL) StockCatalog 테이블 임포트.
 * fetch:stocks 로 만든 파일 또는 직접 준비한 JSON을 읽습니다.
 *
 * 사용:
 *   npm run db:import-stocks
 *   npm run db:import-stocks -- --file data/stock-catalog/kr-stocks.json
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { Market, StockCatalogEntry } from '@sar/shared';
import { STOCK_CATALOG_DIR } from './stock-catalog-fetch';

const prisma = new PrismaClient();
const BATCH = 500;

function parseArgs(): { files: string[] } {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf('--file');
  if (fileIdx >= 0 && args[fileIdx + 1]) {
    return { files: [path.resolve(args[fileIdx + 1])] };
  }

  return {
    files: [
      path.join(STOCK_CATALOG_DIR, 'all-stocks.json'),
      path.join(STOCK_CATALOG_DIR, 'kr-stocks.json'),
      path.join(STOCK_CATALOG_DIR, 'us-stocks.json'),
    ],
  };
}

function isCatalogEntry(value: unknown): value is StockCatalogEntry {
  if (!value || typeof value !== 'object') return false;
  const row = value as StockCatalogEntry;
  return (
    typeof row.symbol === 'string' &&
    typeof row.name === 'string' &&
    (row.market === Market.KR || row.market === Market.US) &&
    typeof row.board === 'string' &&
    typeof row.yahooSymbol === 'string'
  );
}

async function loadEntries(filePath: string): Promise<StockCatalogEntry[]> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('JSON 배열이 아닙니다.');
    }
    const entries = parsed.filter(isCatalogEntry);
    console.log(`  ${filePath}: ${entries.length}종`);
    return entries;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`  ${filePath}: 파일 없음 (건너뜀)`);
      return [];
    }
    throw err;
  }
}

async function upsertBatch(entries: StockCatalogEntry[]): Promise<void> {
  const now = new Date();
  await prisma.$transaction(
    entries.map((entry) =>
      prisma.stockCatalog.upsert({
        where: {
          symbol_market: { symbol: entry.symbol, market: entry.market },
        },
        create: {
          symbol: entry.symbol,
          name: entry.name,
          market: entry.market,
          board: entry.board,
          yahooSymbol: entry.yahooSymbol,
          isActive: true,
          syncedAt: now,
        },
        update: {
          name: entry.name,
          board: entry.board,
          yahooSymbol: entry.yahooSymbol,
          isActive: true,
          syncedAt: now,
        },
      }),
    ),
  );
}

async function main() {
  const { files } = parseArgs();
  const seen = new Set<string>();
  const entries: StockCatalogEntry[] = [];

  console.log('JSON 파일 읽기...');
  for (const file of files) {
    for (const entry of await loadEntries(file)) {
      const key = `${entry.market}:${entry.symbol}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }
  }

  if (entries.length === 0) {
    console.error('임포트할 종목이 없습니다. 먼저 npm run fetch:stocks 를 실행하세요.');
    process.exit(1);
  }

  console.log(`총 ${entries.length}종 DB upsert...`);
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    await upsertBatch(batch);
    console.log(`  ${Math.min(i + BATCH, entries.length)} / ${entries.length}`);
  }

  const count = await prisma.stockCatalog.count();
  console.log(`완료. StockCatalog ${count}행`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
