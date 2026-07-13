import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildPortfolioSimulation } from '@sar/shared';

describe('buildPortfolioSimulation', () => {
  it('suggests add when cash available and market underweight', () => {
    const result = buildPortfolioSimulation({
      cash: { krw: 5_000_000, usd: 0 },
      holdings: [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          quantity: 10,
          currentPrice: 70000,
          marketValueKrw: 700_000,
          weightPercent: 100,
        },
      ],
      preferences: {
        targetKrPercent: 70,
        targetUsPercent: 30,
        maxSingleWeightPercent: 40,
      },
      recommendations: [
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 180,
          changePercent: -1.2,
          tag: 'pullback',
          tagLabel: '조정 구간',
          reason: '테스트',
        },
      ],
      usdKrwRate: 1300,
    });

    expect(result.totalAssetsKrw).toBeGreaterThan(5_000_000);
    expect(result.actions.some((a) => a.type === 'trim')).toBe(true);
    expect(result.actions.some((a) => a.type === 'add' || a.type === 'reserve_cash')).toBe(true);
  });

  it('prompts capital setup when no cash and no holdings', () => {
    const result = buildPortfolioSimulation({
      cash: { krw: 0, usd: 0 },
      holdings: [],
      preferences: {
        targetKrPercent: 70,
        targetUsPercent: 30,
        maxSingleWeightPercent: 40,
      },
      recommendations: [],
      usdKrwRate: null,
    });

    expect(result.headline).toContain('자본금');
  });
});
