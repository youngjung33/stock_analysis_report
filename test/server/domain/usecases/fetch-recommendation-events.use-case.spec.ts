import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { FetchRecommendationEventSnapshotsUseCase } from '@server/domain/usecases/market/fetch-recommendation-events.use-case';

describe('FetchRecommendationEventSnapshotsUseCase', () => {
  it('falls back to headline when US earnings fetch throws', async () => {
    const marketData = {
      fetchCompanyEarnings: vi.fn().mockRejectedValue(new Error('timeout')),
      fetchKrDisclosures: vi.fn(),
    };

    const useCase = new FetchRecommendationEventSnapshotsUseCase(marketData as never);
    const snapshots = await useCase.execute([
      {
        symbol: 'AAPL',
        market: Market.US,
        headlineSample: 'Apple Q3 earnings beat estimates',
      },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.symbol).toBe('AAPL');
    expect(snapshots[0]?.source).toBe('headline');
    expect(marketData.fetchCompanyEarnings).toHaveBeenCalledOnce();
  });
});
