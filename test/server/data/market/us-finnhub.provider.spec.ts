import { vi, type Mock } from 'vitest';
import { Market } from '@sar/shared';
import { MarketDataConfig } from '@server/data/market/market-data.config';
import { UsFinnhubMarketProvider } from '@server/data/market/us-finnhub.provider';

function createProvider(apiKey: string | null): UsFinnhubMarketProvider {
  const config = {
    finnhubApiKey: apiKey,
    isFinnhubConfigured: () => apiKey !== null,
  } as MarketDataConfig;
  return new UsFinnhubMarketProvider(config);
}

describe('UsFinnhubMarketProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports US market only', () => {
    const provider = createProvider(null);
    expect(provider.supports(Market.US)).toBe(true);
    expect(provider.supports(Market.KR)).toBe(false);
  });

  it('is unavailable without API key', () => {
    const provider = createProvider(null);
    expect(provider.isAvailable()).toBe(false);
    expect(provider.unavailableReason()).toContain('FINNHUB_API_KEY');
  });

  it('is available when API key is set', () => {
    const provider = createProvider('test-key');
    expect(provider.isAvailable()).toBe(true);
    expect(provider.unavailableReason()).toBeNull();
  });

  it('fetches quote from Finnhub when configured', async () => {
    const provider = createProvider('test-key');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ c: 150.5, dp: 2.1 }),
    }) as Mock;

    const quote = await provider.fetchQuote({
      id: '1',
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
      currency: 'USD',
      yahooSymbol: null,
      createdAt: new Date(),
    });

    expect(quote).toEqual({ currentPrice: 150.5, changePercent: 2.1 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('finnhub.io/api/v1/quote?symbol=AAPL&token=test-key'),
    );
  });
});
