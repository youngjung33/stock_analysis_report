import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { dedupeSearchResults, parseYahooSearchQuote } from '@sar/shared';

describe('parseYahooSearchQuote', () => {
  it('parses KR equity with .KS suffix', () => {
    const result = parseYahooSearchQuote(
      { symbol: '005930.KS', longname: 'Samsung Electronics Co., Ltd.' },
      Market.KR,
    );
    expect(result).toEqual({
      symbol: '005930',
      name: 'Samsung Electronics Co., Ltd.',
      market: Market.KR,
      yahooSymbol: '005930.KS',
      exchange: undefined,
    });
  });

  it('parses US equity ticker', () => {
    const result = parseYahooSearchQuote(
      { symbol: 'AAPL', longname: 'Apple Inc.', quoteType: 'EQUITY', exchange: 'NMS' },
      Market.US,
    );
    expect(result).toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      market: Market.US,
      yahooSymbol: 'AAPL',
      exchange: 'NMS',
    });
  });

  it('filters KR symbols when searching US market', () => {
    expect(
      parseYahooSearchQuote({ symbol: '005930.KS', longname: 'Samsung' }, Market.US),
    ).toBeNull();
  });

  it('filters non-equity US quote types', () => {
    expect(
      parseYahooSearchQuote({ symbol: 'BTC-USD', quoteType: 'CRYPTOCURRENCY' }, Market.US),
    ).toBeNull();
  });
});

describe('dedupeSearchResults', () => {
  it('removes duplicate symbol+market pairs', () => {
    const list = dedupeSearchResults([
      { symbol: 'AAPL', name: 'Apple', market: Market.US, yahooSymbol: 'AAPL' },
      { symbol: 'AAPL', name: 'Apple Inc.', market: Market.US, yahooSymbol: 'AAPL' },
    ]);
    expect(list).toHaveLength(1);
  });
});
