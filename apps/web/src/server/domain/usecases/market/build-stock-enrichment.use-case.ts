import type { QuoteInsightInput, StockNewsSnapshot, StockTechnicalSnapshot } from '@sar/shared';
import { FetchRecommendationQuotesUseCase, type RecommendationQuoteRequest } from './fetch-recommendation-quotes.use-case';
import {
  FetchRecommendationTechnicalSnapshotsUseCase,
  type RecommendationTechnicalRequest,
} from './fetch-recommendation-technical.use-case';
import {
  FetchRecommendationNewsSnapshotsUseCase,
  type RecommendationNewsRequest,
} from './fetch-recommendation-news.use-case';

/** Phase G/H — batch fetch quotes + technical + news snapshots */
export class BuildStockEnrichmentUseCase {
  constructor(
    private readonly fetchQuotesUseCase: FetchRecommendationQuotesUseCase,
    private readonly fetchTechnicalUseCase: FetchRecommendationTechnicalSnapshotsUseCase,
    private readonly fetchNewsUseCase: FetchRecommendationNewsSnapshotsUseCase,
  ) {}

  async execute(targets: RecommendationQuoteRequest[]): Promise<{
    candidateQuotes: QuoteInsightInput[];
    technicalSnapshots: StockTechnicalSnapshot[];
    newsSnapshots: StockNewsSnapshot[];
  }> {
    const newsTargets: RecommendationNewsRequest[] = targets.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      market: t.market,
    }));

    const [candidateQuotes, technicalSnapshots, newsSnapshots] = await Promise.all([
      this.fetchQuotesUseCase.execute(targets),
      this.fetchTechnicalUseCase.execute(targets as RecommendationTechnicalRequest[]),
      this.fetchNewsUseCase.execute(newsTargets),
    ]);

    return { candidateQuotes, technicalSnapshots, newsSnapshots };
  }
}
