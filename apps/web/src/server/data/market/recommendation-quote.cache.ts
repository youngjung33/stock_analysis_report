import { Market } from '@sar/shared';

export interface CachedRecommendationQuote {
  symbol: string;
  market: Market;
  currentPrice: number;
  changePercent: number | null;
  fetchedAt: number;
}

const TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, CachedRecommendationQuote>();

function cacheKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

export function getCachedRecommendationQuote(
  symbol: string,
  market: Market,
): CachedRecommendationQuote | null {
  const entry = cache.get(cacheKey(symbol, market));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    cache.delete(cacheKey(symbol, market));
    return null;
  }
  return entry;
}

export function setCachedRecommendationQuote(quote: CachedRecommendationQuote): void {
  cache.set(cacheKey(quote.symbol, quote.market), quote);
}

export function clearRecommendationQuoteCache(): void {
  cache.clear();
}
