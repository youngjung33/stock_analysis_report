import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';

vi.mock('@/client/data/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  readHeavyApiClientTimeoutMs: () => 90_000,
}));

import { apiClient } from '@/client/data/api/client';
import { ApiMarketRepository, ApiPortfolioRepository } from '@/client/data/repositories/api.repositories';

describe('Api repositories heavy timeout', () => {
  it('uses heavy timeout for market analysis GET and POST', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { insights: [] } });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { insights: [] } });

    const repo = new ApiMarketRepository();
    await repo.getMarketAnalysis();
    await repo.getMarketAnalysis({ userHoldings: [{ symbol: 'AAPL', market: Market.US }] });

    expect(apiClient.get).toHaveBeenCalledWith('/market/analysis', { timeout: 90_000 });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/market/analysis',
      expect.any(Object),
      { timeout: 90_000 },
    );
  });

  it('uses heavy timeout for stock analysis and portfolio analysis', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { symbol: 'AAPL', insights: [], currentPrice: 1, changePercent1d: 0 },
    });

    const marketRepo = new ApiMarketRepository();
    await marketRepo.getStockAnalysis({
      symbol: 'AAPL',
      name: 'Apple',
      market: Market.US,
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/market/stock-analysis',
      expect.objectContaining({ timeout: 90_000 }),
    );

    const portfolioRepo = new ApiPortfolioRepository();
    await portfolioRepo.getAnalysis();
    expect(apiClient.get).toHaveBeenCalledWith('/portfolio/analysis', { timeout: 90_000 });
  });
});
