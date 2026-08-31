import { describe, expect, it } from 'vitest';
import { Market, buildSectorSnapshot } from '@sar/shared';

describe('buildSectorSnapshot changePercent1d', () => {
  it('computes 1d change from close series (same basis as 1w)', () => {
    const snapshot = buildSectorSnapshot({
      yahooSymbol: '091160.KS',
      name: 'KODEX 반도체',
      sectorLabel: '반도체',
      market: Market.KR,
      closes: [10_000, 10_010, 10_020, 10_030, 10_040, 10_072],
      changePercent1d: 85.06,
      chartUrl: 'https://finance.yahoo.com/quote/091160.KS/',
      benchmarkCloses: [10_000, 10_005, 10_010, 10_015, 10_020, 10_030],
    });

    expect(snapshot?.changePercent1d).toBeCloseTo(0.319, 2);
  });
});
