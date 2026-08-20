import {
  buildFigureSnsNewsQuery,
  buildFigureStatementSnapshots,
  FIGURE_RSS_FETCH_LIMIT,
  FIGURE_SNS_FETCH_LIMIT,
  mergeFigureStatementArticles,
  type FigureStatementSnapshot,
} from '@sar/shared';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationFigures,
  setCachedRecommendationFigures,
} from '../../../data/market/recommendation-figures.cache';

const FIGURE_NEWS_QUERY =
  '("Donald Trump" OR "Jerome Powell" OR "Elon Musk" OR "Tim Cook" OR "Jensen Huang" OR "이재용") (stock OR market OR tariff OR chip OR 반도체)';

/** §8.5 — global figure headline scan (RSS + X/SNS 2nd), 15m TTL */
export class FetchRecommendationFigureStatementsUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(): Promise<FigureStatementSnapshot[]> {
    const cached = getCachedRecommendationFigures();
    if (cached) return cached;

    try {
      const [rssItems, snsItems] = await Promise.all([
        this.marketData.fetchGoogleNews(FIGURE_NEWS_QUERY, 'global', 'en-US', 'US', FIGURE_RSS_FETCH_LIMIT),
        this.marketData
          .fetchGoogleNews(buildFigureSnsNewsQuery(), 'global', 'en-US', 'US', FIGURE_SNS_FETCH_LIMIT)
          .catch(() => []),
      ]);

      const articles = mergeFigureStatementArticles(
        rssItems.map((n) => ({
          title: n.title,
          publishedAt: n.publishedAt,
          source: n.source,
          sourceChannel: 'rss' as const,
        })),
        snsItems.map((n) => ({
          title: n.title,
          publishedAt: n.publishedAt,
          source: n.source,
          sourceChannel: 'sns' as const,
        })),
      );

      const snapshots = buildFigureStatementSnapshots(articles);

      setCachedRecommendationFigures(snapshots);
      return snapshots;
    } catch {
      return [];
    }
  }
}
