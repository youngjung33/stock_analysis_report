import type { QuoteInsightInput, StockTechnicalSnapshot } from '@sar/shared';
import { FetchRecommendationQuotesUseCase, type RecommendationQuoteRequest } from './fetch-recommendation-quotes.use-case';
import {
  FetchRecommendationTechnicalSnapshotsUseCase,
  type RecommendationTechnicalRequest,
} from './fetch-recommendation-technical.use-case';

/** Phase G — batch fetch candidate quotes + technical snapshots */
export class BuildStockEnrichmentUseCase {
  constructor(
    private readonly fetchQuotesUseCase: FetchRecommendationQuotesUseCase,
    private readonly fetchTechnicalUseCase: FetchRecommendationTechnicalSnapshotsUseCase,
  ) {}

  async execute(targets: RecommendationQuoteRequest[]): Promise<{
    candidateQuotes: QuoteInsightInput[];
    technicalSnapshots: StockTechnicalSnapshot[];
  }> {
    const [candidateQuotes, technicalSnapshots] = await Promise.all([
      this.fetchQuotesUseCase.execute(targets),
      this.fetchTechnicalUseCase.execute(targets as RecommendationTechnicalRequest[]),
    ]);
    return { candidateQuotes, technicalSnapshots };
  }
}
