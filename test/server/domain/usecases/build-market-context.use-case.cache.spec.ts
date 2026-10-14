import { describe, expect, it, vi } from 'vitest';
import { clearMarketContextCacheForTests } from '@server/data/market/market-context.cache';
import { BuildMarketContextUseCase } from '@server/domain/usecases/market/build-market-context.use-case';

describe('BuildMarketContextUseCase cache', () => {
  it('reuses cached build within TTL', async () => {
    clearMarketContextCacheForTests();
    vi.stubEnv('MARKET_CONTEXT_CACHE_TTL_MS', '60_000');

    const marketData = {
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

    const useCase = new BuildMarketContextUseCase(marketData as never);
    await useCase.execute();
    const callsAfterFirst = marketData.fetchChartSeries.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    await useCase.execute();
    expect(marketData.fetchChartSeries.mock.calls.length).toBe(callsAfterFirst);

    vi.unstubAllEnvs();
  });
});
