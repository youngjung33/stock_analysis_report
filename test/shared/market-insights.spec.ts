import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildMarketInsights, computeRegionSentiment } from '@sar/shared';

const krQuotes = [
  { symbol: '005930', name: '삼성전자', market: Market.KR, currency: 'KRW', currentPrice: 70000, changePercent: 2.1 },
  { symbol: '000660', name: 'SK하이닉스', market: Market.KR, currency: 'KRW', currentPrice: 180000, changePercent: 1.5 },
  { symbol: '035420', name: 'NAVER', market: Market.KR, currency: 'KRW', currentPrice: 200000, changePercent: 0.8 },
];

const usQuotes = [
  { symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: 190, changePercent: -0.5 },
  { symbol: 'MSFT', name: 'Microsoft', market: Market.US, currency: 'USD', currentPrice: 420, changePercent: -1.2 },
];

describe('computeRegionSentiment', () => {
  it('detects bullish KR market from average change', () => {
    const sentiment = computeRegionSentiment(Market.KR, krQuotes);
    expect(sentiment.label).toBe('bull');
    expect(sentiment.upCount).toBe(3);
    expect(sentiment.avgChangePercent).toBeCloseTo(1.47, 1);
  });

  it('handles missing quotes as neutral', () => {
    const sentiment = computeRegionSentiment(Market.US, [
      { symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: null, changePercent: null },
    ]);
    expect(sentiment.label).toBe('neutral');
    expect(sentiment.avgChangePercent).toBeNull();
  });
});

describe('buildMarketInsights', () => {
  it('returns KR momentum and US pullback picks in mixed conditions', () => {
    const insights = buildMarketInsights(krQuotes, usQuotes);
    expect(insights.recommendations.length).toBeGreaterThan(0);
    expect(insights.recommendations.some((r) => r.market === Market.KR)).toBe(true);
    expect(insights.recommendations.some((r) => r.market === Market.US)).toBe(true);
    expect(insights.kr.label).toBe('bull');
    expect(insights.us.label).toBe('bear');
  });
});
