import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  aggregateKrwSummary,
  convertToKrw,
  enrichHoldingKrw,
} from '@sar/shared';

describe('convertToKrw', () => {
  it('returns KRW amounts unchanged', () => {
    expect(convertToKrw(1000, 'KRW', 1300)).toBe(1000);
  });

  it('converts USD with rate', () => {
    expect(convertToKrw(100, 'USD', 1300)).toBe(130000);
  });

  it('returns null for USD without rate', () => {
    expect(convertToKrw(100, 'USD', null)).toBeNull();
  });
});

describe('aggregateKrwSummary', () => {
  it('sums mixed KR and US holdings in KRW', () => {
    const summary = aggregateKrwSummary(
      [
        {
          market: Market.KR,
          currency: 'KRW',
          costBasis: 1_000_000,
          marketValue: 1_100_000,
          unrealizedPnl: 100_000,
          realizedPnl: 0,
          quantity: 10,
          currentPrice: 110_000,
          changePercent: 1,
        },
        {
          market: Market.US,
          currency: 'USD',
          costBasis: 1000,
          marketValue: 1200,
          unrealizedPnl: 200,
          realizedPnl: 50,
          quantity: 10,
          currentPrice: 120,
          changePercent: 2,
        },
      ],
      1300,
      true,
    );

    expect(summary.totalCostBasisKrw).toBe(1_000_000 + 1000 * 1300);
    expect(summary.totalMarketValueKrw).toBe(1_100_000 + 1200 * 1300);
    expect(summary.hasUsdHoldings).toBe(true);
    expect(summary.usdKrwRate).toBe(1300);
  });
});

describe('enrichHoldingKrw', () => {
  it('adds krw fields per holding', () => {
    const krw = enrichHoldingKrw(
      {
        market: Market.US,
        currency: 'USD',
        costBasis: 100,
        marketValue: 110,
        unrealizedPnl: 10,
        realizedPnl: 5,
        quantity: 1,
        currentPrice: 110,
        changePercent: null,
      },
      1300,
    );
    expect(krw.costBasisKrw).toBe(130_000);
    expect(krw.marketValueKrw).toBe(143_000);
  });
});
