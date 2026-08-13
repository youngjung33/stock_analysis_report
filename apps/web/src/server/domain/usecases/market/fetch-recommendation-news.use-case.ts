import { Market, buildStockNewsSnapshot, type StockNewsSnapshot } from '@sar/shared';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationNews,
  setCachedRecommendationNews,
} from '../../../data/market/recommendation-news.cache';

export interface RecommendationNewsRequest {
  symbol: string;
  name: string;
  market: Market;
}

/** §8.2 — KR Google RSS / US Finnhub company news, 15m TTL */
export class FetchRecommendationNewsSnapshotsUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(stocks: RecommendationNewsRequest[]): Promise<StockNewsSnapshot[]> {
    if (stocks.length === 0) return [];

    const snapshots: StockNewsSnapshot[] = [];
    const seen = new Set<string>();

    for (const stock of stocks.slice(0, 40)) {
      const key = `${stock.market}:${stock.symbol.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const cached = getCachedRecommendationNews(stock.symbol, stock.market);
      if (cached) {
        snapshots.push(cached);
        continue;
      }

      try {
        const articles = await this.fetchArticles(stock);
        const snap = buildStockNewsSnapshot({
          symbol: stock.symbol,
          market: stock.market,
          name: stock.name,
          articles,
        });
        if (snap) {
          setCachedRecommendationNews(snap);
          snapshots.push(snap);
        }
      } catch {
        // skip failed symbol
      }

      if (stock.market === Market.US) {
        await sleep(1100);
      }
    }

    return snapshots;
  }

  private async fetchArticles(stock: RecommendationNewsRequest) {
    if (stock.market === Market.US) {
      const finnhub = await this.marketData.fetchCompanyNews(stock.symbol, 5);
      if (finnhub.length > 0) {
        return finnhub.map((n) => ({
          title: n.title,
          publishedAt: n.publishedAt,
          source: n.source,
        }));
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

    return items.map((n) => ({
      title: n.title,
      publishedAt: n.publishedAt,
      source: n.source,
    }));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
