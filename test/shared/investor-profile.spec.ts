import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_TEST_IDS,
  buildInvestorProfile,
  computeCompositePercent,
  createEmptyLedger,
  createDefaultStoredProfile,
  normalizePercentScore,
  rankRecommendationsByTags,
  upsertTestScore,
  type InvestorScoreLedger,
} from '@sar/shared';

function entry(
  testId: (typeof ANALYSIS_TEST_IDS)[number],
  rawScore: number,
  minScore: number,
  maxScore: number,
) {
  return upsertTestScore(createEmptyLedger(), {
    testId,
    rawScore,
    minScore,
    maxScore,
    completedAt: '2026-01-01T00:00:00.000Z',
  });
}

describe('investor profile', () => {
  it('normalizes percentScore with min-max range', () => {
    expect(normalizePercentScore(10, 10, 40)).toBe(0);
    expect(normalizePercentScore(40, 10, 40)).toBe(100);
    expect(normalizePercentScore(25, 10, 40)).toBe(50);
    expect(normalizePercentScore(5, 5, 20)).toBe(0);
    expect(normalizePercentScore(20, 5, 20)).toBe(100);
  });

  it('replaces same testId and accumulates different testIds', () => {
    let ledger = entry('investor-type', 28, 10, 40);
    ledger = upsertTestScore(ledger, {
      testId: 'risk-check',
      rawScore: 10,
      minScore: 5,
      maxScore: 20,
      completedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(Object.keys(ledger.entries)).toHaveLength(2);

    ledger = upsertTestScore(ledger, {
      testId: 'investor-type',
      rawScore: 34,
      minScore: 10,
      maxScore: 40,
      completedAt: '2026-01-03T00:00:00.000Z',
    });
    expect(ledger.entries['investor-type']?.rawScore).toBe(34);
    expect(ledger.entries['risk-check']?.rawScore).toBe(10);
  });

  it('computes weighted composite for partial and full completion', () => {
    const onlyFull = entry('investor-type', 28, 10, 40);
    expect(computeCompositePercent(onlyFull)).toBeCloseTo(60, 5);

    let two: InvestorScoreLedger = entry('investor-type', 28, 10, 40);
    two = upsertTestScore(two, {
      testId: 'risk-check',
      rawScore: 10,
      minScore: 5,
      maxScore: 20,
      completedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(computeCompositePercent(two)).toBeCloseTo((60 * 40 + 33.333 * 20) / 60, 1);

    let all: InvestorScoreLedger = createEmptyLedger();
    for (const [testId, raw, min, max] of [
      ['investor-type', 28, 10, 40],
      ['risk-check', 10, 5, 20],
      ['horizon-goal', 15, 5, 20],
      ['allocation-style', 12, 5, 20],
    ] as const) {
      all = upsertTestScore(all, {
        testId,
        rawScore: raw,
        minScore: min,
        maxScore: max,
        completedAt: '2026-01-01T00:00:00.000Z',
      });
    }
    expect(computeCompositePercent(all)).not.toBeNull();
  });

  it('maps adjustmentPercent to effectivePercent and typeId', () => {
    const stored = createDefaultStoredProfile();
    stored.ledger = entry('investor-type', 28, 10, 40);
    stored.adjustmentPercent = 90;

    const built = buildInvestorProfile(stored);
    expect(built.compositePercent).toBeCloseTo(60, 5);
    expect(built.effectivePercent).toBeCloseTo(54, 5);
    expect(built.typeId).toBeTruthy();
    expect(built.level).toBeGreaterThanOrEqual(1);
    expect(built.preferredTags.length).toBeGreaterThan(0);
  });

  it('uses balanced default when ledger is empty', () => {
    const built = buildInvestorProfile(createDefaultStoredProfile());
    expect(built.compositePercent).toBeNull();
    expect(built.typeId).toBe('balanced');
    expect(built.completedTestCount).toBe(0);
  });

  it('rankRecommendationsByTags prefers matching tags with fallback', () => {
    const recs = [
      { symbol: 'A', tag: 'momentum' as const },
      { symbol: 'B', tag: 'defensive' as const },
      { symbol: 'C', tag: 'watchlist' as const },
    ] as import('@sar/shared').StockRecommendation[];

    const ranked = rankRecommendationsByTags(recs, ['defensive', 'watchlist']);
    expect(ranked[0]?.symbol).toBe('B');
    expect(ranked.map((r) => r.symbol)).toEqual(['B', 'C', 'A']);

    const fallback = rankRecommendationsByTags(recs, ['pullback']);
    expect(fallback.map((r) => r.symbol)).toEqual(['A', 'B', 'C']);
  });
});
