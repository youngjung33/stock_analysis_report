import { Market } from '@sar/shared';
import { GetMarketStatusUseCase } from '@server/domain/usecases/market/get-market-status.use-case';
import { vi } from 'vitest';

function createProvider(options: {
  market: Market;
  label: string;
  available: boolean;
  setupHint?: string | null;
}) {
  return {
    supports: vi.fn((m: Market) => m === options.market),
    label: vi.fn(() => options.label),
    isAvailable: vi.fn(() => options.available),
    unavailableReason: vi.fn(() => options.setupHint ?? null),
    fetchQuote: vi.fn(),
  };
}

describe('GetMarketStatusUseCase', () => {
  it('returns availability for KR and US providers', () => {
    const useCase = new GetMarketStatusUseCase([
      createProvider({
        market: Market.KR,
        label: '한국 주식 (Yahoo Finance)',
        available: true,
      }),
      createProvider({
        market: Market.US,
        label: '미국 주식 (Finnhub)',
        available: false,
        setupHint: 'FINNHUB_API_KEY가 필요합니다.',
      }),
    ]);

    const status = useCase.execute();
    expect(status).toHaveLength(2);
    expect(status.find((s) => s.market === Market.KR)?.available).toBe(true);
    expect(status.find((s) => s.market === Market.US)?.available).toBe(false);
    expect(status.find((s) => s.market === Market.US)?.setupHint).toContain('FINNHUB_API_KEY');
  });
});
