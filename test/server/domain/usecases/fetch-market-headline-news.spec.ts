import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { fetchMarketHeadlineNews } from '@server/domain/usecases/market/fetch-market-headline-news';
import { createMockMarketData } from '../../mocks/repositories.mock';

describe('fetchMarketHeadlineNews', () => {
  it('merges KR/US Google and Finnhub items with ok quality', async () => {
    const recent = new Date().toISOString();
    const marketData = createMockMarketData({
      fetchGoogleNews: vi.fn().mockImplementation((_q, market: Market) =>
        Promise.resolve([
          {
            title: market === Market.KR ? 'KR headline' : 'US headline',
            publishedAt: recent,
            source: 'Google',
            url: `https://example.com/${market}`,
          },
        ]),
      ),
      fetchFinnhubMarketNews: vi.fn().mockResolvedValue([
        {
          title: 'Global headline',
          publishedAt: recent,
          source: 'finnhub',
          url: 'https://example.com/global',
        },
      ]),
    });

    const result = await fetchMarketHeadlineNews(marketData);

    expect(result.items).toHaveLength(3);
    expect(result.quality).toEqual({
      krGoogle: 'ok',
      usGoogle: 'ok',
      finnhubGeneral: 'ok',
    });
  });

  it('marks source failed when fetch throws', async () => {
    const marketData = createMockMarketData({
      fetchGoogleNews: vi
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce([]),
      fetchFinnhubMarketNews: vi.fn().mockRejectedValue(new Error('429')),
    });

    const result = await fetchMarketHeadlineNews(marketData);

    expect(result.quality.krGoogle).toBe('failed');
    expect(result.quality.usGoogle).toBe('empty');
    expect(result.quality.finnhubGeneral).toBe('failed');
    expect(result.items).toHaveLength(0);
  });
});
