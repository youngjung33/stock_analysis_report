import { vi } from 'vitest';
import { Market } from '@sar/shared';
import { BuildStockAnalysisReportUseCase } from '@server/domain/usecases/market/build-stock-analysis-report.use-case';

describe('BuildStockAnalysisReportUseCase', () => {
  it('assembles stock price explanation report from chart and enrichment', async () => {
    const getFeaturedQuotesUseCase = {
      execute: vi.fn().mockResolvedValue({
        kr: [
          {
            symbol: '005930',
            name: '삼성전자',
            market: Market.KR,
            currency: 'KRW',
            currentPrice: 70000,
            changePercent: 1,
          },
        ],
        us: [],
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
      }),
    };

    const buildStockEnrichmentUseCase = {
      execute: vi.fn().mockResolvedValue({
        candidateQuotes: [
          {
            symbol: '005930',
            name: '삼성전자',
            market: Market.KR,
            currency: 'KRW',
            currentPrice: 70000,
            changePercent: 1,
          },
        ],
        technicalSnapshots: [
          {
            symbol: '005930',
            market: Market.KR,
            trendKey: 'shared.market.trends.shortTermUp',
            rsi14: 55,
            rsVsBenchmark1w: 0.5,
            aboveSma20: true,
            aboveSma200: true,
          },
        ],
        newsSnapshots: [],
        eventSnapshots: [],
        figureStatements: [],
      }),
    };

    const closes = Array.from({ length: 60 }, (_, i) => 68000 + i * 50);
    const getStockQuoteUseCase = {
      execute: vi.fn().mockResolvedValue({
        symbol: '005930',
        market: Market.KR,
        currency: 'KRW',
        currentPrice: 70000,
        changePercent: 1,
        range: '6mo',
        points: closes.map((close, i) => ({
          timestamp: new Date(Date.now() - (closes.length - i) * 86400000).toISOString(),
          close,
        })),
      }),
    };

    const useCase = new BuildStockAnalysisReportUseCase(
      getFeaturedQuotesUseCase as never,
      buildMarketContextUseCase as never,
      buildStockEnrichmentUseCase as never,
      getStockQuoteUseCase as never,
    );

    const report = await useCase.execute({
      symbol: '005930',
      name: '삼성전자',
      market: Market.KR,
    });

    expect(report.symbol).toBe('005930');
    expect(report.insights.some((i) => i.category === 'stockAction')).toBe(true);
    expect(getStockQuoteUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: '005930', market: Market.KR, range: '6mo' }),
    );
    expect(buildStockEnrichmentUseCase.execute).toHaveBeenCalled();
  });

  it('throws STOCK_ANALYSIS_UNAVAILABLE when quote data is insufficient', async () => {
    const getFeaturedQuotesUseCase = { execute: vi.fn().mockResolvedValue({ kr: [], us: [], fetchedAt: '' }) };
    const buildMarketContextUseCase = {
      execute: vi.fn().mockResolvedValue({
        macro: [],
        sectors: [],
        indices: [],
        usdKrwRate: null,
        usdKrwChange1d: null,
      }),
    };
    const buildStockEnrichmentUseCase = {
      execute: vi.fn().mockResolvedValue({
        candidateQuotes: [],
        technicalSnapshots: [],
        newsSnapshots: [],
        eventSnapshots: [],
        figureStatements: [],
      }),
    };
    const getStockQuoteUseCase = {
      execute: vi.fn().mockResolvedValue({
        currentPrice: null,
        changePercent: null,
        points: [],
      }),
    };

    const useCase = new BuildStockAnalysisReportUseCase(
      getFeaturedQuotesUseCase as never,
      buildMarketContextUseCase as never,
      buildStockEnrichmentUseCase as never,
      getStockQuoteUseCase as never,
    );

    await expect(
      useCase.execute({ symbol: '005930', name: '삼성전자', market: Market.KR }),
    ).rejects.toThrow('STOCK_ANALYSIS_UNAVAILABLE');
  });
});
