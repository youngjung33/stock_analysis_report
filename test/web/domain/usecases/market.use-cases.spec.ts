import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { GetFeaturedQuotesUseCase, SearchStocksUseCase } from '@/client/domain/usecases/market/market.use-cases';

describe('client market use cases', () => {
  it('GetFeaturedQuotesUseCase delegates to repository', async () => {
    const marketRepo = {
      getFeaturedQuotes: vi.fn().mockResolvedValue({ kr: [], us: [], fetchedAt: '2026-01-01' }),
    };
    const useCase = new GetFeaturedQuotesUseCase(marketRepo as never);
    await useCase.execute();
    expect(marketRepo.getFeaturedQuotes).toHaveBeenCalled();
  });

  it('SearchStocksUseCase passes query and market', async () => {
    const marketRepo = {
      searchStocks: vi.fn().mockResolvedValue([]),
    };
    const useCase = new SearchStocksUseCase(marketRepo as never);
    await useCase.execute('apple', Market.US);
    expect(marketRepo.searchStocks).toHaveBeenCalledWith('apple', Market.US);
  });
});
