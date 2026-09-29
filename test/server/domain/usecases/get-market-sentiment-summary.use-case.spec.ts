import { Market } from '@sar/shared';
import { GetMarketSentimentSummaryUseCase } from '@server/domain/usecases/market/get-market-sentiment-summary.use-case';
import { vi } from 'vitest';

describe('GetMarketSentimentSummaryUseCase', () => {
  it('returns indices and insights with sector candidate quotes', async () => {
    const getMarketIndicesUseCase = {
      execute: vi.fn().mockResolvedValue({
        indices: [
          {
            name: 'KOSPI',
            yahooSymbol: '^KS11',
            market: Market.KR,
            currentPrice: 2650,
            changePercent1d: 0.8,
          },
          {
            name: 'NASDAQ',
            yahooSymbol: '^IXIC',
            market: Market.US,
            currentPrice: 17800,
            changePercent1d: -0.3,
          },
        ],
        fetchedAt: '2026-01-01T00:00:00.000Z',
      }),
    };

    const buildMarketContextUseCase = {
      execute: vi.fn().mockResolvedValue({
        macro: [],
        sectors: [],
        indices: [
          { name: 'KOSPI', yahooSymbol: '^KS11', market: Market.KR, changePercent1d: 0.8 },
          { name: 'NASDAQ', yahooSymbol: '^IXIC', market: Market.US, changePercent1d: -0.3 },
        ],
        usdKrwRate: 1300,
        usdKrwChange1d: 0,
      }),
    };

    const fetchRecommendationQuotesUseCase = {
      execute: vi.fn().mockResolvedValue([
        {
          symbol: '005930',
          name: '삼성전자',
          market: Market.KR,
          currency: 'KRW',
          currentPrice: 70000,
          changePercent: 1.2,
        },
        {
          symbol: 'AAPL',
          name: 'Apple',
          market: Market.US,
          currency: 'USD',
          currentPrice: 190,
          changePercent: -0.5,
        },
      ]),
    };

    const catalogRepo = {
      findBySymbols: vi.fn().mockResolvedValue([]),
    };

    const useCase = new GetMarketSentimentSummaryUseCase(
      getMarketIndicesUseCase as never,
      buildMarketContextUseCase as never,
      fetchRecommendationQuotesUseCase as never,
      catalogRepo as never,
    );

    const result = await useCase.execute();

    expect(result.indices).toHaveLength(2);
    expect(result.insights.kr.label).toBeTruthy();
    expect(result.insights.recommendations.length).toBeGreaterThan(0);
    expect(fetchRecommendationQuotesUseCase.execute).toHaveBeenCalled();
  });

  it('includes watchlist symbols in candidate quote fetch', async () => {
    const getMarketIndicesUseCase = {
      execute: vi.fn().mockResolvedValue({
        indices: [
          { name: 'KOSPI', yahooSymbol: '^KS11', market: Market.KR, changePercent1d: 0 },
        ],
        fetchedAt: '2026-01-01T00:00:00.000Z',
      }),
    };

    const buildMarketContextUseCase = {
      execute: vi.fn().mockResolvedValue({
        macro: [],
        sectors: [],
        indices: [],
        usdKrwRate: 1300,
        usdKrwChange1d: 0,
      }),
    };

    const fetchRecommendationQuotesUseCase = {
      execute: vi.fn().mockResolvedValue([]),
    };

    const catalogRepo = {
      findBySymbols: vi.fn().mockResolvedValue([]),
    };

    const useCase = new GetMarketSentimentSummaryUseCase(
      getMarketIndicesUseCase as never,
      buildMarketContextUseCase as never,
      fetchRecommendationQuotesUseCase as never,
      catalogRepo as never,
    );

    await useCase.execute({
      userWatchlist: [{ symbol: 'GUESTONLY', market: Market.KR, name: '게스트종목' }],
    });

    const targets = fetchRecommendationQuotesUseCase.execute.mock.calls[0]?.[0] as Array<{
      symbol: string;
    }>;
    expect(targets.some((t) => t.symbol === 'GUESTONLY')).toBe(true);
  });
});
