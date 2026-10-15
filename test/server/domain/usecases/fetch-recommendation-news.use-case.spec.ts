import { afterEach, describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import { clearRecommendationNewsCache } from '@server/data/market/recommendation-news.cache';
import { FetchRecommendationNewsSnapshotsUseCase } from '@server/domain/usecases/market/fetch-recommendation-news.use-case';

describe('FetchRecommendationNewsSnapshotsUseCase', () => {
  const recentIso = () => new Date().toISOString();

  afterEach(() => {
    clearRecommendationNewsCache();
  });

  it('uses Finnhub articles for US when available', async () => {
    const marketData = {
      fetchCompanyNews: vi.fn().mockResolvedValue([
        {
          title: 'Apple beats earnings',
          publishedAt: recentIso(),
          source: 'finnhub',
          url: 'https://example.com',
        },
      ]),
      fetchGoogleNews: vi.fn(),
    };

    const useCase = new FetchRecommendationNewsSnapshotsUseCase(marketData as never);
    const snapshots = await useCase.execute([
      { symbol: 'AAPL', name: 'Apple', market: Market.US },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(marketData.fetchCompanyNews).toHaveBeenCalledOnce();
    expect(marketData.fetchGoogleNews).not.toHaveBeenCalled();
  });

  it('falls back to Google RSS when Finnhub throws', async () => {
    const marketData = {
      fetchCompanyNews: vi.fn().mockRejectedValue(new Error('timeout')),
      fetchGoogleNews: vi.fn().mockResolvedValue([
        {
          title: 'Apple stock moves on guidance',
          publishedAt: recentIso(),
          source: 'Google',
          url: 'https://news.example.com',
        },
      ]),
    };

    const useCase = new FetchRecommendationNewsSnapshotsUseCase(marketData as never);
    const snapshots = await useCase.execute([
      { symbol: 'AAPL', name: 'Apple', market: Market.US },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(marketData.fetchGoogleNews).toHaveBeenCalledOnce();
  });

  it('falls back to Google RSS when Finnhub returns empty', async () => {
    const marketData = {
      fetchCompanyNews: vi.fn().mockResolvedValue([]),
      fetchGoogleNews: vi.fn().mockResolvedValue([
        {
          title: 'Apple expands services',
          publishedAt: recentIso(),
          source: 'Google',
          url: 'https://news.example.com/2',
        },
      ]),
    };

    const useCase = new FetchRecommendationNewsSnapshotsUseCase(marketData as never);
    const snapshots = await useCase.execute([
      { symbol: 'AAPL', name: 'Apple', market: Market.US },
    ]);

    expect(snapshots).toHaveLength(1);
    expect(marketData.fetchGoogleNews).toHaveBeenCalledOnce();
  });

  it('uses Google RSS for KR without Finnhub', async () => {
    const marketData = {
      fetchCompanyNews: vi.fn(),
      fetchGoogleNews: vi.fn().mockResolvedValue([
        {
          title: '삼성전자 실적',
          publishedAt: recentIso(),
          source: 'Google',
          url: 'https://news.example.com/kr',
        },
      ]),
    };

    const useCase = new FetchRecommendationNewsSnapshotsUseCase(marketData as never);
    await useCase.execute([{ symbol: '005930', name: '삼성전자', market: Market.KR }]);

    expect(marketData.fetchCompanyNews).not.toHaveBeenCalled();
    expect(marketData.fetchGoogleNews).toHaveBeenCalledOnce();
  });
});
