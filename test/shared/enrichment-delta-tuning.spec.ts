import { describe, expect, it } from 'vitest';
import {
  ENRICHMENT_DELTA_PROFILE_VERSION,
  ENRICHMENT_SCORE_CAPS,
  computeRecommendationBacktestSummary,
  enrichmentScoreCapsSnapshot,
  suggestDeltaTuningHints,
  type RecommendationBatchView,
} from '@sar/shared';

function batch(items: RecommendationBatchView['items']): RecommendationBatchView {
  return {
    id: 'b1',
    runAt: '2026-07-01T00:00:00Z',
    tradingDate: '2026-07-01',
    engineVersion: '1.0.0',
    profileKey: 'global',
    regimes: {},
    items,
  };
}

describe('enrichment-delta-tuning (Phase N+)', () => {
  it('enrichmentScoreCapsSnapshot mirrors ENRICHMENT_SCORE_CAPS', () => {
    expect(enrichmentScoreCapsSnapshot()).toEqual(ENRICHMENT_SCORE_CAPS);
  });

  it('ENRICHMENT_DELTA_PROFILE_VERSION is semver-like', () => {
    expect(ENRICHMENT_DELTA_PROFILE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('suggestDeltaTuningHints warns on negative horizon alpha with enough samples', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: `i${i}`,
      rank: i + 1,
      symbol: 'AAPL',
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
          returnPercent: -2,
          benchmarkReturn: 1,
          alphaVsBenchmark: -3,
        },
      ],
    }));

    const summary = computeRecommendationBacktestSummary([batch(items)]);
    const hints = suggestDeltaTuningHints(summary);
    expect(hints.some((h) => h.hintKey === 'negativeAlphaHorizon')).toBe(true);
  });
});
