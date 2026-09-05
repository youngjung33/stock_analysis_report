import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { GetFeaturedQuotesUseCase, GetRecommendationHistoryUseCase, SearchStocksUseCase, FetchStockAnalysisUseCase } from '@/client/domain/usecases/market/market.use-cases';

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

  it('GetRecommendationHistoryUseCase delegates limit to repository', async () => {
    const marketRepo = {
      getRecommendationHistory: vi.fn().mockResolvedValue({ batches: [] }),
    };
    const useCase = new GetRecommendationHistoryUseCase(marketRepo as never);
    await useCase.execute(15);
    expect(marketRepo.getRecommendationHistory).toHaveBeenCalledWith(15);
  });

  it('FetchStockAnalysisUseCase delegates to repository', async () => {
    const marketRepo = {
      getStockAnalysis: vi.fn().mockResolvedValue({ symbol: '000660' }),
    };
    const useCase = new FetchStockAnalysisUseCase(marketRepo as never);
    await useCase.execute({
      symbol: '000660',
      name: 'SK하이닉스',
      market: Market.KR,
      yahooSymbol: '000660.KS',
    });
    expect(marketRepo.getStockAnalysis).toHaveBeenCalledWith({
      symbol: '000660',
      name: 'SK하이닉스',
      market: Market.KR,
      yahooSymbol: '000660.KS',
    });
  });
});
