import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  StockCatalogEntry,
  dedupeCatalogEntries,
  parseKrxBaseInfoRows,
  parseNasdaqListedTxt,
  parseOtherListedTxt,
} from '@sar/shared';

const NASDAQ_LISTED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt';
const OTHER_LISTED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt';
const KRX_BASE_URL = 'https://data-dbg.krx.co.kr';

export const STOCK_CATALOG_DIR = path.resolve(process.cwd(), 'data', 'stock-catalog');
export const STOCK_CATALOG_RAW_DIR = path.join(STOCK_CATALOG_DIR, 'raw');

export async function ensureCatalogDirs(): Promise<void> {
  await mkdir(STOCK_CATALOG_RAW_DIR, { recursive: true });
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`다운로드 실패 (${res.status}): ${url}`);
  }
  return res.text();
}

async function fetchKrxBaseInfo(
  apiKey: string,
  endpoint: string,
): Promise<Record<string, string>[]> {
  const res = await fetch(`${KRX_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      AUTH_KEY: apiKey,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`KRX API 실패 (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { OutBlock_1?: Record<string, string>[] };
  return json.OutBlock_1 ?? [];
}

export async function fetchUsStockCatalog(): Promise<{
  nasdaqTxt: string;
  otherTxt: string;
  entries: StockCatalogEntry[];
}> {
  const [nasdaqTxt, otherTxt] = await Promise.all([
    fetchText(NASDAQ_LISTED_URL),
    fetchText(OTHER_LISTED_URL),
  ]);

  const entries = dedupeCatalogEntries([
    ...parseNasdaqListedTxt(nasdaqTxt),
    ...parseOtherListedTxt(otherTxt),
  ]);

  return { nasdaqTxt, otherTxt, entries };
}

export async function fetchKrStockCatalog(apiKey: string): Promise<StockCatalogEntry[]> {
  const [kospiRows, kosdaqRows] = await Promise.all([
    fetchKrxBaseInfo(apiKey, '/svc/apis/sto/stk_isu_base_info'),
    fetchKrxBaseInfo(apiKey, '/svc/apis/sto/ksq_isu_base_info'),
  ]);

  return dedupeCatalogEntries([
    ...parseKrxBaseInfoRows(kospiRows, 'KOSPI'),
    ...parseKrxBaseInfoRows(kosdaqRows, 'KOSDAQ'),
  ]);
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function writeText(filePath: string, data: string): Promise<void> {
  await writeFile(filePath, data, 'utf8');
}
