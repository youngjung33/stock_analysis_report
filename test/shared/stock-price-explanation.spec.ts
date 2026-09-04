import { describe, expect, it } from 'vitest';
import {
  Market,
  buildStockPriceExplanationReport,
  filterPriceFirstBreakdown,
  STOCK_ACTION_RULES,
} from '@sar/shared';

const closes = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5);

function baseReport(overrides: Parameters<typeof buildStockPriceExplanationReport>[0] = {}) {
  return buildStockPriceExplanationReport({
    quote: {
      symbol: '005930',
      name: '삼성전자',
      market: Market.KR,
      currency: 'KRW',
      currentPrice: 130,
      changePercent: 1.5,
    },
    chartCloses: closes,
    technical: {
      symbol: '005930',
      market: Market.KR,
      trendKey: 'shared.market.trends.shortTermUp',
      rsi14: 58,
      rsVsBenchmark1w: 1.2,
      aboveSma20: true,
      aboveSma200: true,
    },
    news: {
      symbol: '005930',
      market: Market.KR,
      tone: 'bullish',
      relevanceScore: 2,
      articleCount: 3,
      headlineSample: '반도체 수요 회복 기대',
      primarySourceCount: 1,
      secondarySourceCount: 2,
      dedupeKey: '005930:news',
    },
    event: null,
    krQuotes: [
      {
        symbol: '005930',
        name: '삼성전자',
        market: Market.KR,
        currency: 'KRW',
        currentPrice: 130,
        changePercent: 1.5,
      },
    ],
    usQuotes: [],
    macro: [],
    sectors: [],
    indices: [],
    ...overrides,
  });
}

