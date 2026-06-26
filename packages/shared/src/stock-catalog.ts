import { Market } from './enums';
import { resolveYahooSymbol } from './stock-symbol';

/** Supabase / MCP 임포트용 종목 마스터 JSON 한 줄 형식 */
export interface StockCatalogEntry {
  symbol: string;
  name: string;
  market: Market;
  board: string;
  yahooSymbol: string;
}

export interface KrxStockBaseInfoRow {
  ISU_SRT_CD?: string;
  ISU_NM?: string;
  ISU_ABBRV?: string;
}

const US_BOARD_BY_EXCHANGE: Record<string, string> = {
  N: 'NYSE',
  A: 'AMEX',
  P: 'ARCA',
};

function cleanUsSymbol(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  if (!s || s.includes('$') || s.includes('.')) return null;
  return s;
}

/** NASDAQ Trader nasdaqlisted.txt 파싱 */
export function parseNasdaqListedTxt(text: string): StockCatalogEntry[] {
  const results: StockCatalogEntry[] = [];

  for (const line of text.split('\n')) {
    if (!line || line.startsWith('Symbol|') || line.startsWith('File Created')) continue;
    const [symbol, name, , testIssue, , , etf] = line.split('|');
    if (!symbol || testIssue === 'Y' || etf === 'Y') continue;
    const cleaned = cleanUsSymbol(symbol);
    if (!cleaned || !name?.trim()) continue;
    results.push({
      symbol: cleaned,
      name: name.trim(),
      market: Market.US,
      board: 'NASDAQ',
      yahooSymbol: cleaned,
    });
  }

  return results;
}

/** NASDAQ Trader otherlisted.txt 파싱 (NYSE·AMEX 등) */
export function parseOtherListedTxt(text: string): StockCatalogEntry[] {
  const results: StockCatalogEntry[] = [];

  for (const line of text.split('\n')) {
    if (!line || line.startsWith('ACT Symbol|') || line.startsWith('File Created')) continue;
    const [symbol, name, exchange, , etf, , testIssue] = line.split('|');
    if (!symbol || testIssue === 'Y' || etf === 'Y') continue;
    const board = US_BOARD_BY_EXCHANGE[exchange?.trim() ?? ''];
    if (!board) continue;
    const cleaned = cleanUsSymbol(symbol);
    if (!cleaned || !name?.trim()) continue;
    results.push({
      symbol: cleaned,
      name: name.trim(),
      market: Market.US,
      board,
      yahooSymbol: cleaned,
    });
  }

  return results;
}

/** KRX Open API 종목 기본정보 OutBlock_1 파싱 */
export function parseKrxBaseInfoRows(
  rows: KrxStockBaseInfoRow[],
  board: 'KOSPI' | 'KOSDAQ',
): StockCatalogEntry[] {
  const results: StockCatalogEntry[] = [];

  for (const row of rows) {
    const symbol = row.ISU_SRT_CD?.trim();
    const name = (row.ISU_NM ?? row.ISU_ABBRV)?.trim();
    if (!symbol || !name) continue;
    results.push({
      symbol,
      name,
      market: Market.KR,
      board,
      yahooSymbol: resolveYahooSymbol(symbol, Market.KR) ?? `${symbol}.KS`,
    });
  }

  return results;
}

export function dedupeCatalogEntries(entries: StockCatalogEntry[]): StockCatalogEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = `${e.market}:${e.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
