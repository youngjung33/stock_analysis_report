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
            reason: 'FINNHUB_API_KEY',
            reasonCode: 'not_configured',
          },
        ],
      }),
    };

    const useCase = new GetFeaturedQuotesUseCase(fetchQuotesUseCase as never);
    const result = await useCase.execute();

    expect(result.kr.length).toBeGreaterThan(0);
    expect(result.us.length).toBeGreaterThan(0);
    expect(result.kr.find((s) => s.symbol === '005930')?.currentPrice).toBe(70000);
    expect(result.us.find((s) => s.symbol === 'AAPL')?.currentPrice).toBe(180);
    expect(result.us.find((s) => s.symbol === 'NVDA')?.unavailableReason).toContain('FINNHUB_API_KEY');
  });
});