describe('buildStockPriceExplanationReport', () => {
  it('builds price-first insights: story, past, present, market, outlook, action', () => {
    const report = baseReport();

    expect(report).not.toBeNull();
    expect(report!.insights).toHaveLength(6);
    expect(report!.insights.map((i) => i.category)).toEqual([
      'stockStory',
      'stockPast',
      'stockPresent',
      'stockMarket',
      'stockOutlook',
      'stockAction',
    ]);
    expect(report!.insights.some((i) => i.category === 'stockNewsNote')).toBe(false);
    const action = report!.insights.find((i) => i.category === 'stockAction');
    expect(action).toBeDefined();
    expect(action!.evidenceItems?.some((e) => e.key.includes('stockActionBuyBelow'))).toBe(true);
    expect(action!.evidenceItems?.some((e) => e.key.includes('stockActionSellAbove'))).toBe(true);
    expect(report!.changePercent1w).not.toBeNull();
    expect(report!.scoreBreakdown.length).toBeGreaterThan(0);
    expect(report!.scoreBreakdown.every((b) => !b.factor.startsWith('CH_NEWS:'))).toBe(true);
    expect(report!.scoreBreakdown.every((b) => !b.factor.startsWith('CH_NARRATIVE:'))).toBe(true);
  });

  it('adds optional news note when headline tone diverges from price', () => {
    const report = baseReport({
      quote: {
        symbol: '005930',
        name: '삼성전자',
        market: Market.KR,
        currency: 'KRW',
        currentPrice: 120,
        changePercent: -1.2,
      },
      news: {
        symbol: '005930',
        market: Market.KR,
        tone: 'bullish',
        relevanceScore: 2,
        articleCount: 5,
        headlineSample: '실적 개선 전망',
        primarySourceCount: 2,
        secondarySourceCount: 3,
        dedupeKey: '005930:news',
      },
    });

    expect(report!.insights.some((i) => i.category === 'stockNewsNote')).toBe(true);
    expect(report!.insights.some((i) => i.category === 'stockAction')).toBe(true);
    expect(report!.insights).toHaveLength(7);
  });

  it('caps sellAbove near current price when 6mo chart high is far above', () => {
    const hynixCloses = Array.from({ length: 126 }, (_, i) => {
      if (i < 42) return 2_900_000 - i * 15_000;
      if (i < 84) return 2_200_000 - (i - 42) * 12_000;
      return 1_480_000 + (i - 84) * 2_800;
    });
    hynixCloses[hynixCloses.length - 1] = 1_596_000;

    const report = baseReport({
      quote: {
        symbol: '000660',
        name: 'SK하이닉스',
        market: Market.KR,
        currency: 'KRW',
        currentPrice: 1_596_000,
        changePercent: -0.8,
      },
      chartCloses: hynixCloses,
      technical: {
        symbol: '000660',
        market: Market.KR,
        trendKey: 'shared.market.trends.shortTermPullback',
        rsi14: 45,
        rsVsBenchmark1w: -0.5,
        aboveSma20: false,
        aboveSma200: true,
      },
      news: null,
      krQuotes: [
        {
          symbol: '000660',
          name: 'SK하이닉스',
          market: Market.KR,
          currency: 'KRW',
          currentPrice: 1_596_000,
          changePercent: -0.8,
        },
      ],
    });

    const action = report!.insights.find((i) => i.category === 'stockAction');
    const sellEv = action!.evidenceItems!.find((e) =>
      e.key.includes('stockActionSellAbove'),
    );
    const buyEv = action!.evidenceItems!.find((e) =>
      e.key.includes('stockActionBuyBelow'),
    );
    const sellPrice = Number(String(sellEv!.params!.price).replace(/,/g, ''));
    const buyPrice = Number(String(buyEv!.params!.price).replace(/,/g, ''));
    expect(sellPrice).toBeLessThanOrEqual(1_596_000 * 1.11);
    expect(sellPrice).toBeGreaterThan(1_596_000 * 1.03);
    expect(buyPrice).toBeGreaterThanOrEqual(1_596_000 * (1 - STOCK_ACTION_RULES.buyDipMaxPct));
    expect(buyPrice).toBeLessThan(1_596_000);
    expect(action!.summaryKey).not.toContain('avoid');
  });

  it('uses near-term buy zone (not distant 6mo low) when price is below sma20', () => {
    const closes = Array.from({ length: 90 }, (_, i) => {
      if (i < 30) return 2_800_000 - i * 20_000;
      return 1_520_000 + (i - 30) * 1_500;
    });
    closes[closes.length - 1] = 1_650_000;

    const report = baseReport({
      quote: {
        symbol: '000660',
        name: 'SK하이닉스',
        market: Market.KR,
        currency: 'KRW',
        currentPrice: 1_650_000,
        changePercent: 0.5,
      },
      chartCloses: closes,
      technical: {
        symbol: '000660',
        market: Market.KR,
        trendKey: 'shared.market.trends.shortTermPullback',
        rsi14: 45,
        rsVsBenchmark1w: 0.2,
        aboveSma20: false,
        aboveSma200: true,
      },
      news: null,
      krQuotes: [],
    });

    const action = report!.insights.find((i) => i.category === 'stockAction')!;
    const buyEv = action.evidenceItems!.find((e) => e.key.includes('stockActionBuyBelow'))!;
    const buyPrice = Number(String(buyEv.params!.price).replace(/,/g, ''));

    expect(['dip_buy', 'watch']).toContain(
      action.summaryKey!.replace('shared.market.insights.stockFocus.action.summary.', ''),
    );
    expect(buyPrice).toBeGreaterThan(1_500_000);
    expect(buyPrice).toBeGreaterThanOrEqual(1_650_000 * (1 - STOCK_ACTION_RULES.buyDipMaxPct));
    expect(buyPrice).toBeLessThan(1_650_000);
  });
});

describe('filterPriceFirstBreakdown', () => {
  it('strips news and narrative channels', () => {
    const filtered = filterPriceFirstBreakdown([
      {
        factor: 'CH_TECH:trend',
        delta: 1,
        evidenceKey: 'shared.market.recommendation.evidence.trendUp',
        evidenceParams: { trend: 'up' },
      },
      {
        factor: 'CH_NEWS:bullish',
        delta: 0.5,
        evidenceKey: 'shared.market.recommendation.evidence.newsBullish',
        evidenceParams: { headline: 'test' },
      },
      {
        factor: 'CH_NARRATIVE:divergence',
        delta: -0.3,
        evidenceKey: 'shared.market.recommendation.evidence.narrativeDivergence',
        evidenceParams: { divergence: 'bullish_news_price_down' },
      },
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].factor).toBe('CH_TECH:trend');
  });
});
