import type { AiAnalysisKind, AiInsightEnvelope, SupportedLocale } from '@sar/shared';
import { kstDayBounds } from './kst-day-bounds';
import { isAiInsightCacheEnabled } from './ai-config';

const MAX_ENTRIES = 256;

interface CacheEntry {
  envelope: AiInsightEnvelope;
  expiresAt: number;
  lastAccess: number;
}

const store = new Map<string, CacheEntry>();

export function insightCacheExpiresAt(now = Date.now()): number {
  return kstDayBounds(new Date(now)).end.getTime();
}

function cacheKey(input: {
  userId: string;
  kind: AiAnalysisKind;
  contextHash: string;
  locale: SupportedLocale;
  promptVersion: string;
}): string {
  return `${input.userId}:${input.kind}:${input.contextHash}:${input.locale}:${input.promptVersion}`;
}

function purgeExpired(now = Date.now()): void {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

function evictIfNeeded(): void {
  if (store.size < MAX_ENTRIES) return;
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;
  for (const [key, entry] of store) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }
  if (oldestKey) store.delete(oldestKey);
}

export function getCachedAiInsight(input: {
  userId: string;
  kind: AiAnalysisKind;
  contextHash: string;
  locale: SupportedLocale;
  promptVersion: string;
}): AiInsightEnvelope | null {
  if (!isAiInsightCacheEnabled()) return null;

  const now = Date.now();
  purgeExpired(now);
  const key = cacheKey(input);
  const entry = store.get(key);
  if (!entry || entry.expiresAt <= now) {
    store.delete(key);
    return null;
  }

  entry.lastAccess = now;
  return {
    ...entry.envelope,
    meta: {
      ...entry.envelope.meta,
      fromCache: true,
      latencyMs: 0,
    },
  };
}

export function setCachedAiInsight(
  input: {
    userId: string;
    kind: AiAnalysisKind;
    contextHash: string;
    locale: SupportedLocale;
    promptVersion: string;
  },
  envelope: AiInsightEnvelope,
): void {
  if (!isAiInsightCacheEnabled()) return;

  purgeExpired();
  evictIfNeeded();

  const stored: AiInsightEnvelope = {
    ...envelope,
    meta: {
      ...envelope.meta,
      fromCache: false,
    },
  };

  store.set(cacheKey(input), {
    envelope: stored,
    expiresAt: insightCacheExpiresAt(),
    lastAccess: Date.now(),
  });
}

export function clearAiInsightMemoryCacheForTests(): void {
  store.clear();
}
