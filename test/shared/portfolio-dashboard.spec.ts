import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildDashboardFromRawHoldings, normalizeDashboardSummary } from '@sar/shared';

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

  it('normalizeDashboardSummary coalesces null KRW totals to zero', () => {
    const normalized = normalizeDashboardSummary({
      totalCostBasis: 0,
      totalMarketValue: null,
      totalUnrealizedPnl: null,
      totalRealizedPnl: 0,
      holdingsCount: 0,
      todayPnl: null,
      todayPnlPercent: null,
      totalCostBasisKrw: null,
      totalMarketValueKrw: null,
      totalUnrealizedPnlKrw: null,
      totalRealizedPnlKrw: null,
      todayPnlKrw: null,
      todayPnlPercentKrw: null,
      usdKrwRate: null,
      hasUsdHoldings: false,
      allocationByMarket: { krPercent: 0, usPercent: 0 },
      cashKrw: 0,
      cashUsd: 0,
      cashTotalKrw: 0,
      totalAssetsKrw: null,
      cashPercent: null,
      investedPercent: null,
    });

    expect(normalized.totalCostBasisKrw).toBe(0);
    expect(normalized.totalRealizedPnlKrw).toBe(0);
  });
});
