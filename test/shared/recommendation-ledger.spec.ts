import { describe, expect, it } from 'vitest';
import {
  computeReturnPercent,
  horizonReady,
  kstTradingDate,
  RECOMMENDATION_HORIZON_DAY_OFFSETS,
} from '@sar/shared';

describe('recommendation-ledger helpers', () => {
  it('computeReturnPercent', () => {
    expect(computeReturnPercent(100, 110)).toBeCloseTo(10, 5);
    expect(computeReturnPercent(100, 90)).toBeCloseTo(-10, 5);
  });

  it('horizonReady respects day offsets', () => {
    const runAt = new Date('2026-01-01T00:00:00Z');
    const before1d = new Date(runAt.getTime() + RECOMMENDATION_HORIZON_DAY_OFFSETS['1d'] * 86400000 - 1000);
    const after1d = new Date(runAt.getTime() + RECOMMENDATION_HORIZON_DAY_OFFSETS['1d'] * 86400000);
    expect(horizonReady(runAt, '1d', before1d)).toBe(false);
    expect(horizonReady(runAt, '1d', after1d)).toBe(true);
  });

  it('kstTradingDate returns YYYY-MM-DD', () => {
    const d = kstTradingDate(new Date('2026-07-24T15:00:00Z'));
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
