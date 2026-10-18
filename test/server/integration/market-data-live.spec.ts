import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { fetchYahooChartQuote } from '@server/data/market/yahoo-chart.client';
import { MarketDataProvider } from '@server/data/market/market-data.provider';
import {
  hasFinnhubApiKey,
  isLiveMarketApiIntegrationEnabled,
  LIVE_MARKET_API_SKIP_REASON,
} from './live-market-api-env';

describe('live market data integration', () => {
  it('Yahoo: KR daily chart returns positive price', async () => {
    if (!isLiveMarketApiIntegrationEnabled()) {
      return;
    }

    const quote = await fetchYahooChartQuote('005930.KS', '1d');
    expect(quote.currentPrice).toBeGreaterThan(0);
    expect(quote.points.length).toBeGreaterThan(0);
    expect(Number.isFinite(quote.changePercent ?? 0)).toBe(true);
  }, 45_000);

  it('Yahoo: US daily chart returns positive price', async () => {
    if (!isLiveMarketApiIntegrationEnabled()) {
      return;
    }

    const quote = await fetchYahooChartQuote('AAPL', '1d');
    expect(quote.currentPrice).toBeGreaterThan(0);
  }, 45_000);

  it('Finnhub: US quote when API key configured', async () => {
    if (!isLiveMarketApiIntegrationEnabled()) {
      return;
    }
    if (!hasFinnhubApiKey()) {
      return;
    }

    const provider = new MarketDataProvider();
    const quote = await provider.fetchStockQuote({
      id: 'live-aapl',
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
      currency: 'USD',
      yahooSymbol: 'AAPL',
      createdAt: new Date(),
    });
    expect(quote.currentPrice).toBeGreaterThan(0);
  }, 45_000);

  it('documents skip reason when integration flag off', () => {
    if (isLiveMarketApiIntegrationEnabled()) {
      expect(LIVE_MARKET_API_SKIP_REASON).toContain('LIVE_MARKET_API_INTEGRATION');
      return;
    }
    expect(LIVE_MARKET_API_SKIP_REASON.length).toBeGreaterThan(10);
  });
});
