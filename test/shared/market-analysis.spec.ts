import { describe, expect, it } from 'vitest';
import { Market, buildMarketAnalysisReport } from '@sar/shared';

describe('buildMarketAnalysisReport', () => {
  it('produces insights with reasoning and links', () => {
    const report = buildMarketAnalysisReport({
      krQuotes: [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          currentPrice: 70000,
          changePercent: 1.2,
        },
      ],
      usQuotes: [
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 190,
          changePercent: -0.8,
        },
      ],
      indexInputs: [
        {
          yahooSymbol: '^GSPC',
          name: 'S&P 500',
          market: Market.US,
          closes: Array.from({ length: 220 }, (_, i) => 4000 + i * 2),
          volumes: Array.from({ length: 220 }, () => 1_000_000),
          highs: Array.from({ length: 220 }, (_, i) => 4010 + i * 2),
          lows: Array.from({ length: 220 }, (_, i) => 3990 + i * 2),
          changePercent1d: 0.5,
          chartUrl: 'https://finance.yahoo.com/quote/%5EGSPC/',
          tradingViewUrl: 'https://www.tradingview.com/symbols/SP-SPX/',
        },
      ],
      macroInputs: [
        {
          yahooSymbol: '^VIX',
          name: 'VIX',
          kind: 'vix',
          unit: 'index',
          closes: [14, 15, 16, 18],
          changePercent1d: 2,
          chartUrl: 'https://finance.yahoo.com/quote/%5EVIX/',
        },
      ],
      sectorInputs: [
        {
          yahooSymbol: 'XLK',
          name: 'XLK',
          sectorLabel: '기술',
          market: Market.US,
          closes: [100, 102, 105, 108],
          changePercent1d: 1,
          chartUrl: 'https://finance.yahoo.com/quote/XLK/',
          benchmarkCloses: [100, 101, 102, 103],
        },
      ],
      news: [
        {
          title: 'Stock market rally continues',
          source: 'Reuters',
          publishedAt: new Date().toISOString(),
          url: 'https://example.com/1',
          market: Market.US,
        },
      ],
    });

    expect(report.insights.length).toBeGreaterThan(3);
    expect(report.indices).toHaveLength(1);
    expect(report.macro).toHaveLength(1);
    expect(report.sectors).toHaveLength(1);
    expect(report.krQuotes).toHaveLength(1);
    const breadth = report.insights.find((i) => i.category === 'breadth');
    expect(breadth?.reasoning.length).toBeGreaterThan(10);
    expect(breadth?.links.length).toBeGreaterThan(0);
    expect(report.figureStatements).toEqual([]);
    expect(report.policyUncertainty).toBe(false);
  });

  it('sets policyUncertainty when tier-1 macro bearish figure present', () => {
    const report = buildMarketAnalysisReport({
      krQuotes: [],
      usQuotes: [],
      indexInputs: [],
      macroInputs: [],
      sectorInputs: [],
      news: [],
      figureStatements: [
        {
          figureId: 'trump',
          figureName: 'Trump',
          impactTier: 1,
          linkScope: 'macro_only',
          tone: 'bearish',
          headline: 'Tariff concerns weigh on markets',
          publishedAt: new Date().toISOString(),
          dedupeKey: 'test-1',
          sourceChannel: 'rss',
          primarySymbols: [],
          sectorTags: [],
          topicTags: [],
        },
      ],
    });

    expect(report.policyUncertainty).toBe(true);
    expect(report.figureStatements).toHaveLength(1);
  });

  it('passes news and figure enrichment into recommendation scoreBreakdown', () => {
    const report = buildMarketAnalysisReport({
      krQuotes: [
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          currentPrice: 70000,
          changePercent: 2.1,
        },
      ],
      usQuotes: [
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 190,
          changePercent: 1.5,
        },
      ],
      indexInputs: [],
      macroInputs: [],
      sectorInputs: [],
      news: [],
      newsSnapshots: [
        {
          symbol: 'AAPL',
          market: Market.US,
          headlineSample: 'Apple stock surges on strong iPhone outlook',
          tone: 'bullish',
          relevanceScore: 0.8,
          articleCount: 1,
          primarySourceCount: 0,
          secondarySourceCount: 2,
          dedupeKey: 'news:AAPL:test',
        },
      ],
      figureStatements: [
        {
          figureId: 'cook',
          figureName: 'Tim Cook',
          impactTier: 3,
          linkScope: 'symbol_direct',
          tone: 'bullish',
          headline: 'Tim Cook says Apple iPhone demand remains strong',
          publishedAt: new Date().toISOString(),
          dedupeKey: 'fig-aapl',
          sourceChannel: 'rss',
          primarySymbols: ['AAPL'],
          sectorTags: [],
          topicTags: [],
        },
      ],
    });

    const aapl = report.recommendations.find((r) => r.symbol === 'AAPL');
    expect(aapl).toBeDefined();
    expect(aapl?.scoreBreakdown?.some((b) => b.factor.startsWith('CH_FIGURE'))).toBe(true);
    expect(aapl?.scoreBreakdown?.some((b) => b.factor.startsWith('CH_NEWS'))).toBe(true);
  });
});
