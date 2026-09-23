import { Market } from '@sar/shared';
import { GetMarketIndicesUseCase } from '@server/domain/usecases/market/get-market-indices.use-case';
import { vi } from 'vitest';

describe('GetMarketIndicesUseCase', () => {
  it('returns KOSPI and NASDAQ index quotes', async () => {
    const marketData = {
      fetchChartSeries: vi.fn().mockImplementation((symbol: string) =>
        Promise.resolve({
          currentPrice: symbol === '^KS11' ? 2650.12 : 17834.56,
          changePercent1d: symbol === '^KS11' ? 0.8 : -0.3,
        }),
      ),
    };

    const useCase = new GetMarketIndicesUseCase(marketData as never);
    const result = await useCase.execute();

    expect(result.indices).toHaveLength(2);
    expect(result.indices.find((i) => i.yahooSymbol === '^KS11')).toMatchObject({
      name: 'KOSPI',
      market: Market.KR,
      currentPrice: 2650.12,
      changePercent1d: 0.8,
    });
    expect(result.indices.find((i) => i.yahooSymbol === '^IXIC')).toMatchObject({
      name: 'NASDAQ',
      market: Market.US,
      currentPrice: 17834.56,
      changePercent1d: -0.3,
    });
    expect(result.fetchedAt).toBeTruthy();
  });
});
