import { describe, expect, it } from 'vitest';
import {
  Market,
  STOCK_ACTION_RULES,
  computeStockActionPlan,
  deriveConservativeBuyBelow,
  deriveConservativeSellAbove,
} from '@sar/shared';

const chartBase = {
  sma20: 160_000,
  sma50: 155_000,
  sma200: 140_000,
  rsi14: 50,
  recentRangeLow: 158_000,
  recentRangeHigh: 168_000,
  recentRangePct: 55,
};

describe('STOCK_ACTION_RULES price bands', () => {
  it('buyBelow stays within 2–7% below current', () => {
    const price = 1_650_000;
    const buy = deriveConservativeBuyBelow(price, chartBase, 'KRW');
    expect(buy).toBeLessThan(price);
    expect(buy).toBeGreaterThanOrEqual(price * (1 - STOCK_ACTION_RULES.buyDipMaxPct));
    expect(buy).toBeLessThanOrEqual(price * (1 - STOCK_ACTION_RULES.buyDipMinPct));
  });

  it('sellAbove stays within 4–10% above current', () => {
    const price = 1_650_000;
    const sell = deriveConservativeSellAbove(price, chartBase, 'KRW');
    expect(sell).toBeGreaterThan(price);
    expect(sell).toBeGreaterThanOrEqual(price * (1 + STOCK_ACTION_RULES.sellGainMinPct));
    expect(sell).toBeLessThanOrEqual(price * (1 + STOCK_ACTION_RULES.sellGainMaxPct) * 1.01);
  });

  it('ignores 6mo high far above when deriving sellAbove', () => {
    const price = 1_650_000;
    const sell = deriveConservativeSellAbove(
      price,
      { ...chartBase, recentRangeHigh: 2_900_000 },
      'KRW',
    );
    expect(sell).toBeLessThan(price * 1.11);
  });
});

describe('computeStockActionPlan stance rules', () => {
  it('defaults to watch when signals are mixed', () => {
    const plan = computeStockActionPlan({
      price: 165,
      currency: 'USD',
      chart: chartBase,
      technical: {
        symbol: 'TEST',
        market: Market.US,
        trendKey: 'unknown',
        rsi14: 50,
        rsVsBenchmark1w: 0,
        aboveSma20: true,
        aboveSma200: true,
      },
      event: null,
      tag: 'watchlist',
      divergence: null,
    });
    expect(plan.ruleId).toBe('default_watch');
    expect(plan.stance).toBe('watch');
  });

  it('dip_zone on pullback with price below sma20 above sma200', () => {
    const plan = computeStockActionPlan({
      price: 159,
      currency: 'USD',
      chart: { ...chartBase, sma20: 162, sma200: 140, recentRangePct: 40 },
      technical: {
        symbol: 'TEST',
        market: Market.US,
        trendKey: 'shared.market.trends.shortTermPullback',
        rsi14: 45,
        rsVsBenchmark1w: 0,
        aboveSma20: false,
        aboveSma200: true,
      },
      event: null,
      tag: 'pullback',
      divergence: null,
    });
    expect(plan.ruleId).toBe('dip_zone');
    expect(plan.stance).toBe('dip_buy');
  });

  it('overextended_avoid when RSI high and at top of recent range', () => {
    const plan = computeStockActionPlan({
      price: 165,
      currency: 'USD',
      chart: { ...chartBase, recentRangePct: 85 },
      technical: {
        symbol: 'TEST',
        market: Market.US,
        trendKey: 'shared.market.trends.shortTermUp',
        rsi14: 72,
        rsVsBenchmark1w: 1,
        aboveSma20: true,
        aboveSma200: true,
      },
      event: null,
      tag: 'momentum',
      divergence: null,
    });
    expect(plan.ruleId).toBe('overextended_avoid');
    expect(plan.stance).toBe('avoid');
  });

  it('is deterministic for the same input', () => {
    const input = {
      price: 1_650_000,
      currency: 'KRW',
      chart: chartBase,
      technical: {
        symbol: '000660',
        market: Market.KR,
        trendKey: 'shared.market.trends.shortTermPullback',
        rsi14: 45,
        rsVsBenchmark1w: 0,
        aboveSma20: false,
        aboveSma200: true,
      },
      event: null,
      tag: 'pullback' as const,
      divergence: null,
    };
    const a = computeStockActionPlan(input);
    const b = computeStockActionPlan(input);
    expect(a).toEqual(b);
  });
});
