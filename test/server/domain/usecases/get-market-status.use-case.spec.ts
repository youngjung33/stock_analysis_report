import { Market } from '@sar/shared';
import { GetMarketStatusUseCase } from '@server/domain/usecases/market/get-market-status.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';
import { vi } from 'vitest';

describe('GetMarketStatusUseCase', () => {
  it('returns availability for KR and US providers', () => {
    const marketData = createMockMarketData({
      isAvailable: vi.fn((m: Market) => m === Market.KR),
      unavailableReasonCode: vi.fn((m: Market) =>
        m === Market.US ? 'finnhub_api_key_required' : null,
      ),
    });

    const useCase = new GetMarketStatusUseCase(marketData);
    const status = useCase.execute();

    expect(status).toHaveLength(2);
    expect(status.find((s) => s.market === Market.KR)?.available).toBe(true);
    expect(status.find((s) => s.market === Market.US)?.available).toBe(false);
    expect(status.find((s) => s.market === Market.US)?.setupHintCode).toBe('finnhub_api_key_required');
  });
});
