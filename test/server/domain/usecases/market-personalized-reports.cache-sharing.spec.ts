import { afterEach, describe, expect, it, vi } from 'vitest';
import { Market, createEnrichmentBatchQuality } from '@sar/shared';
import { clearMarketContextCacheForTests } from '@server/data/market/market-context.cache';
import { clearRecommendationQuoteCache } from '@server/data/market/recommendation-quote.cache';
import { resetUsFinnhubQueueForTests } from '@server/data/market/us-finnhub-queue';
import { GetMarketSentimentSummaryUseCase } from '@server/domain/usecases/market/get-market-sentiment-summary.use-case';
import { GetMarketAnalysisUseCase } from '@server/domain/usecases/market/get-market-analysis.use-case';
import { FetchRecommendationQuotesUseCase } from '@server/domain/usecases/market/fetch-recommendation-quotes.use-case';
import { BuildMarketContextUseCase } from '@server/domain/usecases/market/build-market-context.use-case';

/**
 * sentiment-summary와 full analysis가 연속 호출될 때
 * market context 캐시 + quote TTL 캐시가 중복 비용을 줄이는지 검증 (mock).
 */
describe('personalized market reports cache sharing', () => {
  afterEach(() => {
    clearMarketContextCacheForTests();
    clearRecommendationQuoteCache();
    resetUsFinnhubQueueForTests();
    vi.unstubAllEnvs();
  });

  it('second report reuses market context and cached recommendation quotes', async () => {
    vi.stubEnv('MARKET_CONTEXT_CACHE_TTL_MS', '60_000');

    const contextMarketData = {
      fetchChartSeries: vi.fn().mockResolvedValue({
        symbol: '^GSPC',
        closes: [100, 101],
        volumes: [1, 1],
        highs: [101, 102],
        lows: [99, 100],
        currentPrice: 101,
        changePercent1d: 1,
      }),
    };
    const buildMarketContextUseCase = new BuildMarketContextUseCase(contextMarketData as never);

    const fetchQuotes = vi.fn().mockResolvedValue([
      {
        symbol: 'AAPL',
        name: 'Apple',
        market: Market.US,
        currency: 'USD',
        currentPrice: 150,
        changePercent: 1,
      },
    ]);

    const catalogRepo = {
      findBySymbols: vi.fn().mockResolvedValue([]),
      listTopByMarketCap: vi.fn().mockResolvedValue([]),
    };

    const sentiment = new GetMarketSentimentSummaryUseCase(
      { execute: vi.fn().mockResolvedValue({ indices: [], fetchedAt: '' }) } as never,
      buildMarketContextUseCase as never,
      { execute: fetchQuotes } as never,
      catalogRepo as never,
    );

    const enrichment = {
      execute: vi.fn().mockResolvedValue({
        candidateQuotes: [],
        technicalSnapshots: [],
        newsSnapshots: [],
        eventSnapshots: [],
        figureStatements: [],
        quality: createEnrichmentBatchQuality(1),
      }),
    };

    const marketData = {
      fetchGoogleNews: vi.fn().mockResolvedValue([]),
      fetchFinnhubMarketNews: vi.fn().mockResolvedValue([]),
    };

    const analysis = new GetMarketAnalysisUseCase(
      buildMarketContextUseCase as never,
      enrichment as never,
      marketData as never,
      catalogRepo as never,
    );

    const holdings = [{ symbol: 'AAPL', market: Market.US, name: 'Apple' }];

    await sentiment.execute({ userHoldings: holdings });
    const seriesCallsAfterSentiment = contextMarketData.fetchChartSeries.mock.calls.length;
    expect(seriesCallsAfterSentiment).toBeGreaterThan(0);

    await analysis.execute({ userHoldings: holdings });
    expect(contextMarketData.fetchChartSeries.mock.calls.length).toBe(seriesCallsAfterSentiment);

    expect(fetchQuotes).toHaveBeenCalledTimes(1);
  });

  it('reuses 15m recommendation quote cache on second sentiment call', async () => {
    const marketData = {
      supports: () => true,
      isAvailable: () => true,
      fetchStockQuote: vi.fn().mockResolvedValue({ currentPrice: 150, changePercent: 1 }),
    };

    const fetchQuotesUseCase = new FetchRecommendationQuotesUseCase(marketData as never);

    const catalogRepo = {
      findBySymbols: vi.fn().mockResolvedValue([]),
      listTopByMarketCap: vi.fn().mockResolvedValue([]),
    };

    const sentiment = new GetMarketSentimentSummaryUseCase(
      { execute: vi.fn().mockResolvedValue({ indices: [], fetchedAt: '' }) } as never,
      {
        execute: vi.fn().mockResolvedValue({
          macro: [],
          sectors: [],
          indices: [],
          usdKrwRate: null,
          usdKrwChange1d: null,
          indexInputs: [],
          macroInputs: [],
          sectorInputs: [],
        }),
      } as never,
      fetchQuotesUseCase as never,
      catalogRepo as never,
    );

    const holdings = [{ symbol: 'AAPL', market: Market.US, name: 'Apple' }];
    await sentiment.execute({ userHoldings: holdings });
    await sentiment.execute({ userHoldings: holdings });

    expect(marketData.fetchStockQuote).toHaveBeenCalledTimes(1);
  });
});
