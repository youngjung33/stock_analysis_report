import type { Market } from './enums';

export interface MarketPersonalizationScope {
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
}

/** Stable React Query key segment for holdings/watchlist personalization */
export function buildMarketPersonalizationScopeKey(scope?: MarketPersonalizationScope): string {
  if (!scope?.userHoldings?.length && !scope?.userWatchlist?.length) {
    return 'global';
  }
  const parts: string[] = [];
  for (const h of scope.userHoldings ?? []) {
    parts.push(`h:${h.market}:${h.symbol.toUpperCase()}`);
  }
  for (const w of scope.userWatchlist ?? []) {
    parts.push(`w:${w.market}:${w.symbol.toUpperCase()}`);
  }
  parts.sort();
  return parts.join('|');
}
