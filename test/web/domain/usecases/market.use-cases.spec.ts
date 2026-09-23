import { describe, expect, it, vi } from 'vitest';
import { GetMarketIndicesUseCase, GetRecommendationHistoryUseCase, SearchStocksUseCase, FetchStockAnalysisUseCase } from '@/client/domain/usecases/market/market.use-cases';

describe('market client use cases', () => {
  it('GetMarketIndicesUseCase delegates to repository', async () => {
    const marketRepo = {
      getMarketIndices: vi.fn().mockResolvedValue({ indices: [], fetchedAt: '2026-01-01' }),
    };
    const useCase = new GetMarketIndicesUseCase(marketRepo as never);
    await useCase.execute();
    expect(marketRepo.getMarketIndices).toHaveBeenCalled();
  });
});
