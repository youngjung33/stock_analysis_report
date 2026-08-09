import { vi } from 'vitest';
import { Market } from '@sar/shared';
import { GetMarketAnalysisUseCase } from '@server/domain/usecases/market/get-market-analysis.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';

describe('GetMarketAnalysisUseCase', () => {
  it('builds market analysis report from featured quotes and market data', async () => {
    const getFeaturedQuotesUseCase = {
      execute: vi.fn().mockResolvedValue({
        kr: [{ symbol: '005930', name: '삼성전자', market: Market.KR, currentPrice: 70000, changePercent: 1, fetchedAt: new Date().toISOString() }],
        us: [{ symbol: 'AAPL', name: 'Apple', market: Market.US, currentPrice: 180, changePercent: -0.5, fetchedAt: new Date().toISOString() }],
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

    const marketData = createMockMarketData();

    const useCase = new GetMarketAnalysisUseCase(
      getFeaturedQuotesUseCase as never,
      buildMarketContextUseCase as never,
      marketData,
    );
    const report = await useCase.execute();

    expect(report.krQuotes.length).toBeGreaterThan(0);
    expect(report.usQuotes.length).toBeGreaterThan(0);
    expect(report.fetchedAt).toBeTruthy();
    expect(getFeaturedQuotesUseCase.execute).toHaveBeenCalled();
    expect(buildMarketContextUseCase.execute).toHaveBeenCalled();
  });
});
