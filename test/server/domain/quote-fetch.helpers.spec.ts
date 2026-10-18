import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  fetchQuoteForStock,
  recordQuoteFailure,
} from '@server/domain/usecases/market/quote-fetch.helpers';
import { createMockStock } from '../mocks/repositories.mock';

describe('quote-fetch.helpers', () => {
  it('recordQuoteFailure appends structured failure', () => {
    const failed: Array<{ reasonCode: string }> = [];
    recordQuoteFailure(failed as never, { id: 's1', symbol: 'AAPL', market: Market.US }, 'fetch_error');
    expect(failed).toHaveLength(1);
    expect(failed[0].reasonCode).toBe('fetch_error');
  });

  it('returns null when market is not supported', async () => {
    const marketData = {
      supports: vi.fn(() => false),
      isAvailable: vi.fn(() => true),
      fetchStockQuote: vi.fn(),
    };
    const failed: unknown[] = [];
    const result = await fetchQuoteForStock(
      marketData as never,
      createMockStock({ market: Market.US }),
      failed as never,
    );
    expect(result).toBeNull();
    expect(failed).toHaveLength(1);
  });

  it('returns quote on success', async () => {
    const marketData = {
      supports: vi.fn(() => true),
      isAvailable: vi.fn(() => true),
      fetchStockQuote: vi.fn().mockResolvedValue({ currentPrice: 100, changePercent: 1 }),
    };
    const failed: unknown[] = [];
    const result = await fetchQuoteForStock(
      marketData as never,
      createMockStock(),
      failed as never,
    );
    expect(result?.currentPrice).toBe(100);
    expect(failed).toHaveLength(0);
  });
});
