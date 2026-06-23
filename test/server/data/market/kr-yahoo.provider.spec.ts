import { vi, type Mock } from 'vitest';
import { Market } from '@sar/shared';
import { KrYahooMarketProvider } from '@server/data/market/kr-yahoo.provider';
import * as yahooClient from '@server/data/market/yahoo-chart.client';

describe('KrYahooMarketProvider', () => {
  const provider = new KrYahooMarketProvider();

  beforeEach(() => {
    vi.spyOn(yahooClient, 'fetchYahooChartQuote').mockResolvedValue({
      currentPrice: 72000,
      changePercent: 1.2,
      range: '1d',
      points: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports KR market only', () => {
    expect(provider.supports(Market.KR)).toBe(true);
    expect(provider.supports(Market.US)).toBe(false);
  });

  it('is always available without API key', () => {
    expect(provider.isAvailable()).toBe(true);
    expect(provider.unavailableReason()).toBeNull();
  });

  it('uses yahooSymbol when present', async () => {
    await provider.fetchQuote({
      id: '1',
      symbol: '005930',
      name: 'Samsung',
      market: Market.KR,
      currency: 'KRW',
      yahooSymbol: '005930.KS',
      createdAt: new Date(),
    });

    expect(yahooClient.fetchYahooChartQuote).toHaveBeenCalledWith('005930.KS');
  });

  it('resolves yahoo symbol from symbol when yahooSymbol is null', async () => {
    await provider.fetchQuote({
      id: '1',
      symbol: '035720',
      name: 'Kakao',
      market: Market.KR,
      currency: 'KRW',
      yahooSymbol: null,
      createdAt: new Date(),
    });

    expect(yahooClient.fetchYahooChartQuote).toHaveBeenCalledWith('035720.KS');
  });
});
