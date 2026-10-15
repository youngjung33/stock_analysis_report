import { afterEach, describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { clearRecommendationEventsCache } from '@server/data/market/recommendation-events.cache';
import { FetchRecommendationEventSnapshotsUseCase } from '@server/domain/usecases/market/fetch-recommendation-events.use-case';

describe('FetchRecommendationEventSnapshotsUseCase', () => {
  afterEach(() => {
    clearRecommendationEventsCache();
  });

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

  it('falls back to headline when US earnings are empty', async () => {
    const marketData = {
      fetchCompanyEarnings: vi.fn().mockResolvedValue([]),
      fetchKrDisclosures: vi.fn(),
    };

    const useCase = new FetchRecommendationEventSnapshotsUseCase(marketData as never);
    const snapshots = await useCase.execute([
      {
        symbol: 'AAPL',
        market: Market.US,
        headlineSample: 'Apple reports Q3 earnings',
      },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.source).toBe('headline');
  });

  it('falls back to headline when KR DART returns nothing', async () => {
    const catalogRepo = {
      findDartCorpCodesBySymbols: vi.fn().mockResolvedValue({ '005930': '00126380' }),
    };
    const marketData = {
      fetchCompanyEarnings: vi.fn(),
      fetchKrDisclosures: vi.fn().mockResolvedValue([]),
    };

    const useCase = new FetchRecommendationEventSnapshotsUseCase(
      marketData as never,
      catalogRepo as never,
    );
    const snapshots = await useCase.execute([
      {
        symbol: '005930',
        market: Market.KR,
        headlineSample: '삼성전자 분기 실적 발표',
      },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.source).toBe('headline');
  });

  it('counts failed when no primary data and no headline', async () => {
    const marketData = {
      fetchCompanyEarnings: vi.fn().mockResolvedValue([]),
      fetchKrDisclosures: vi.fn(),
    };
    const quality = { requested: 0, received: 0, cacheHits: 0, failed: 0 };

    const useCase = new FetchRecommendationEventSnapshotsUseCase(marketData as never);
    const snapshots = await useCase.execute(
      [{ symbol: 'AAPL', market: Market.US }],
      { quality },
    );

    expect(snapshots).toHaveLength(0);
    expect(quality.failed).toBe(1);
  });
});
