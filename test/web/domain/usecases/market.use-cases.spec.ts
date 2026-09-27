import { describe, expect, it, vi } from 'vitest';
import {
  GetMarketIndicesUseCase,
  GetMarketSentimentSummaryUseCase,
  GetRecommendationHistoryUseCase,
  SearchStocksUseCase,
  FetchStockAnalysisUseCase,
} from '@/client/domain/usecases/market/market.use-cases';
import { Market } from '@sar/shared';

describe('market client use cases', () => {
  it('GetMarketIndicesUseCase delegates to repository', async () => {
    const marketRepo = {
      getMarketIndices: vi.fn().mockResolvedValue({ indices: [], fetchedAt: '2026-01-01' }),
    };
    const useCase = new GetMarketIndicesUseCase(marketRepo as never);
    await useCase.execute();
    expect(marketRepo.getMarketIndices).toHaveBeenCalled();
  });

  it('GetMarketSentimentSummaryUseCase delegates personalization to repository', async () => {
    const marketRepo = {
      getMarketSentimentSummary: vi.fn().mockResolvedValue({ indices: [], insights: {}, fetchedAt: '' }),
    };
    const useCase = new GetMarketSentimentSummaryUseCase(marketRepo as never);
    const options = {
      userWatchlist: [{ symbol: '005930', market: Market.KR, name: '삼성전자' }],
    };
    await useCase.execute(options);
    expect(marketRepo.getMarketSentimentSummary).toHaveBeenCalledWith(options);
  });
});
