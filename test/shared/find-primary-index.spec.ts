import { describe, expect, it } from 'vitest';
import { Market, findPrimaryIndexSnapshot, findRegionSentimentIndex } from '@sar/shared';

describe('findPrimaryIndexSnapshot', () => {
  const indices = [
    { yahooSymbol: '^KS11', market: Market.KR, name: 'KOSPI', changePercent1d: 0.8 },
    { yahooSymbol: '^GSPC', market: Market.US, name: 'S&P 500', changePercent1d: -0.2 },
    { yahooSymbol: '^IXIC', market: Market.US, name: 'NASDAQ', changePercent1d: 0.1 },
  ];

  it('returns KOSPI for KR market', () => {
    expect(findPrimaryIndexSnapshot(indices, Market.KR)?.yahooSymbol).toBe('^KS11');
  });

  it('returns S&P 500 for US market', () => {
    expect(findPrimaryIndexSnapshot(indices, Market.US)?.yahooSymbol).toBe('^GSPC');
  });
});

describe('findRegionSentimentIndex', () => {
  const indices = [
    { yahooSymbol: '^KS11', market: Market.KR, name: 'KOSPI', changePercent1d: 0.8 },
    { yahooSymbol: '^GSPC', market: Market.US, name: 'S&P 500', changePercent1d: -0.2 },
    { yahooSymbol: '^IXIC', market: Market.US, name: 'NASDAQ', changePercent1d: 0.1 },
  ];

  it('returns NASDAQ for US market sentiment', () => {
    expect(findRegionSentimentIndex(indices, Market.US)?.yahooSymbol).toBe('^IXIC');
  });
});
