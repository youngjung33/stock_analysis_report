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

  it('reduces deploy and excludes held symbols under globalRiskOff', () => {
    const heldSymbol = '005930';
    const result = buildPortfolioSimulation({
      cash: { krw: 10_000_000, usd: 0 },
      holdings: [
        {
          symbol: heldSymbol,
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          quantity: 5,
          currentPrice: 70000,
          marketValueKrw: 350_000,
          weightPercent: 5,
        },
      ],
      preferences: {
        targetKrPercent: 30,
        targetUsPercent: 70,
        maxSingleWeightPercent: 40,
      },
      recommendations: [
        {
          symbol: heldSymbol,
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          currentPrice: 70000,
          changePercent: 2,
          tag: 'momentum',
          tagLabel: '상승',
          reason: 'test',
          reasonKey: 'shared.market.recommendation.momentumStrong',
          score: 5,
        },
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 180,
          changePercent: -1.2,
          tag: 'pullback',
          tagLabel: '조정',
          reason: 'test',
          reasonKey: 'shared.market.recommendation.momentumStrong',
          score: 3,
        },
      ],
      usdKrwRate: 1300,
      regimes: ['globalRiskOff'],
    });

    expect(result.actions.some((a) => a.type === 'add' && a.symbol === heldSymbol)).toBe(false);
    const addActions = result.actions.filter((a) => a.type === 'add');
    if (addActions.length > 0) {
      const totalAdd = addActions.reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);
      expect(totalAdd).toBeLessThanOrEqual(10_000_000 * 0.15 + 1);
    }
  });

  it('deprioritizes narrative-divergence picks in add ordering', () => {
    const result = buildPortfolioSimulation({
      cash: { krw: 0, usd: 8_000 },
      holdings: [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          quantity: 5,
          currentPrice: 70000,
          marketValueKrw: 350_000,
          weightPercent: 5,
        },
      ],
      preferences: {
        targetKrPercent: 30,
        targetUsPercent: 70,
        maxSingleWeightPercent: 40,
      },
      recommendations: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA',
          market: Market.US,
          currency: 'USD',
          currentPrice: 900,
          changePercent: 2,
          tag: 'momentum',
          tagLabel: '상승',
          reason: 'test',
          score: 5,
          scoreBreakdown: [
            {
              factor: 'CH_NARRATIVE',
              delta: -0.15,
              evidenceKey: 'ev',
              evidenceParams: { divergence: 'bullish_news_price_down' },
            },
          ],
        },
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 180,
          changePercent: -1,
          tag: 'pullback',
          tagLabel: '조정',
          reason: 'test',
          score: 3,
        },
      ],
      usdKrwRate: 1300,
    });

    const addActions = result.actions.filter((a) => a.type === 'add');
    expect(addActions.length).toBeGreaterThan(0);
    expect(addActions[0]?.symbol).toBe('AAPL');
    const nvdaAdd = addActions.find((a) => a.symbol === 'NVDA');
    if (nvdaAdd) {
      expect(nvdaAdd.addPriority).toBe('deprioritized');
    }
  });

  it('caps deploy at 10% under policy uncertainty', () => {
    const result = buildPortfolioSimulation({
      cash: { krw: 0, usd: 10_000 },
      holdings: [],
      preferences: {
        targetKrPercent: 30,
        targetUsPercent: 70,
        maxSingleWeightPercent: 40,
      },
      recommendations: [
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 180,
          changePercent: 1,
          tag: 'momentum',
          tagLabel: '상승',
          reason: 'test',
          score: 4,
        },
      ],
      usdKrwRate: 1300,
      policyUncertainty: true,
    });

    const addActions = result.actions.filter((a) => a.type === 'add');
    expect(addActions.length).toBeGreaterThan(0);
    const totalAdd = addActions.reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);
    expect(totalAdd).toBeLessThanOrEqual(10_000 * 1300 * 0.1 + 1);
  });

  it('deducts securities tax from projected cash on KR trim', () => {
    const result = buildPortfolioSimulation({
      cash: { krw: 1_000_000, usd: 0 },
      holdings: [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          quantity: 100,
          currentPrice: 70_000,
          marketValueKrw: 7_000_000,
          weightPercent: 100,
        },
      ],
      preferences: {
        targetKrPercent: 70,
        targetUsPercent: 30,
        maxSingleWeightPercent: 40,
      },
      recommendations: [],
      usdKrwRate: 1300,
    });

    const trim = result.actions.find((a) => a.type === 'trim');
    expect(trim).toBeDefined();
    expect(trim?.securitiesTaxKrw).toBeGreaterThan(0);
    expect(trim?.reasonKey).toBe('shared.simulation.reason.trimWeightWithStt');

    const grossTrim = trim?.suggestedAmountNative ?? 0;
    const tax = trim?.securitiesTaxKrw ?? 0;
    expect(result.projectedCash.krw).toBeCloseTo(1_000_000 + grossTrim - tax, 5);
    expect(result.projectedTotalAssetsKrw).toBeCloseTo(
      result.projectedInvestedKrw + result.projectedCashTotalKrw,
      5,
    );
    expect(result.projectedTotalAssetsKrw).toBeLessThan(8_000_000);
  });
});
