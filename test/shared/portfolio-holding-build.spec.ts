import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  buildHoldingWithKrw,
  buildRawDashboardHolding,
  nextQuoteRefreshState,
} from '@sar/shared';

describe('portfolio-holding-build', () => {
  it('nextQuoteRefreshState tracks latest fetchedAt and missing quotes', () => {
    let state = nextQuoteRefreshState(
      { lastRefreshedAt: null, hasAllQuotes: true },
      { currentPrice: 100, changePercent: 1, fetchedAt: '2026-01-01T00:00:00.000Z' },
    );
    expect(state.hasAllQuotes).toBe(true);
    expect(state.lastRefreshedAt).toBe('2026-01-01T00:00:00.000Z');

    state = nextQuoteRefreshState(state, null);
    expect(state.hasAllQuotes).toBe(false);

    state = nextQuoteRefreshState(state, {
      currentPrice: 110,
      changePercent: 2,
      fetchedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(state.lastRefreshedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('buildRawDashboardHolding returns null for flat position', () => {
    const result = buildRawDashboardHolding({
      stockId: 's1',
      symbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      currency: 'KRW',
      position: { quantity: 0, averageCost: 0, costBasis: 0, realizedPnl: 0 },
      quote: { currentPrice: 80000, changePercent: 1 },
    });
    expect(result).toBeNull();
  });

  it('buildHoldingWithKrw enriches USD holding', () => {
    const raw = buildRawDashboardHolding({
      stockId: 's2',
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
      currency: 'USD',
      position: { quantity: 2, averageCost: 100, costBasis: 200, realizedPnl: 0 },
      quote: { currentPrice: 120, changePercent: 2 },
    })!;

    const holding = buildHoldingWithKrw(raw, 1300);
    expect(holding.marketValueKrw).toBe(120 * 2 * 1300);
    expect(holding.usdKrwRate).toBe(1300);
  });
});
