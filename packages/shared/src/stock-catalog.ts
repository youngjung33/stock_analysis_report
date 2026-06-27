import { Market } from './enums';

/** Supabase / MCP 임포트용 종목 마스터 JSON 한 줄 형식 */
export interface StockCatalogEntry {
  symbol: string;
  name: string;
  market: Market;
  board: string;
  yahooSymbol: string;
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

function stripHtmlCell(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKindTableRows(html: string): string[][] {
  const rows: string[][] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRegex.exec(html)) !== null) {
    const cells: string[] = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
      cells.push(stripHtmlCell(tdMatch[1]));
    }
    if (cells.length >= 3) rows.push(cells);
  }

  return rows;
}

function mapKindBoard(marketType: string): 'KOSPI' | 'KOSDAQ' | null {
  const normalized = marketType.replace(/\s/g, '').toLowerCase();
  if (
    normalized.includes('코스피') ||
    normalized === 'kospi' ||
    normalized.includes('유가')
  ) {
    return 'KOSPI';
  }
  if (normalized.includes('코스닥') || normalized === 'kosdaq') return 'KOSDAQ';
  return null;
}

function normalizeKrSymbol(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed.padStart(6, '0');
  return trimmed.toUpperCase();
}

/** KIND 상장법인 목록 HTML (엑셀 다운로드) 파싱 — 코스피·코스닥만 */
export function parseKindCorpListHtml(html: string): StockCatalogEntry[] {
  const results: StockCatalogEntry[] = [];

  for (const cells of extractKindTableRows(html)) {
    const name = cells[0]?.trim();
    const board = mapKindBoard(cells[1] ?? '');
    const symbol = normalizeKrSymbol(cells[2] ?? '');
    if (!name || !board || !symbol) continue;

    const yahooSymbol =
      board === 'KOSDAQ' ? `${symbol.replace(/\.(KS|KQ)$/i, '')}.KQ` : `${symbol.replace(/\.(KS|KQ)$/i, '')}.KS`;

    results.push({
      symbol: symbol.replace(/\.(KS|KQ)$/i, ''),
      name,
      market: Market.KR,
      board,
      yahooSymbol,
    });
  }

  return dedupeCatalogEntries(results);
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
