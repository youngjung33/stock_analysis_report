import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildDashboardFromRawHoldings } from '@sar/shared';

describe('buildDashboardFromRawHoldings', () => {
  it('builds empty guest dashboard with zero defaults', () => {
    const result = buildDashboardFromRawHoldings({
      rawHoldings: [],
      cashBalances: { krw: 1_000_000, usd: 0 },
      usdKrwRate: null,
      hasAllQuotes: true,
      zeroWhenEmpty: true,
    });

    expect(result.summary.holdingsCount).toBe(0);
    expect(result.summary.todayPnl).toBe(0);
    expect(result.summary.cashKrw).toBe(1_000_000);
    expect(result.summary.cashTotalKrw).toBe(1_000_000);
  });

  it('computes weights for holdings', () => {
    const result = buildDashboardFromRawHoldings({
      rawHoldings: [
        {
          stockId: 's1',
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          quantity: 10,
          averageCost: 70000,
          currentPrice: 80000,
          changePercent: 1,
          marketValue: 800_000,
          unrealizedPnl: 100_000,
          unrealizedPnlPercent: 14.3,
          realizedPnl: 0,
          costBasis: 700_000,
        },
      ],
      cashBalances: { krw: 0, usd: 0 },
      usdKrwRate: null,
      hasAllQuotes: true,
    });

    expect(result.holdings).toHaveLength(1);
    expect(result.holdings[0]?.weightPercent).toBe(100);
    expect(result.summary.totalMarketValue).toBe(800_000);
  });
});
