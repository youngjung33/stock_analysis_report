import { Market } from '@sar/shared';
import { GetMarketStatusUseCase } from '@server/domain/usecases/market/get-market-status.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';
import { vi } from 'vitest';

describe('GetMarketStatusUseCase', () => {
  it('returns availability for KR and US providers', () => {
    const marketData = createMockMarketData({
      label: vi.fn((m: Market) =>
        m === Market.KR ? '한국 주식 (Yahoo Finance)' : '미국 주식 (Finnhub)',
      ),
      isAvailable: vi.fn((m: Market) => m === Market.KR),
      unavailableReason: vi.fn((m: Market) =>
        m === Market.US ? 'FINNHUB_API_KEY가 필요합니다.' : null,
      ),
    });

    const useCase = new GetMarketStatusUseCase(marketData);
    const status = useCase.execute();

    expect(status).toHaveLength(2);
    expect(status.find((s) => s.market === Market.KR)?.available).toBe(true);
    expect(status.find((s) => s.market === Market.US)?.available).toBe(false);
    expect(status.find((s) => s.market === Market.US)?.setupHint).toContain('FINNHUB_API_KEY');
  });
});
