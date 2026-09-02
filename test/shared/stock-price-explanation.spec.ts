import { describe, expect, it } from 'vitest';
import { Market, buildStockPriceExplanationReport } from '@sar/shared';

describe('buildStockPriceExplanationReport', () => {
  it('builds past, present, and outlook insights for a stock', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5);
    const report = buildStockPriceExplanationReport({
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
    });

    expect(report).not.toBeNull();
    expect(report!.insights).toHaveLength(3);
    expect(report!.insights.map((i) => i.category)).toEqual([
      'stockPast',
      'stockPresent',
      'stockOutlook',
    ]);
    expect(report!.changePercent1w).not.toBeNull();
    expect(report!.scoreBreakdown.length).toBeGreaterThan(0);
  });
});
