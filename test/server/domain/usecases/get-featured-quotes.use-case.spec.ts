import { Market } from '@sar/shared';
import { GetFeaturedQuotesUseCase } from '@server/domain/usecases/market/get-featured-quotes.use-case';
import { vi } from 'vitest';

describe('GetFeaturedQuotesUseCase', () => {
  it('maps fetch results into kr and us sections', async () => {
    const fetchQuotesUseCase = {
      execute: vi.fn().mockResolvedValue({
        updated: 2,
        quotes: [
          {
            stockId: 'featured-KR-005930',
            currentPrice: 70000,
            changePercent: 1.2,
            fetchedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            stockId: 'featured-US-AAPL',
            currentPrice: 180,
            changePercent: -0.5,
            fetchedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        succeeded: [],
        failed: [
          {
            stockId: 'featured-US-NVDA',
            symbol: 'NVDA',
            market: Market.US,
            reasonCode: 'not_configured',
          },
        ],
      }),
    };

    const marketData = {
      fetchChartSeries: vi.fn().mockImplementation((symbol: string) =>
        Promise.resolve({
          currentPrice: symbol === '^KS11' ? 2650.12 : 17834.56,
          changePercent1d: symbol === '^KS11' ? 0.8 : -0.3,
        }),
      ),
    };

    const useCase = new GetFeaturedQuotesUseCase(fetchQuotesUseCase as never, marketData as never);
    const result = await useCase.execute();

    expect(result.kr.length).toBeGreaterThan(0);
    expect(result.us.length).toBeGreaterThan(0);
    expect(result.indices).toHaveLength(2);
    expect(result.indices.find((i) => i.yahooSymbol === '^KS11')?.currentPrice).toBe(2650.12);
    expect(result.indices.find((i) => i.yahooSymbol === '^KS11')?.changePercent1d).toBe(0.8);
    expect(result.indices.find((i) => i.yahooSymbol === '^IXIC')?.currentPrice).toBe(17834.56);
    expect(result.indices.find((i) => i.yahooSymbol === '^IXIC')?.changePercent1d).toBe(-0.3);
    expect(result.kr.find((s) => s.symbol === '005930')?.currentPrice).toBe(70000);
    expect(result.us.find((s) => s.symbol === 'AAPL')?.currentPrice).toBe(180);
    expect(result.us.find((s) => s.symbol === 'NVDA')?.unavailableReasonCode).toBe('not_configured');
  });
});
