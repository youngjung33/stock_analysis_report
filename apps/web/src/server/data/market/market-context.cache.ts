import type { BuiltMarketContextData } from '../../domain/usecases/market/build-market-context.use-case';

const DEFAULT_TTL_MS = 45_000;

function readTtlMs(): number {
  const raw = Number(process.env.MARKET_CONTEXT_CACHE_TTL_MS ?? DEFAULT_TTL_MS);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_TTL_MS;
  return raw;
}

let cached: { data: BuiltMarketContextData; fetchedAt: number } | null = null;
let inFlight: Promise<BuiltMarketContextData> | null = null;

export function getCachedMarketContext(): BuiltMarketContextData | null {
  const ttl = readTtlMs();
  if (ttl === 0 || !cached) return null;
  if (Date.now() - cached.fetchedAt > ttl) {
    cached = null;
    return null;
  }
  return cached.data;
}

export function setCachedMarketContext(data: BuiltMarketContextData): void {
  if (readTtlMs() === 0) return;
  cached = { data, fetchedAt: Date.now() };
}

export function getMarketContextInFlight(): Promise<BuiltMarketContextData> | null {
  return inFlight;
}

export function setMarketContextInFlight(
  promise: Promise<BuiltMarketContextData> | null,
): void {
  inFlight = promise;
}

export function clearMarketContextCacheForTests(): void {
  cached = null;
  inFlight = null;
}
