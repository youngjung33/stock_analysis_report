import { type FigureStatementSnapshot } from '@sar/shared';

const TTL_MS = 15 * 60 * 1000;
let cache: { snapshots: FigureStatementSnapshot[]; fetchedAt: number } | null = null;

export function getCachedRecommendationFigures(): FigureStatementSnapshot[] | null {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    cache = null;
    return null;
  }
  return cache.snapshots;
}

export function setCachedRecommendationFigures(snapshots: FigureStatementSnapshot[]): void {
  cache = { snapshots, fetchedAt: Date.now() };
}

export function clearRecommendationFiguresCache(): void {
  cache = null;
}
