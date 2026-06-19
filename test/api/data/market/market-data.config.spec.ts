import { MarketDataConfig, FINNHUB_PLACEHOLDER_KEY } from '@server/data/market/market-data.config';

describe('MarketDataConfig', () => {
  const original = process.env.FINNHUB_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FINNHUB_API_KEY;
    } else {
      process.env.FINNHUB_API_KEY = original;
    }
  });

  it('returns null when FINNHUB_API_KEY is missing', () => {
    delete process.env.FINNHUB_API_KEY;
    const config = new MarketDataConfig();
    expect(config.finnhubApiKey).toBeNull();
    expect(config.isFinnhubConfigured()).toBe(false);
  });

  it('returns null for placeholder key', () => {
    process.env.FINNHUB_API_KEY = FINNHUB_PLACEHOLDER_KEY;
    const config = new MarketDataConfig();
    expect(config.finnhubApiKey).toBeNull();
    expect(config.isFinnhubConfigured()).toBe(false);
  });

  it('returns trimmed key when configured', () => {
    process.env.FINNHUB_API_KEY = '  abc123  ';
    const config = new MarketDataConfig();
    expect(config.finnhubApiKey).toBe('abc123');
    expect(config.isFinnhubConfigured()).toBe(true);
  });
});
