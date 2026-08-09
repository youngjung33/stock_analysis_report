import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { computeRegionSentiment, detectMarketRegimes } from '@sar/shared';

function macroSnapshot(
  kind: 'vix' | 'fx' | 'yield',
  value: number,
  changePercent1d: number | null = null,
) {
  return {
    yahooSymbol: kind === 'vix' ? '^VIX' : kind === 'fx' ? 'KRW=X' : '^TNX',
    name: kind,
    kind,
    unit: kind === 'fx' ? ('krw' as const) : kind === 'yield' ? ('pct' as const) : ('index' as const),
    value,
    changePercent1d,
    interpretLabel: '',
    interpretDetail: '',
    interpretKey: '',
    interpretDetailKey: '',
    tone: 'neutral' as const,
    chartUrl: '',
  };
}

const krBullQuotes = [
  { symbol: '005930', name: '삼성전자', market: Market.KR, currency: 'KRW', currentPrice: 70000, changePercent: 2.1 },
  { symbol: '000660', name: 'SK하이닉스', market: Market.KR, currency: 'KRW', currentPrice: 180000, changePercent: 1.5 },
];
const usBearQuotes = [
  { symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: 190, changePercent: -1.5 },
  { symbol: 'MSFT', name: 'Microsoft', market: Market.US, currency: 'USD', currentPrice: 420, changePercent: -0.8 },
];

describe('detectMarketRegimes', () => {
  it('detects globalRiskOff when VIX >= 20', () => {
    const kr = computeRegionSentiment(Market.KR, krBullQuotes);
    const us = computeRegionSentiment(Market.US, usBearQuotes);
    const regimes = detectMarketRegimes({
      krSentiment: kr,
      usSentiment: us,
      macro: [macroSnapshot('vix', 22)],
      usdKrwChange1d: 0,
    });
    expect(regimes.some((r) => r.id === 'globalRiskOff')).toBe(true);
  });

  it('detects fxKrwWeak when USD/KRW rises more than 0.2%', () => {
    const kr = computeRegionSentiment(Market.KR, krBullQuotes);
    const us = computeRegionSentiment(Market.US, usBearQuotes);
    const regimes = detectMarketRegimes({
      krSentiment: kr,
      usSentiment: us,
      macro: [],
      usdKrwChange1d: 0.35,
    });
    expect(regimes.some((r) => r.id === 'fxKrwWeak')).toBe(true);
  });

  it('detects usLeadingKr when US bull and KR not bull with gap > 1%p', () => {
    const usBullQuotes = [
      { symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: 190, changePercent: 2.5 },
      { symbol: 'MSFT', name: 'Microsoft', market: Market.US, currency: 'USD', currentPrice: 420, changePercent: 2.0 },
    ];
    const krFlatQuotes = [
      { symbol: '005930', name: '삼성전자', market: Market.KR, currency: 'KRW', currentPrice: 70000, changePercent: 0.1 },
      { symbol: '000660', name: 'SK하이닉스', market: Market.KR, currency: 'KRW', currentPrice: 180000, changePercent: -0.2 },
    ];
    const kr = computeRegionSentiment(Market.KR, krFlatQuotes);
    const us = computeRegionSentiment(Market.US, usBullQuotes);
    const regimes = detectMarketRegimes({
      krSentiment: kr,
      usSentiment: us,
      macro: [macroSnapshot('vix', 16)],
      usdKrwChange1d: 0,
    });
    expect(regimes.some((r) => r.id === 'usLeadingKr')).toBe(true);
  });

  it('detects syncBull when both regions are bullish', () => {
    const usBullQuotes = [
      { symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: 190, changePercent: 1.2 },
      { symbol: 'MSFT', name: 'Microsoft', market: Market.US, currency: 'USD', currentPrice: 420, changePercent: 0.9 },
    ];
    const kr = computeRegionSentiment(Market.KR, krBullQuotes);
    const us = computeRegionSentiment(Market.US, usBullQuotes);
    const regimes = detectMarketRegimes({
      krSentiment: kr,
      usSentiment: us,
      macro: [macroSnapshot('vix', 14)],
      usdKrwChange1d: 0,
    });
    expect(regimes.some((r) => r.id === 'syncBull')).toBe(true);
  });
});
