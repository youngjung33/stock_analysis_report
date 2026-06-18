import { MarketDataConfig, FINNHUB_PLACEHOLDER_KEY } from '@api/data/market/market-data.config';

function createConfig(env: Record<string, string | undefined>): MarketDataConfig {
  return new MarketDataConfig({
    get: (key: string) => env[key],
  } as never);
}

describe('MarketDataConfig', () => {
  it('returns null when FINNHUB_API_KEY is missing', () => {
    const config = createConfig({});
    expect(config.finnhubApiKey).toBeNull();
    expect(config.isFinnhubConfigured()).toBe(false);
  });

  it('returns null for placeholder key', () => {
    const config = createConfig({ FINNHUB_API_KEY: FINNHUB_PLACEHOLDER_KEY });
    expect(config.finnhubApiKey).toBeNull();
    expect(config.isFinnhubConfigured()).toBe(false);
  });

  it('returns trimmed key when configured', () => {
    const config = createConfig({ FINNHUB_API_KEY: '  abc123  ' });
    expect(config.finnhubApiKey).toBe('abc123');
    expect(config.isFinnhubConfigured()).toBe(true);
  });
});
