import { Market, buildStockNewsSnapshot, type StockNewsSnapshot } from '@sar/shared';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationNews,
  setCachedRecommendationNews,
} from '../../../data/market/recommendation-news.cache';
import type { EnrichmentFetchOptions } from './enrichment-fetch.types';
import { throttleAfterUsProviderSuccess } from './recommendation-provider-throttle';

export interface RecommendationNewsRequest {
  symbol: string;
  name: string;
  market: Market;
}

/** §8.2 — KR Google RSS / US Finnhub company news, 15m TTL */
export class FetchRecommendationNewsSnapshotsUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(
    stocks: RecommendationNewsRequest[],
    options?: EnrichmentFetchOptions,
  ): Promise<StockNewsSnapshot[]> {
    if (stocks.length === 0) return [];

    const snapshots: StockNewsSnapshot[] = [];
    const seen = new Set<string>();
    const quality = options?.quality;

    for (const stock of stocks.slice(0, 40)) {
      const key = `${stock.market}:${stock.symbol.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (quality) quality.requested += 1;

      const cached =
        options?.bypassCache ? null : getCachedRecommendationNews(stock.symbol, stock.market);
      if (cached) {
        if (quality) {
          quality.cacheHits += 1;
          quality.received += 1;
        }
        snapshots.push(cached);
        continue;
      }

      try {
        const { articles, usProviderCalled } = await this.fetchArticles(stock);
        const snap = buildStockNewsSnapshot({
          symbol: stock.symbol,
          market: stock.market,
          name: stock.name,
          articles,
        });
        if (snap) {
          setCachedRecommendationNews(snap);
          snapshots.push(snap);
          if (quality) quality.received += 1;
        } else if (quality) {
          quality.failed += 1;
        }
        if (usProviderCalled) {
          await throttleAfterUsProviderSuccess();
        }
      } catch {
        if (quality) quality.failed += 1;
      }
    }

    return snapshots;
  }

  private async fetchArticles(stock: RecommendationNewsRequest): Promise<{
    articles: Array<{ title: string; publishedAt: string; source: string }>;
    usProviderCalled: boolean;
  }> {
    if (stock.market === Market.US) {
      try {
        const finnhub = await this.marketData.fetchCompanyNews(stock.symbol, 5);
        if (finnhub.length > 0) {
          return {
            usProviderCalled: true,
            articles: finnhub.map((n) => ({
              title: n.title,
              publishedAt: n.publishedAt,
              source: n.source,
            })),
          };
        }
      } catch {
        /* Google RSS fallback — Finnhub 타임아웃·오류 시에도 뉴스 수집 시도 */
      }
    }

    const query =
      stock.market === Market.KR
        ? `"${stock.name}" OR "${stock.symbol}" 주식`
        : `"${stock.name}" OR ${stock.symbol} stock`;

    const items = await this.marketData.fetchGoogleNews(
      query,
      stock.market,
      stock.market === Market.KR ? 'ko' : 'en-US',
      stock.market === Market.KR ? 'KR' : 'US',
      5,
    );

    return {
      usProviderCalled: false,
      articles: items.map((n) => ({
        title: n.title,
        publishedAt: n.publishedAt,
        source: n.source,
      })),
    };
  }
}
