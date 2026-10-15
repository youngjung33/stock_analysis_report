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

  it('dedupes concurrent execute while first build is in flight', async () => {
    clearMarketContextCacheForTests();
    vi.stubEnv('MARKET_CONTEXT_CACHE_TTL_MS', '60_000');

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const marketData = {
      fetchChartSeries: vi.fn().mockImplementation(() =>
        gate.then(() => ({
          symbol: '^GSPC',
          closes: [100, 101],
          volumes: [1, 1],
          highs: [101, 102],
          lows: [99, 100],
          currentPrice: 101,
          changePercent1d: 1,
        })),
      ),
    };

    const useCase = new BuildMarketContextUseCase(marketData as never);
    const first = useCase.execute();
    const second = useCase.execute();
    release();
    await Promise.all([first, second]);

    const calls = marketData.fetchChartSeries.mock.calls.length;
    expect(calls).toBeGreaterThan(0);

    vi.unstubAllEnvs();
  });
});
