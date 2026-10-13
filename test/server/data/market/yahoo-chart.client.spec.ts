import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchYahooChartQuote, fetchYahooChartSeries } from '@server/data/market/yahoo-chart.client';

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

  it('6mo range: 당일 등락은 live vs 전일 종가 (6개월 수익률 아님) — 종목 집중 분석 회귀', async () => {
    const yesterdaySec = Math.floor(Date.now() / 1000) - 86_400;
    const twoDaysAgoSec = yesterdaySec - 86_400;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [
            {
              meta: { regularMarketPrice: 480_000 },
              timestamp: [1_600_000_000, twoDaysAgoSec, yesterdaySec],
              indicators: {
                quote: [{ close: [300_000, 510_000, 500_000] }],
              },
            },
          ],
        },
      }),
    });

    const quote = await fetchYahooChartQuote('000660.KS', '6mo');
    expect(quote.currentPrice).toBe(480_000);
    expect(quote.changePercent).toBeCloseTo(-4, 1);
    const fullPeriodWrong = ((480_000 - 300_000) / 300_000) * 100;
    expect(quote.changePercent).not.toBeCloseTo(fullPeriodWrong, 0);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('interval=1d&range=6mo'),
      expect.any(Object),
    );
  });

  it('uses 1d change (not full-period return) for long daily ranges like 5y', async () => {
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
    expect(quote.changePercent).toBeCloseTo(25, 1);
    expect(quote.points).toHaveLength(4);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('interval=1wk&range=5y'),
      expect.any(Object),
    );
  });
});

describe('fetchYahooChartSeries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives 1d change from daily bars when last bar is today', async () => {
    const todaySec = Math.floor(Date.now() / 1000);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [
            {
              meta: { regularMarketPrice: 18_650, chartPreviousClose: 10_050 },
              timestamp: [todaySec - 172_800, todaySec - 86_400, todaySec],
              indicators: {
                quote: [{
                  close: [10_000, 10_050, 10_072],
                  volume: [1, 1, 1],
                  high: [10_010, 10_060, 10_080],
                  low: [9_990, 10_040, 10_060],
                }],
              },
            },
          ],
        },
      }),
    });

    const series = await fetchYahooChartSeries('091160.KS');
    expect(series.currentPrice).toBe(18_650);
    expect(series.changePercent1d).toBeCloseTo(0.219, 2);
  });
});
