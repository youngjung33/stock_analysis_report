import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyNarrativeEnrichment,
  computeNarrativeDivergence,
} from '@sar/shared';
import type { RecommendationTag, StockNewsSnapshot } from '@sar/shared';

function emptyTagScores(): Record<RecommendationTag, number> {
  return { momentum: 0, watchlist: 0, pullback: 0, defensive: 0 };
}

function newsSnap(overrides: Partial<StockNewsSnapshot> & Pick<StockNewsSnapshot, 'tone'>): StockNewsSnapshot {
  return {
    symbol: 'AAPL',
    market: Market.US,
    relevanceScore: 0.5,
    articleCount: 2,
    headlineSample: 'AAPL gains on demand',
    primarySourceCount: 0,
    secondarySourceCount: 2,
    dedupeKey: 'news:AAPL:sample',
    ...overrides,
  };
}

describe('narrative-enrichment (Phase H′)', () => {
  it('computeNarrativeDivergence detects bullish_news_price_down', () => {
    const narrative = computeNarrativeDivergence({
      news: newsSnap({ tone: 'bullish' }),
      technical: null,
      changePercent1d: -1.2,
    });
    expect(narrative?.divergence).toBe('bullish_news_price_down');
    expect(narrative?.newsWeightMultiplier).toBe(0);
  });

  it('computeNarrativeDivergence detects crowded_bullish', () => {
    const narrative = computeNarrativeDivergence({
      news: newsSnap({ tone: 'bullish', articleCount: 4 }),
      technical: { symbol: 'AAPL', market: Market.US, trendKey: 'k', rsi14: 55, rsVsBenchmark1w: null, aboveSma20: true, aboveSma200: true },
      changePercent1d: 0.8,
    });
    expect(narrative?.divergence).toBe('crowded_bullish');
    expect(narrative?.newsWeightMultiplier).toBe(0.3);
  });

  it('applyNarrativeEnrichment adds contrarian on bearish_news_price_up', () => {
    const tagScores = emptyTagScores();
    const narrative = computeNarrativeDivergence({
      news: newsSnap({ tone: 'bearish' }),
      technical: null,
      changePercent1d: 1.5,
    });
    expect(narrative?.divergence).toBe('bearish_news_price_up');

    const breakdown = applyNarrativeEnrichment(tagScores, narrative!, null);
    expect(breakdown.some((b) => b.factor.startsWith('CH_NARRATIVE:'))).toBe(true);
    expect(tagScores.momentum).toBeGreaterThan(0);
  });

  it('applyNarrativeEnrichment records zero delta for bullish_news_price_down', () => {
    const tagScores = emptyTagScores();
    const narrative = computeNarrativeDivergence({
      news: newsSnap({ tone: 'bullish' }),
      technical: null,
      changePercent1d: -2,
    })!;

    const breakdown = applyNarrativeEnrichment(tagScores, narrative, null);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].delta).toBe(0);
    expect(breakdown[0].evidenceParams?.divergence).toBe('bullish_news_price_down');
  });
});
