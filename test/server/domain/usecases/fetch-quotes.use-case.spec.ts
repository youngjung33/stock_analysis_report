import { afterEach, describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { FetchQuotesUseCase } from '@server/domain/usecases/market/fetch-quotes.use-case';
import { createMockMarketData } from '../../mocks/repositories.mock';

describe('FetchQuotesUseCase', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches KR quotes and records success', async () => {
    const marketData = createMockMarketData({
      fetchStockQuote: vi.fn().mockResolvedValue({ currentPrice: 70_000, changePercent: 1.1 }),
    });

    const useCase = new FetchQuotesUseCase(marketData);
    const result = await useCase.execute([
      { stockId: 'kr-1', symbol: '005930', market: Market.KR },
    ]);

    expect(result.updated).toBe(1);
    expect(result.quotes).toHaveLength(1);
    expect(result.quotes[0]).toMatchObject({
      stockId: 'kr-1',
      currentPrice: 70_000,
      changePercent: 1.1,
    });
    expect(result.succeeded).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
  });

  it('records failure when provider is unavailable', async () => {
    const marketData = createMockMarketData({
      isAvailable: vi.fn(() => false),
      unavailableReasonCode: vi.fn(() => 'finnhub_api_key_required'),
    });

    const useCase = new FetchQuotesUseCase(marketData);
    const result = await useCase.execute([
      { stockId: 'us-1', symbol: 'AAPL', market: Market.US },
    ]);

    expect(result.updated).toBe(0);
    expect(result.quotes).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].reasonCode).toBe('not_configured');
  });

  it('sleeps between US symbols for Finnhub pacing', async () => {
    vi.useFakeTimers();
    const marketData = createMockMarketData({
      fetchStockQuote: vi.fn().mockResolvedValue({ currentPrice: 150, changePercent: 0.5 }),
    });

    const useCase = new FetchQuotesUseCase(marketData);
    const promise = useCase.execute([
      { stockId: 'us-1', symbol: 'AAPL', market: Market.US },
      { stockId: 'us-2', symbol: 'MSFT', market: Market.US },
    ]);

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.updated).toBe(2);
    expect(marketData.fetchStockQuote).toHaveBeenCalledTimes(2);
  });
});
