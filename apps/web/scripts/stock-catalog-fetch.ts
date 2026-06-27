import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  StockCatalogEntry,
  dedupeCatalogEntries,
  parseKindCorpListHtml,
  parseNasdaqListedTxt,
  parseOtherListedTxt,
} from '@sar/shared';

const NASDAQ_LISTED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt';
const OTHER_LISTED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt';
const KIND_CORP_LIST_URL =
  'https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13';

export const STOCK_CATALOG_DIR = path.resolve(process.cwd(), 'data', 'stock-catalog');
export const STOCK_CATALOG_RAW_DIR = path.join(STOCK_CATALOG_DIR, 'raw');

export async function ensureCatalogDirs(): Promise<void> {
  await mkdir(STOCK_CATALOG_RAW_DIR, { recursive: true });
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function readHashFile(filePath: string): Promise<string | null> {
  try {
    return (await readFile(filePath, 'utf8')).trim();
  } catch {
    return null;
  }
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

/** KIND 다운로드는 EUC-KR HTML */
async function fetchKindHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`다운로드 실패 (${res.status}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return new TextDecoder('euc-kr').decode(buffer);
}

export interface SyncRawFileResult {
  content: string;
  changed: boolean;
}

/** 원본 파일 다운로드 + SHA256 해시 비교 (변경 없으면 재파싱·저장 생략 가능) */
export async function syncRawFile(opts: {
  url: string;
  rawPath: string;
  hashPath: string;
  label: string;
  fetchContent?: (url: string) => Promise<string>;
}): Promise<SyncRawFileResult> {
  const fetchContent = opts.fetchContent ?? fetchText;
  const content = await fetchContent(opts.url);
  const hash = sha256(content);
  const prevHash = await readHashFile(opts.hashPath);

  if (prevHash === hash) {
    try {
      const cached = await readFile(opts.rawPath, 'utf8');
      console.log(`  ${opts.label}: 변경 없음 (hash skip)`);
      return { content: cached, changed: false };
    } catch {
      // hash는 있는데 raw가 없으면 아래에서 저장
    }
  }

  await writeFile(opts.rawPath, content, 'utf8');
  await writeFile(opts.hashPath, `${hash}\n`, 'utf8');
  console.log(`  ${opts.label}: 갱신됨`);
  return { content, changed: true };
}

export async function fetchUsStockCatalog(): Promise<{
  nasdaqTxt: string;
  otherTxt: string;
  entries: StockCatalogEntry[];
  changed: boolean;
}> {
  const nasdaqPath = path.join(STOCK_CATALOG_RAW_DIR, 'nasdaqlisted.txt');
  const otherPath = path.join(STOCK_CATALOG_RAW_DIR, 'otherlisted.txt');

  const [nasdaq, other] = await Promise.all([
    syncRawFile({
      url: NASDAQ_LISTED_URL,
      rawPath: nasdaqPath,
      hashPath: `${nasdaqPath}.sha256`,
      label: 'nasdaqlisted.txt',
    }),
    syncRawFile({
      url: OTHER_LISTED_URL,
      rawPath: otherPath,
      hashPath: `${otherPath}.sha256`,
      label: 'otherlisted.txt',
    }),
  ]);

  const entries = dedupeCatalogEntries([
    ...parseNasdaqListedTxt(nasdaq.content),
    ...parseOtherListedTxt(other.content),
  ]);

  return {
    nasdaqTxt: nasdaq.content,
    otherTxt: other.content,
    entries,
    changed: nasdaq.changed || other.changed,
  };
}

export async function fetchKrStockCatalog(): Promise<{
  html: string;
  entries: StockCatalogEntry[];
  changed: boolean;
}> {
  const rawPath = path.join(STOCK_CATALOG_RAW_DIR, 'kind-corp-list.html');

  const kind = await syncRawFile({
    url: KIND_CORP_LIST_URL,
    rawPath,
    hashPath: `${rawPath}.sha256`,
    label: 'kind-corp-list.html',
    fetchContent: fetchKindHtml,
  });

  const entries = parseKindCorpListHtml(kind.content);
  return { html: kind.content, entries, changed: kind.changed };
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function catalogFingerprint(entries: StockCatalogEntry[]): string {
  return sha256(JSON.stringify(entries));
}

export async function writeJsonIfUnchanged(
  filePath: string,
  entries: StockCatalogEntry[],
  label: string,
): Promise<boolean> {
  const fingerprint = catalogFingerprint(entries);
  const hashPath = `${filePath}.sha256`;
  const prev = await readHashFile(hashPath);

  if (prev === fingerprint) {
    console.log(`  ${label}: 변경 없음 (json hash skip, ${entries.length}종)`);
    return false;
  }

  await writeJson(filePath, entries);
  await writeFile(hashPath, `${fingerprint}\n`, 'utf8');
  console.log(`  ${label}: ${entries.length}종 저장`);
  return true;
}

export async function readJsonEntries(filePath: string): Promise<StockCatalogEntry[]> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StockCatalogEntry[]) : [];
  } catch {
    return [];
  }
}
