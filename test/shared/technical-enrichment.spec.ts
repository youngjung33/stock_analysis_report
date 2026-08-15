import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyTechnicalEnrichment,
  buildStockTechnicalSnapshot,
  technicalSymbolKey,
} from '@sar/shared';
import type { MarketContext, RecommendationTag } from '@sar/shared';

function emptyTagScores(): Record<RecommendationTag, number> {
  return { momentum: 0, watchlist: 0, pullback: 0, defensive: 0 };
}

function risingCloses(count: number, start = 100, step = 1): number[] {
  return Array.from({ length: count }, (_, i) => start + i * step);
}

function baseContext(overrides?: Partial<MarketContext>): MarketContext {
  return {
    macro: [],
    sectors: [],
    indices: [],
    regimes: [],
    krSentiment: {
      market: Market.KR,
      label: 'bull',
      headline: '',
      description: '',
      headlineKey: 'k',
      descriptionKey: 'k',
      avgChangePercent: 1,
      upCount: 3,
      downCount: 1,
      flatCount: 0,
    },
    usSentiment: {
      market: Market.US,
      label: 'neutral',
      headline: '',
      description: '',
      headlineKey: 'k',
      descriptionKey: 'k',
      avgChangePercent: 0,
      upCount: 2,
      downCount: 2,
      flatCount: 0,
    },
    leadingKrSectors: [],
    leadingUsSectors: [],
    usdKrwRate: 1300,
    usdKrwChange1d: 0,
    heldSymbols: new Set(),
    watchlistSymbols: new Set(),
    preferredTags: [],
    technicalBySymbol: {},
    newsBySymbol: {},
    eventsBySymbol: {},
    figureStatements: [],
    ...overrides,
  };
}

describe('technical-enrichment (Phase G)', () => {
  it('buildStockTechnicalSnapshot detects short-term uptrend', () => {
    const closes = risingCloses(60, 100, 0.8);
    const snap = buildStockTechnicalSnapshot(
      { symbol: '005930', market: Market.KR, closes, highs: closes, lows: closes },
      0.5,
    );
    expect(snap?.trendKey).toBe('shared.market.trends.shortTermUp');
    expect(snap?.aboveSma20).toBe(true);
  });

  it('applyTechnicalEnrichment adds CH_TECH trendUp on shortTermUp', () => {
    const tagScores = emptyTagScores();
    const snap = {
      symbol: 'AAPL',
      market: Market.US,
      trendKey: 'shared.market.trends.shortTermUp',
      rsi14: 55,
      rsVsBenchmark1w: null,
      aboveSma20: true,
      aboveSma200: true,
    };
    const breakdown = applyTechnicalEnrichment(tagScores, snap, baseContext(), Market.US);
    expect(tagScores.momentum).toBeCloseTo(0.28, 8);
    expect(breakdown.some((b) => b.factor === 'CH_TECH:trendUp')).toBe(true);
  });

  it('RSI oversold adds pullback CH_TECH delta', () => {
    const tagScores = emptyTagScores();
    const breakdown = applyTechnicalEnrichment(
      tagScores,
      {
        symbol: 'MSFT',
        market: Market.US,
        trendKey: 'shared.market.trends.mixed',
        rsi14: 25,
        rsVsBenchmark1w: null,
        aboveSma20: false,
        aboveSma200: true,
      },
      baseContext(),
      Market.US,
    );
    expect(tagScores.pullback).toBeCloseTo(0.15, 8);
    expect(breakdown.some((b) => b.factor === 'CH_TECH:rsiOversold')).toBe(true);
  });

  it('rsVsBenchmark1w > 2 adds momentum via CH_TECH', () => {
    const tagScores = emptyTagScores();
    applyTechnicalEnrichment(
      tagScores,
      {
        symbol: 'NVDA',
        market: Market.US,
        trendKey: 'shared.market.trends.mixed',
        rsi14: 50,
        rsVsBenchmark1w: 3.5,
        aboveSma20: true,
        aboveSma200: true,
      },
      baseContext(),
      Market.US,
    );
    expect(tagScores.momentum).toBeCloseTo(0.2, 8);
  });

  it('technicalSymbolKey normalizes case', () => {
    expect(technicalSymbolKey('aapl', Market.US)).toBe('US:AAPL');
  });
});
