import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { buildStockRecommendations } from '@sar/shared';

const krQuotes = [
  { symbol: '005930', name: '삼성전자', market: Market.KR, currency: 'KRW', currentPrice: 70000, changePercent: 2.1 },
  { symbol: '000660', name: 'SK하이닉스', market: Market.KR, currency: 'KRW', currentPrice: 180000, changePercent: 1.5 },
  { symbol: '035420', name: 'NAVER', market: Market.KR, currency: 'KRW', currentPrice: 200000, changePercent: 0.8 },
];

const usQuotes = [
  { symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: 190, changePercent: -0.5 },
  { symbol: 'MSFT', name: 'Microsoft', market: Market.US, currency: 'USD', currentPrice: 420, changePercent: -1.2 },
  { symbol: 'NVDA', name: 'NVIDIA', market: Market.US, currency: 'USD', currentPrice: 900, changePercent: -2.0 },
];

describe('buildStockRecommendations', () => {
  it('returns different KR and US picks under mixed conditions', () => {
    const result = buildStockRecommendations({ krQuotes, usQuotes }, 6);
    const krRecs = result.recommendations.filter((r) => r.market === Market.KR);
    const usRecs = result.recommendations.filter((r) => r.market === Market.US);
    expect(krRecs.length).toBeGreaterThan(0);
    expect(usRecs.length).toBeGreaterThan(0);
    expect(krRecs[0]?.symbol).not.toBe(usRecs[0]?.symbol);
  });

  it('includes score breakdown with evidence under macro regimes', () => {
    const result = buildStockRecommendations(
      {
        krQuotes,
        usQuotes,
        macro: [
          {
            yahooSymbol: '^VIX',
            name: 'VIX',
            kind: 'vix',
            unit: 'index',
            value: 22,
            changePercent1d: 5,
            interpretLabel: '',
            interpretDetail: '',
            interpretKey: '',
            interpretDetailKey: '',
            tone: 'bearish',
            chartUrl: '',
          },
        ],
        usdKrwChange1d: 0.35,
      },
      4,
    );

    for (const rec of result.recommendations) {
      expect(rec.scoreBreakdown.length).toBeGreaterThanOrEqual(2);
      expect(rec.evidenceItems.length).toBeGreaterThanOrEqual(1);
      expect(rec.regimeContext.length).toBeGreaterThan(0);
    }
    expect(result.regimes.some((r) => r.id === 'globalRiskOff')).toBe(true);
    expect(result.regimes.some((r) => r.id === 'fxKrwWeak')).toBe(true);
  });

  it('excludes held symbols from recommendations', () => {
    const result = buildStockRecommendations(
      {
        krQuotes,
        usQuotes,
        userHoldings: [{ symbol: '005930', market: Market.KR }],
      },
      6,
    );
    expect(result.recommendations.some((r) => r.symbol === '005930')).toBe(false);
  });
});
