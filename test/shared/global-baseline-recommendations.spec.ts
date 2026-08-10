import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildGlobalBaselineRecommendations } from '@sar/shared';

const krQuotes = [
  {
    symbol: '005930',
    name: 'Samsung',
    market: Market.KR,
    currency: 'KRW',
    currentPrice: 70000,
    changePercent: 1.2,
  },
];

const usQuotes = [
  {
    symbol: 'AAPL',
    name: 'Apple',
    market: Market.US,
    currency: 'USD',
    currentPrice: 200,
    changePercent: 0.5,
  },
];

describe('buildGlobalBaselineRecommendations', () => {
  it('returns recommendations without user holdings', () => {
    const result = buildGlobalBaselineRecommendations({
      featuredKr: krQuotes,
      featuredUs: usQuotes,
      marketContext: {
        macro: [],
        sectors: [],
        indices: [],
        usdKrwRate: 1300,
        usdKrwChange1d: 0.1,
      },
      maxRecommendations: 4,
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.every((r) => r.currentPrice > 0)).toBe(true);
    expect(result.regimes).toBeDefined();
  });
});
