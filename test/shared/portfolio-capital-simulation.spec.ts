import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildRankedPortfolioSimulation } from '@sar/shared';

describe('buildRankedPortfolioSimulation', () => {
  it('returns simulation and built profile from candidate quotes', () => {
    const result = buildRankedPortfolioSimulation({
      cash: { krw: 1_000_000, usd: 0 },
      holdings: [],
      preferences: { targetKrPercent: 70, targetUsPercent: 30, maxSingleWeightPercent: 40 },
      candidateQuotes: [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          currentPrice: 70_000,
          changePercent: 1.2,
        },
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 180,
          changePercent: -0.5,
        },
      ],
      marketContext: {
        macro: [],
        sectors: [],
        indices: [
          { name: 'KOSPI', yahooSymbol: '^KS11', market: Market.KR, changePercent1d: 1.2 },
          { name: 'NASDAQ', yahooSymbol: '^IXIC', market: Market.US, changePercent1d: -0.5 },
        ],
        usdKrwRate: 1300,
        usdKrwChange1d: 0,
      },
      usdKrwRate: 1300,
    });

    expect(result.simulation.actions).toBeDefined();
    expect(result.builtProfile.effectivePercent).toBeGreaterThanOrEqual(0);
    expect(result.insights.recommendations.length).toBeGreaterThan(0);
  });
});
