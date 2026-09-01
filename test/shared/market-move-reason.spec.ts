import { describe, expect, it } from 'vitest';
import { Market, buildMarketAnalysisReport, buildMarketMoveReasonInsights } from '@sar/shared';

const risingCloses = Array.from({ length: 220 }, (_, i) => 2500 + i * 3);
const flatCloses = Array.from({ length: 220 }, (_, i) => 4000 + (i % 2));

function krIndexInput(changePercent1d: number) {
  return {
    yahooSymbol: '^KS11',
    name: 'KOSPI',
    market: Market.KR,
    closes: risingCloses,
    volumes: Array.from({ length: 220 }, () => 1_000_000),
    highs: risingCloses.map((c) => c + 10),
    lows: risingCloses.map((c) => c - 10),
    changePercent1d,
    chartUrl: 'https://finance.yahoo.com/quote/%5EKS11/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/KRX-KOSPI/',
  };
}

function usIndexInput(changePercent1d: number) {
  return {
    yahooSymbol: '^GSPC',
    name: 'S&P 500',
    market: Market.US,
    closes: flatCloses,
    volumes: Array.from({ length: 220 }, () => 2_000_000),
    highs: flatCloses.map((c) => c + 5),
    lows: flatCloses.map((c) => c - 5),
    changePercent1d,
    chartUrl: 'https://finance.yahoo.com/quote/%5EGSPC/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/SP-SPX/',
  };
}

describe('buildMarketMoveReasonInsights', () => {
  it('builds KR and US move-reason insights for prior session', () => {
    const indices = [
      {
        yahooSymbol: '^KS11',
        name: 'KOSPI',
        market: Market.KR,
        currentPrice: 2650,
        changePercent1d: 1.2,
        sma20: 2600,
        sma50: 2550,
        sma200: 2400,
        rsi14: 55,
        macd: 1,
        bollinger: null,
        stochastic: null,
        rangePositionPct: 60,
        volumeRatio: 1.1,
        trendLabel: '단기 상승 추세',
        trendKey: 'shared.market.trends.shortTermUp',
        chartUrl: 'https://finance.yahoo.com/quote/%5EKS11/',
        tradingViewUrl: 'https://www.tradingview.com/symbols/KRX-KOSPI/',
      },
      {
        yahooSymbol: '^GSPC',
        name: 'S&P 500',
        market: Market.US,
        currentPrice: 5200,
        changePercent1d: -0.8,
        sma20: 5250,
        sma50: 5300,
        sma200: 5000,
        rsi14: 45,
        macd: -0.5,
        bollinger: null,
        stochastic: null,
        rangePositionPct: 40,
        volumeRatio: 0.9,
        trendLabel: '단기 조정',
        trendKey: 'shared.market.trends.shortTermPullback',
        chartUrl: 'https://finance.yahoo.com/quote/%5EGSPC/',
        tradingViewUrl: 'https://www.tradingview.com/symbols/SP-SPX/',
      },
    ];

    const insights = buildMarketMoveReasonInsights({
      kr: {
        market: Market.KR,
        label: 'bull',
        avgChangePercent: 0.9,
        upCount: 4,
        downCount: 2,
        flatCount: 0,
        headline: '',
        description: '',
        headlineKey: '',
        descriptionKey: '',
      },
      us: {
        market: Market.US,
        label: 'bear',
        avgChangePercent: -0.6,
        upCount: 1,
        downCount: 5,
        flatCount: 0,
        headline: '',
        description: '',
        headlineKey: '',
        descriptionKey: '',
      },
      indices,
      sectors: [
        {
          yahooSymbol: '091160.KS',
          name: 'KODEX 반도체',
          sectorLabel: '반도체',
          market: Market.KR,
          currentPrice: 100,
          changePercent1d: 1.5,
          rsBenchmark1w: 2.1,
          rsBenchmark1mo: 3,
          strengthRank: 1,
          chartUrl: 'https://finance.yahoo.com/quote/091160.KS/',
        },
        {
          yahooSymbol: 'XLK',
          name: 'XLK',
          sectorLabel: '기술',
          market: Market.US,
          currentPrice: 200,
          changePercent1d: -1,
          rsBenchmark1w: -1.2,
          rsBenchmark1mo: -0.5,
          strengthRank: 1,
          chartUrl: 'https://finance.yahoo.com/quote/XLK/',
        },
      ],
      macro: [
        {
          yahooSymbol: '^VIX',
          name: 'VIX',
          kind: 'vix',
          unit: 'index',
          value: 18,
          changePercent1d: 5,
          interpretLabel: 'elevated',
          interpretKey: 'shared.market.macro.vix.elevated',
          interpretDetail: 'elevated',
          interpretDetailKey: 'shared.market.macro.vix.elevatedDetail',
          tone: 'bearish',
          chartUrl: 'https://finance.yahoo.com/quote/%5EVIX/',
        },
        {
          yahooSymbol: 'KRW=X',
          name: 'USD/KRW',
          kind: 'fx',
          unit: 'krw',
          value: 1350,
          changePercent1d: 0.4,
          interpretLabel: 'weak krw',
          interpretKey: 'shared.market.macro.fx.weak',
          interpretDetail: 'weak',
          interpretDetailKey: 'shared.market.macro.fx.weakDetail',
          tone: 'bullish',
          chartUrl: 'https://finance.yahoo.com/quote/KRW%3DX/',
        },
      ],
      news: [
        {
          title: '코스피 상승 마감, 반도체 강세',
          source: '연합',
          publishedAt: new Date().toISOString(),
          url: 'https://example.com/kr',
          market: Market.KR,
        },
        {
          title: 'US stocks fall on rate fears',
          source: 'Reuters',
          publishedAt: new Date().toISOString(),
          url: 'https://example.com/us',
          market: Market.US,
        },
      ],
    });

    expect(insights).toHaveLength(2);
    const kr = insights.find((i) => i.market === Market.KR);
    const us = insights.find((i) => i.market === Market.US);
    expect(kr?.category).toBe('moveReason');
    expect(us?.category).toBe('moveReason');
    expect(kr?.tone).toBe('bullish');
    expect(us?.tone).toBe('bearish');
    expect(kr?.evidence.some((e) => e.includes('KOSPI'))).toBe(true);
    expect(us?.evidence.some((e) => e.includes('VIX') || e.includes('S&P'))).toBe(true);
    expect(kr?.titleKey).toBe('shared.market.insights.moveReason.title');
  });

  it('prepends move-reason insights in buildMarketAnalysisReport', () => {
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
      indexInputs: [krIndexInput(0.8), usIndexInput(-0.5)],
      macroInputs: [],
      sectorInputs: [],
      news: [],
    });

    expect(report.insights[0]?.category).toBe('moveReason');
    expect(report.insights.filter((i) => i.category === 'moveReason')).toHaveLength(2);
  });
});
