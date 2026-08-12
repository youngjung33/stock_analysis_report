import { Market, type StockTechnicalSnapshot } from '@sar/shared';

const TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { snapshot: StockTechnicalSnapshot; fetchedAt: number }>();

function cacheKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

export function getCachedRecommendationTechnical(
  symbol: string,
  market: Market,
): StockTechnicalSnapshot | null {
  const entry = cache.get(cacheKey(symbol, market));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    cache.delete(cacheKey(symbol, market));
    return null;
  }
  return entry.snapshot;
}

export function setCachedRecommendationTechnical(snapshot: StockTechnicalSnapshot): void {
  cache.set(cacheKey(snapshot.symbol, snapshot.market), {
    snapshot,
    fetchedAt: Date.now(),
  });
}

export function clearRecommendationTechnicalCache(): void {
  cache.clear();
}
