import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_DISCLAIMER_KO } from '@sar/shared';
import {
  clearAiInsightMemoryCacheForTests,
  getCachedAiInsight,
  insightCacheExpiresAt,
  setCachedAiInsight,
} from '@/server/data/ai/insight-memory-cache';

const { mockCacheEnabled } = vi.hoisted(() => ({
  mockCacheEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('@/server/data/ai/ai-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/data/ai/ai-config')>();
  return { ...actual, isAiInsightCacheEnabled: mockCacheEnabled };
});

const envelope = {
  schemaVersion: '1.0' as const,
  kind: 'stock' as const,
  locale: 'ko' as const,
  disclaimer: AI_DISCLAIMER_KO,
  meta: {
    providerId: 'gemini',
    model: 'gemini-2.0-flash',
    promptVersion: 'stock-v1',
    latencyMs: 120,
    fromCache: false,
  },
  sections: [{ id: 'stock.summary', title: '요약', body: '본문' }],
};

const baseKey = {
  userId: 'user-1',
  kind: 'stock' as const,
  contextHash: 'hash12345678',
  locale: 'ko' as const,
  promptVersion: 'stock-v1',
};

describe('insight-memory-cache', () => {
  beforeEach(() => {
    clearAiInsightMemoryCacheForTests();
    mockCacheEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    clearAiInsightMemoryCacheForTests();
  });

  it('returns cached insight for same user/kind/hash/locale/prompt', () => {
    setCachedAiInsight(baseKey, envelope);
    const hit = getCachedAiInsight(baseKey);

    expect(hit?.sections[0].body).toBe('본문');
    expect(hit?.meta.fromCache).toBe(true);
    expect(hit?.meta.latencyMs).toBe(0);
  });

  it('returns null when cache disabled', () => {
    mockCacheEnabled.mockReturnValue(false);
    setCachedAiInsight(baseKey, envelope);
    expect(getCachedAiInsight(baseKey)).toBeNull();
  });

  it('misses when contextHash differs', () => {
    setCachedAiInsight({ ...baseKey, contextHash: 'hash-a' }, envelope);
    expect(getCachedAiInsight({ ...baseKey, contextHash: 'hash-b' })).toBeNull();
  });

  it('misses when userId differs', () => {
    setCachedAiInsight(baseKey, envelope);
    expect(getCachedAiInsight({ ...baseKey, userId: 'user-2' })).toBeNull();
  });

  it('misses when locale differs', () => {
    setCachedAiInsight(baseKey, envelope);
    expect(getCachedAiInsight({ ...baseKey, locale: 'en' })).toBeNull();
  });

  it('misses when promptVersion differs', () => {
    setCachedAiInsight(baseKey, envelope);
    expect(getCachedAiInsight({ ...baseKey, promptVersion: 'stock-v2' })).toBeNull();
  });

  it('misses when kind differs', () => {
    setCachedAiInsight(baseKey, envelope);
    expect(getCachedAiInsight({ ...baseKey, kind: 'portfolio' })).toBeNull();
  });

  it('expires at KST day end', () => {
    const expires = insightCacheExpiresAt(new Date('2026-09-14T10:00:00+09:00').getTime());
    expect(new Date(expires).toISOString()).toBe('2026-09-14T15:00:00.000Z');
  });

  it('does not store when cache disabled', () => {
    mockCacheEnabled.mockReturnValue(false);
    setCachedAiInsight(baseKey, envelope);
    mockCacheEnabled.mockReturnValue(true);
    expect(getCachedAiInsight(baseKey)).toBeNull();
  });

  it('returns null for expired entries after KST day rollover', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T23:00:00+09:00'));
    setCachedAiInsight(baseKey, envelope);
    vi.setSystemTime(new Date('2026-09-15T00:00:01+09:00'));
    expect(getCachedAiInsight(baseKey)).toBeNull();
    vi.useRealTimers();
  });

  it('evicts least recently used entry when exceeding 256 entries', () => {
    setCachedAiInsight({ ...baseKey, contextHash: 'hash-0000' }, envelope);
    for (let i = 1; i <= 256; i++) {
      setCachedAiInsight(
        { ...baseKey, contextHash: `hash-${String(i).padStart(4, '0')}` },
        envelope,
      );
    }
    expect(getCachedAiInsight({ ...baseKey, contextHash: 'hash-0000' })).toBeNull();
    expect(getCachedAiInsight({ ...baseKey, contextHash: 'hash-0256' })).not.toBeNull();
  });

  it('keeps re-accessed entry during LRU eviction', () => {
    setCachedAiInsight({ ...baseKey, contextHash: 'hash-0000' }, envelope);
    for (let i = 1; i <= 255; i++) {
      setCachedAiInsight(
        { ...baseKey, contextHash: `hash-${String(i).padStart(4, '0')}` },
        envelope,
      );
    }
    getCachedAiInsight({ ...baseKey, contextHash: 'hash-0000' });
    setCachedAiInsight({ ...baseKey, contextHash: 'hash-0256' }, envelope);
    expect(getCachedAiInsight({ ...baseKey, contextHash: 'hash-0000' })).not.toBeNull();
    expect(getCachedAiInsight({ ...baseKey, contextHash: 'hash-0001' })).toBeNull();
  });
});
