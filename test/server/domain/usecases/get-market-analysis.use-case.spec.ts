import { vi } from 'vitest';
import { Market } from '@sar/shared';
import { GetMarketAnalysisUseCase } from '@server/domain/usecases/market/get-market-analysis.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';

describe('GetMarketAnalysisUseCase', () => {
  it('builds market analysis report with full stock enrichment', async () => {
    const getFeaturedQuotesUseCase = {
      execute: vi.fn().mockResolvedValue({
        kr: [{ symbol: '005930', name: '삼성전자', market: Market.KR, currency: 'KRW', currentPrice: 70000, changePercent: 1, fetchedAt: new Date().toISOString() }],
        us: [{ symbol: 'AAPL', name: 'Apple', market: Market.US, currency: 'USD', currentPrice: 180, changePercent: -0.5, fetchedAt: new Date().toISOString() }],
        fetchedAt: new Date().toISOString(),
      }),
    };

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
        newsSnapshots: [{ symbol: 'AAPL', market: Market.US, headlineSample: 'Apple beats', tone: 'bullish' }],
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

    const useCase = new GetMarketAnalysisUseCase(
      getFeaturedQuotesUseCase as never,
      buildMarketContextUseCase as never,
      buildStockEnrichmentUseCase as never,
      marketData,
    );
    const report = await useCase.execute();

    expect(report.krQuotes.length).toBeGreaterThan(0);
    expect(report.usQuotes.length).toBeGreaterThan(0);
    expect(report.fetchedAt).toBeTruthy();
    expect(report.figureStatements).toHaveLength(1);
    expect(getFeaturedQuotesUseCase.execute).toHaveBeenCalled();
    expect(buildMarketContextUseCase.execute).toHaveBeenCalled();
    expect(buildStockEnrichmentUseCase.execute).toHaveBeenCalledWith([
      expect.objectContaining({ symbol: '005930', market: Market.KR }),
      expect.objectContaining({ symbol: 'AAPL', market: Market.US }),
    ]);
  });
});
