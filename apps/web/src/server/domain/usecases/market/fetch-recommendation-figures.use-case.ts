import { buildFigureStatementSnapshots, type FigureStatementSnapshot } from '@sar/shared';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationFigures,
  setCachedRecommendationFigures,
} from '../../../data/market/recommendation-figures.cache';

const FIGURE_NEWS_QUERY =
  '("Donald Trump" OR "Jerome Powell" OR "Elon Musk" OR "Tim Cook" OR "Jensen Huang" OR "이재용") (stock OR market OR tariff OR chip OR 반도체)';

/** §8.5 — global figure headline scan, 15m TTL (single fetch per batch) */
export class FetchRecommendationFigureStatementsUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(): Promise<FigureStatementSnapshot[]> {
    const cached = getCachedRecommendationFigures();
    if (cached) return cached;

    try {
      const items = await this.marketData.fetchGoogleNews(
        FIGURE_NEWS_QUERY,
        'global',
        'en-US',
        'US',
        15,
      );

      const snapshots = buildFigureStatementSnapshots(
        items.map((n) => ({
          title: n.title,
          publishedAt: n.publishedAt,
          source: n.source,
        })),
      );

      setCachedRecommendationFigures(snapshots);
      return snapshots;
    } catch {
      return [];
    }
  }
}
