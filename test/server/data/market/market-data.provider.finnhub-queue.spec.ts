import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetUsFinnhubQueueForTests } from '@server/data/market/us-finnhub-queue';

const { mockCompanyNews } = vi.hoisted(() => ({
  mockCompanyNews: vi.fn(),
}));

vi.mock('@server/data/market/finnhub-news.client', () => ({
  fetchFinnhubCompanyNews: (...args: unknown[]) => mockCompanyNews(...args),
  fetchFinnhubMarketNews: vi.fn().mockResolvedValue([]),
}));

vi.mock('@server/data/market/finnhub-earnings.client', () => ({
  fetchFinnhubEarningsCalendar: vi.fn().mockResolvedValue([]),
}));

import { MarketDataProvider } from '@server/data/market/market-data.provider';

describe('MarketDataProvider Finnhub queue', () => {
  afterEach(() => {
    resetUsFinnhubQueueForTests();
    vi.stubEnv('US_FINNHUB_QUEUE_GAP_MS', '0');
    mockCompanyNews.mockReset();
  });

  it('serializes concurrent fetchCompanyNews calls (max one in flight)', async () => {
    let active = 0;
    let maxActive = 0;
    mockCompanyNews.mockImplementation(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 25));
      active -= 1;
      return [];
    });

    const provider = new MarketDataProvider();
    await Promise.all([
      provider.fetchCompanyNews('AAPL', 3),
      provider.fetchCompanyNews('MSFT', 3),
    ]);

    expect(maxActive).toBe(1);
    expect(mockCompanyNews).toHaveBeenCalledTimes(2);
  });
});
