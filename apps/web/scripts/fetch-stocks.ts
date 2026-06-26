#!/usr/bin/env tsx
/**
 * 외부 소스에서 종목 목록을 받아 로컬 txt/json으로 저장합니다.
 * 생성 파일은 git에 올리지 않습니다 (data/stock-catalog/ 는 .gitignore).
 *
 * 사용:
 *   npm run fetch:stocks
 *
 * 한국 종목(KRX)은 KRX_OPEN_API_KEY 환경변수가 필요합니다.
 * https://openapi.krx.co.kr 에서 발급 · 주식(종목 기본정보) 서비스 승인
 */
import path from 'node:path';
import type { StockCatalogEntry } from '@sar/shared';
import {
  ensureCatalogDirs,
  fetchKrStockCatalog,
  fetchUsStockCatalog,
  STOCK_CATALOG_DIR,
  STOCK_CATALOG_RAW_DIR,
  writeJson,
  writeText,
} from './stock-catalog-fetch';

async function main() {
  await ensureCatalogDirs();

  console.log('미국 종목 다운로드 (NASDAQ Trader txt)...');
  const us = await fetchUsStockCatalog();
  await writeText(path.join(STOCK_CATALOG_RAW_DIR, 'nasdaqlisted.txt'), us.nasdaqTxt);
  await writeText(path.join(STOCK_CATALOG_RAW_DIR, 'otherlisted.txt'), us.otherTxt);
  await writeJson(path.join(STOCK_CATALOG_DIR, 'us-stocks.json'), us.entries);
  console.log(`  us-stocks.json: ${us.entries.length}종`);

  let krEntries: StockCatalogEntry[] = [];
  const krxKey = process.env.KRX_OPEN_API_KEY?.trim();

  if (krxKey) {
    console.log('한국 종목 다운로드 (KRX Open API)...');
    try {
      krEntries = await fetchKrStockCatalog(krxKey);
      await writeJson(path.join(STOCK_CATALOG_DIR, 'kr-stocks.json'), krEntries);
      console.log(`  kr-stocks.json: ${krEntries.length}종`);
    } catch (err) {
      console.error('  KRX 다운로드 실패:', err instanceof Error ? err.message : err);
      console.error('  KRX_OPEN_API_KEY · 서비스 승인(종목 기본정보)을 확인하세요.');
    }
  } else {
    console.log('한국 종목: KRX_OPEN_API_KEY 없음 → kr-stocks.json 생략');
    console.log('  openapi.krx.co.kr 에서 키 발급 후 다시 실행하세요.');
  }

  const all = [...us.entries, ...krEntries];
  await writeJson(path.join(STOCK_CATALOG_DIR, 'all-stocks.json'), all);
  console.log(`  all-stocks.json: ${all.length}종`);

  console.log('');
  console.log(`저장 위치: ${STOCK_CATALOG_DIR}`);
  console.log('Supabase에 넣을 때: docs/stock-catalog-import.md 참고');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
