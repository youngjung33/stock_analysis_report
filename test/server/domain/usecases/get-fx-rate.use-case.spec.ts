import { describe, expect, it, vi } from 'vitest';
import { GetFxRateUseCase } from '@server/domain/usecases/market/get-fx-rate.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';

describe('GetFxRateUseCase', () => {
  it('returns USD/KRW from market data provider', async () => {
    const marketData = createMockMarketData({
      fetchUsdKrwRate: vi.fn().mockResolvedValue(1380.5),
    });

    const useCase = new GetFxRateUseCase(marketData);
    const result = await useCase.execute();

    expect(result.usdKrwRate).toBe(1380.5);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(marketData.fetchUsdKrwRate).toHaveBeenCalledOnce();
  });

  it('propagates null when rate is unavailable', async () => {
    const marketData = createMockMarketData({
      fetchUsdKrwRate: vi.fn().mockResolvedValue(null),
    });

    const useCase = new GetFxRateUseCase(marketData);
    const result = await useCase.execute();

    expect(result.usdKrwRate).toBeNull();
  });
});
