import { Market, type StockNewsSnapshot } from '@sar/shared';

const TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { snapshot: StockNewsSnapshot; fetchedAt: number }>();

function cacheKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

export function getCachedRecommendationNews(
  symbol: string,
  market: Market,
): StockNewsSnapshot | null {
  const entry = cache.get(cacheKey(symbol, market));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    cache.delete(cacheKey(symbol, market));
    return null;
  }
  return entry.snapshot;
}

export function setCachedRecommendationNews(snapshot: StockNewsSnapshot): void {
  cache.set(cacheKey(snapshot.symbol, snapshot.market), {
    snapshot,
    fetchedAt: Date.now(),
  });
}

export function clearRecommendationNewsCache(): void {
  cache.clear();
}
