#!/usr/bin/env tsx
/**
 * 외부 원본 파일(txt/html) → 로컬 json 저장.
 * 원본 SHA256 해시가 같으면 재다운로드 skip, json은 파싱 결과 해시로 skip.
 *
 * 사용:
 *   npm run fetch:stocks
 *
 * - 미국: NASDAQ Trader txt 2개
 * - 한국: KIND 상장법인 HTML 1개 (API 키 불필요)
 */
import path from 'node:path';
import {
  ensureCatalogDirs,
  fetchKrStockCatalog,
  fetchUsStockCatalog,
  readJsonEntries,
  STOCK_CATALOG_DIR,
  writeJson,
  writeJsonIfUnchanged,
} from './stock-catalog-fetch';

async function main() {
  await ensureCatalogDirs();

  console.log('미국 종목 (NASDAQ Trader txt)...');
  const us = await fetchUsStockCatalog();
  const usChanged = await writeJsonIfUnchanged(
    path.join(STOCK_CATALOG_DIR, 'us-stocks.json'),
    us.entries,
    'us-stocks.json',
  );

  console.log('한국 종목 (KIND 상장법인 HTML)...');
  const kr = await fetchKrStockCatalog();
  const krChanged = await writeJsonIfUnchanged(
    path.join(STOCK_CATALOG_DIR, 'kr-stocks.json'),
    kr.entries,
    'kr-stocks.json',
  );

  if (usChanged || krChanged) {
    const usEntries = usChanged
      ? us.entries
      : await readJsonEntries(path.join(STOCK_CATALOG_DIR, 'us-stocks.json'));
    const krEntries = krChanged
      ? kr.entries
      : await readJsonEntries(path.join(STOCK_CATALOG_DIR, 'kr-stocks.json'));
    await writeJson(path.join(STOCK_CATALOG_DIR, 'all-stocks.json'), [...usEntries, ...krEntries]);
    console.log(`  all-stocks.json: ${usEntries.length + krEntries.length}종 저장`);
  } else {
    console.log('  all-stocks.json: 변경 없음 (json hash skip)');
  }

  console.log('');
  console.log(`저장 위치: ${STOCK_CATALOG_DIR}`);
  console.log('Supabase에 넣을 때: docs/stock-catalog-import.md 참고');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
