import { vi } from 'vitest';
import { Market } from '@sar/shared';
import { GetMarketAnalysisUseCase } from '@server/domain/usecases/market/get-market-analysis.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';

describe('GetMarketAnalysisUseCase', () => {
  it('builds market analysis report with candidate pool enrichment', async () => {
    const buildMarketContextUseCase = {
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
    };

    const buildStockEnrichmentUseCase = {
      execute: vi.fn().mockResolvedValue({
        candidateQuotes: [],
        technicalSnapshots: [],
        newsSnapshots: [{
          symbol: 'AAPL',
          market: Market.US,
          headlineSample: 'Apple beats',
          recentTitles: ['Apple beats'],
          tone: 'bullish',
          relevanceScore: 0.5,
          articleCount: 1,
          primarySourceCount: 0,
          secondarySourceCount: 1,
          dedupeKey: 'news:AAPL:beats',
        }],
        eventSnapshots: [],
        figureStatements: [
          {
            figureId: 'musk',
            figureName: 'Musk',
            impactTier: 2,
            linkScope: 'symbol_direct',
            tone: 'bullish',
            headline: 'Tesla outlook',
            publishedAt: new Date().toISOString(),
            dedupeKey: 'fig-1',
            sourceChannel: 'rss',
            primarySymbols: ['TSLA'],
            sectorTags: [],
            topicTags: [],
          },
        ],
      }),
    };

    const marketData = createMockMarketData();

    const catalogRepo = {
      findBySymbols: vi.fn().mockResolvedValue([]),
      listTopByMarketCap: vi.fn().mockResolvedValue([]),
    };

    const useCase = new GetMarketAnalysisUseCase(
      buildMarketContextUseCase as never,
      buildStockEnrichmentUseCase as never,
      marketData,
      catalogRepo as never,
    );
    const report = await useCase.execute({
      userHoldings: [{ symbol: '005930', market: Market.KR }],
      userWatchlist: [{ symbol: 'AAPL', market: Market.US }],
    });

    expect(report.fetchedAt).toBeTruthy();
    expect(report.figureStatements).toHaveLength(1);
    expect(buildMarketContextUseCase.execute).toHaveBeenCalled();
    expect(buildStockEnrichmentUseCase.execute).toHaveBeenCalled();
  });
});
