import { describe, expect, it } from 'vitest';
import { dailyChangePercentFromCloses } from '@sar/shared';

describe('dailyChangePercentFromCloses', () => {
  const todaySec = Math.floor(Date.now() / 1000);
  const yesterdaySec = todaySec - 86_400;

  it('uses today bar vs prior bar when last bar is today (ignores mismatched live meta)', () => {
    const change = dailyChangePercentFromCloses([10_000, 10_050, 10_072], {
      livePrice: 18_650,
      lastBarEpochSec: todaySec,
    });
    expect(change).toBeCloseTo(0.219, 2);
  });

  it('uses live vs last session close when last bar is a prior trading day', () => {
    const change = dailyChangePercentFromCloses([100, 101, 102], {
      livePrice: 103,
      lastBarEpochSec: yesterdaySec,
    });
    expect(change).toBeCloseTo(0.980, 2);
  });

  it('uses last two bars when no live price', () => {
    const change = dailyChangePercentFromCloses([100, 101, 102]);
    expect(change).toBeCloseTo(0.990, 2);
  });
});
