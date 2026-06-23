import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchYahooChartQuote } from '@server/data/market/yahoo-chart.client';

describe('fetchYahooChartQuote range', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses meta for 1d range', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [{
            meta: { regularMarketPrice: 100, chartPreviousClose: 90 },
            timestamp: [1_700_000_000, 1_700_003_600],
            indicators: { quote: [{ close: [95, 100] }] },
          }],
        },
      }),
    });

    const quote = await fetchYahooChartQuote('AAPL', '1d');
    expect(quote.currentPrice).toBe(100);
    expect(quote.changePercent).toBeCloseTo(11.11, 1);
    expect(quote.range).toBe('1d');
    expect(quote.points).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('interval=5m&range=1d'),
      expect.any(Object),
    );
  });

  it('computes change from closes for 5y range', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [
            {
              timestamp: [1_600_000_000, 1_610_000_000, 1_620_000_000, 1_630_000_000],
              indicators: { quote: [{ close: [50, 60, 80, 100] }] },
            },
          ],
        },
      }),
    });

    const quote = await fetchYahooChartQuote('AAPL', '5y');
    expect(quote.currentPrice).toBe(100);
    expect(quote.changePercent).toBe(100);
    expect(quote.points).toHaveLength(4);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('interval=1wk&range=5y'),
      expect.any(Object),
    );
  });
});
