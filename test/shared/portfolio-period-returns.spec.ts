import { describe, expect, it } from 'vitest';
import {
  computeMaxTotalReturn,
  computeWeightedPeriodReturn,
  periodReturnFromCloses,
} from '@sar/shared';

describe('portfolio period returns', () => {
  it('computes weighted portfolio return', () => {
    const result = computeWeightedPeriodReturn([
      { weightPercent: 60, returnPercent: 10 },
      { weightPercent: 40, returnPercent: 5 },
    ]);
    expect(result.returnPercent).toBeCloseTo(8, 5);
    expect(result.coveragePercent).toBe(100);
  });

  it('computes max total return from krw values', () => {
    const ret = computeMaxTotalReturn(1_200_000, 1_000_000, 50_000);
    expect(ret).toBeCloseTo(25, 5);
  });

  it('computes period return from closes', () => {
    const closes = [100, 110, 120];
    expect(periodReturnFromCloses(closes, '1mo')).toBeCloseTo(20, 5);
  });
});
