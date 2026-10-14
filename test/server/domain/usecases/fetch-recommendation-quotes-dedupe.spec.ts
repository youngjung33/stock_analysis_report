import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  FetchRecommendationQuotesUseCase,
  clearRecommendationQuoteInflightForTests,
} from '@server/domain/usecases/market/fetch-recommendation-quotes.use-case';

describe('FetchRecommendationQuotesUseCase in-flight dedupe', () => {
  it('shares one provider call for concurrent same-symbol fetches', async () => {
    clearRecommendationQuoteInflightForTests();
    let calls = 0;
    const marketData = {
      supports: () => true,
      isAvailable: () => true,
      fetchStockQuote: vi.fn().mockImplementation(async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 20));
        return { currentPrice: 100, changePercent: 1 };
      }),
    };

    const useCase = new FetchRecommendationQuotesUseCase(marketData as never);
    const stock = {
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
      currency: 'USD',
    };

    await Promise.all([
      useCase.execute([stock]),
      useCase.execute([stock]),
    ]);

    expect(calls).toBe(1);
    expect(marketData.fetchStockQuote).toHaveBeenCalledTimes(1);
  });
});
