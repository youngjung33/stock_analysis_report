import {
  GUEST_BASELINE_FALLBACK_SYMBOLS,
  MAX_CANDIDATES_PER_MARKET,
  Market,
} from '@sar/shared';
import { IStockCatalogRepository } from '../../repositories';

const MIN_CATALOG_ROWS = 5;

export type GuestBaselineRow = {
  symbol: string;
  market: Market;
  name: string;
  yahooSymbol?: string;
};

/** Catalog 시총 상위 + fallback 심볼 (비회원·cron baseline) */
export async function resolveGuestBaselineSymbols(
  catalogRepo: IStockCatalogRepository,
): Promise<GuestBaselineRow[]> {
  const [krTop, usTop] = await Promise.all([
    catalogRepo.listTopByMarketCap(Market.KR, MAX_CANDIDATES_PER_MARKET),
    catalogRepo.listTopByMarketCap(Market.US, MAX_CANDIDATES_PER_MARKET),
  ]);

  return [
    ...mergeMarketBaseline(Market.KR, krTop, GUEST_BASELINE_FALLBACK_SYMBOLS[Market.KR]),
    ...mergeMarketBaseline(Market.US, usTop, GUEST_BASELINE_FALLBACK_SYMBOLS[Market.US]),
  ];
}

function mergeMarketBaseline(
  market: Market,
  catalogRows: GuestBaselineRow[],
  fallbackSymbols: readonly string[],
): GuestBaselineRow[] {
  const out: GuestBaselineRow[] = [];
  const seen = new Set<string>();

  for (const row of catalogRows) {
    const key = row.symbol.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= MAX_CANDIDATES_PER_MARKET) return out;
  }

  if (seen.size >= MIN_CATALOG_ROWS) return out;

  for (const symbol of fallbackSymbols) {
    const key = symbol.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ symbol, market, name: symbol });
    if (out.length >= MAX_CANDIDATES_PER_MARKET) break;
  }

  return out;
}
