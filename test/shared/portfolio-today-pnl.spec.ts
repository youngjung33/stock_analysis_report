import { describe, expect, it } from 'vitest';
import {
  aggregatePortfolioTodayPnl,
  computeHoldingTodayPnl,
} from '@sar/shared';

describe('portfolio today pnl', () => {
  it('computes holding today pnl from change percent', () => {
    // 150 vs prev 150/1.05 ≈ 142.857, diff 7.143 * 10
    const pnl = computeHoldingTodayPnl(10, 150, 5);
    expect(pnl).toBeCloseTo(71.43, 1);
  });

  it('aggregates portfolio today pnl and percent', () => {
    const result = aggregatePortfolioTodayPnl([
      { quantity: 10, currentPrice: 150, changePercent: 5 },
      { quantity: 5, currentPrice: 250, changePercent: -2 },
    ]);
    expect(result.todayPnl).not.toBeNull();
    expect(result.todayPnlPercent).not.toBeNull();
  });

  it('returns null when no quote data', () => {
    expect(
      aggregatePortfolioTodayPnl([{ quantity: 1, currentPrice: null, changePercent: 1 }]),
    ).toEqual({ todayPnl: null, todayPnlPercent: null });
  });
});
