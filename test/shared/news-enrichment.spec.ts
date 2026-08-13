import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyNewsEnrichment,
  buildStockNewsSnapshot,
  indexNewsSnapshots,
  technicalSymbolKey,
} from '@sar/shared';
import type { RecommendationTag } from '@sar/shared';

function emptyTagScores(): Record<RecommendationTag, number> {
  return { momentum: 0, watchlist: 0, pullback: 0, defensive: 0 };
}

function recentIso(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

describe('news-enrichment (Phase H)', () => {
  it('buildStockNewsSnapshot filters stale articles', () => {
    const snap = buildStockNewsSnapshot({
      symbol: '005930',
      market: Market.KR,
      name: '삼성전자',
      articles: [
        { title: '삼성전자 주가 상승', publishedAt: recentIso(10), source: 'rss' },
      ],
    });
    expect(snap).toBeNull();
  });

  it('buildStockNewsSnapshot sets relevance when title matches symbol', () => {
    const snap = buildStockNewsSnapshot({
      symbol: 'AAPL',
      market: Market.US,
      name: 'Apple',
      articles: [
        { title: 'AAPL gains on strong demand', publishedAt: recentIso(0), source: 'finnhub' },
        { title: 'Tech sector outlook improves', publishedAt: recentIso(1), source: 'rss' },
      ],
    });
    expect(snap?.relevanceScore).toBeGreaterThanOrEqual(0.5);
    expect(snap?.articleCount).toBe(2);
    expect(snap?.tone).toBe('bullish');
  });

  it('applyNewsEnrichment adds CH_NEWS momentum on bullish secondary headlines', () => {
    const tagScores = emptyTagScores();
    const snap = buildStockNewsSnapshot({
      symbol: '005930',
      market: Market.KR,
      name: '삼성전자',
      articles: [
        { title: '005930 급등, 시장 낙관', publishedAt: recentIso(0), source: 'rss' },
        { title: '005930 거래량 증가', publishedAt: recentIso(1), source: 'rss' },
      ],
    });
    expect(snap).not.toBeNull();

    const breakdown = applyNewsEnrichment(tagScores, snap!, 0.5);
    expect(breakdown.some((b) => b.factor === 'CH_NEWS:bullishMomentum')).toBe(true);
    expect(tagScores.momentum).toBeGreaterThan(0);
  });

  it('applyNewsEnrichment skips primary earnings headlines (Phase I delegation)', () => {
    const tagScores = emptyTagScores();
    const snap = buildStockNewsSnapshot({
      symbol: 'MSFT',
      market: Market.US,
      name: 'Microsoft',
      articles: [
        { title: 'MSFT beats earnings estimates', publishedAt: recentIso(0), source: 'finnhub' },
      ],
    });
    expect(snap).not.toBeNull();

    const breakdown = applyNewsEnrichment(tagScores, snap!, 1);
    expect(breakdown).toHaveLength(0);
  });

  it('applyNewsEnrichment records divergence when bullish news meets price drop', () => {
    const tagScores = emptyTagScores();
    const snap = buildStockNewsSnapshot({
      symbol: 'NVDA',
      market: Market.US,
      name: 'NVIDIA',
      articles: [
        { title: 'NVDA 급등 전망', publishedAt: recentIso(0), source: 'rss' },
        { title: 'NVDA 수요 호재', publishedAt: recentIso(1), source: 'rss' },
      ],
    });
    expect(snap).not.toBeNull();

    const breakdown = applyNewsEnrichment(tagScores, snap!, -1.2);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].delta).toBe(0);
    expect(breakdown[0].evidenceParams?.divergence).toBe('bullish_news_price_down');
  });

  it('indexNewsSnapshots keys by market:symbol', () => {
    const snap = buildStockNewsSnapshot({
      symbol: 'tsla',
      market: Market.US,
      name: 'Tesla',
      articles: [
        { title: 'TSLA 하락, 실적 우려', publishedAt: recentIso(0), source: 'rss' },
        { title: 'TSLA 배송량 이슈', publishedAt: recentIso(1), source: 'rss' },
      ],
    });
    expect(snap).not.toBeNull();

    const map = indexNewsSnapshots([snap!]);
    expect(map[technicalSymbolKey('TSLA', Market.US)]).toBeDefined();
  });
});
