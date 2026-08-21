import { describe, expect, it } from 'vitest';
import {
  computeRecommendationBacktestSummary,
  suggestDeltaTuningHints,
  type RecommendationBatchView,
} from '@sar/shared';

function batch(overrides?: Partial<RecommendationBatchView>): RecommendationBatchView {
  return {
    id: 'b1',
    runAt: '2026-07-01T00:00:00Z',
    tradingDate: '2026-07-01',
    engineVersion: '1.0.0',
    profileKey: 'global',
    regimes: {},
    items: [],
    ...overrides,
  };
}

describe('recommendation-backtest (Phase N+)', () => {
  it('computeRecommendationBacktestSummary aggregates horizon stats', () => {
    const summary = computeRecommendationBacktestSummary([
      batch({
        items: [
          {
            id: 'i1',
            rank: 1,
            symbol: 'AAPL',
            market: 'US',
            tag: 'momentum',
            score: 1.2,
            priceAtRun: 100,
            changePercent1d: 1,
            outcomes: [
              {
                id: 'o1',
                horizon: '1w',
                evaluatedAt: '2026-07-08T00:00:00Z',
                returnPercent: 5,
                benchmarkReturn: 2,
                alphaVsBenchmark: 3,
              },
            ],
          },
          {
            id: 'i2',
            rank: 2,
            symbol: 'NVDA',
            market: 'US',
            tag: 'pullback',
            score: 0.9,
            priceAtRun: 200,
            changePercent1d: -1,
            outcomes: [
              {
                id: 'o2',
                horizon: '1w',
                evaluatedAt: '2026-07-08T00:00:00Z',
                returnPercent: -2,
                benchmarkReturn: 2,
                alphaVsBenchmark: -4,
              },
            ],
          },
        ],
      }),
    ]);

    const oneWeek = summary.horizons.find((h) => h.horizon === '1w');
    expect(summary.batchCount).toBe(1);
    expect(summary.itemCount).toBe(2);
    expect(oneWeek?.evaluatedCount).toBe(2);
    expect(oneWeek?.avgReturnPercent).toBeCloseTo(1.5, 5);
    expect(oneWeek?.avgAlphaPercent).toBeCloseTo(-0.5, 5);
    expect(oneWeek?.hitRatePercent).toBeCloseTo(50, 5);
    expect(summary.byTag.some((t) => t.tag === 'momentum' && t.horizon === '1w')).toBe(true);
    expect(summary.coverage.outcomeSlotsTotal).toBe(6);
    expect(summary.coverage.outcomeEvaluatedCount).toBe(2);
    expect(summary.coverage.coveragePercent).toBeCloseTo(33.333, 1);
  });

  it('suggestDeltaTuningHints flags weak tag alpha', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `i${i}`,
      rank: i + 1,
      symbol: 'TSLA',
      market: 'US' as const,
      tag: 'momentum',
      score: 1,
      priceAtRun: 100,
      changePercent1d: 0,
      outcomes: [
        {
          id: `o${i}`,
          horizon: '1w' as const,
          evaluatedAt: '2026-07-08T00:00:00Z',
          returnPercent: -3,
          benchmarkReturn: 1,
          alphaVsBenchmark: -4,
        },
      ],
    }));

    const summary = computeRecommendationBacktestSummary([batch({ items })]);
    const hints = suggestDeltaTuningHints(summary);
    expect(hints.some((h) => h.hintKey === 'tagUnderperform')).toBe(true);
  });
});
