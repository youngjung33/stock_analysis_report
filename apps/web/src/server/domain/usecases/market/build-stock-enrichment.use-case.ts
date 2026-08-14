import type {
  QuoteInsightInput,
  StockEventSnapshot,
  StockNewsSnapshot,
  StockTechnicalSnapshot,
} from '@sar/shared';
import { FetchRecommendationQuotesUseCase, type RecommendationQuoteRequest } from './fetch-recommendation-quotes.use-case';
import {
  FetchRecommendationTechnicalSnapshotsUseCase,
  type RecommendationTechnicalRequest,
} from './fetch-recommendation-technical.use-case';
import {
  FetchRecommendationNewsSnapshotsUseCase,
  type RecommendationNewsRequest,
} from './fetch-recommendation-news.use-case';
import {
  FetchRecommendationEventSnapshotsUseCase,
  type RecommendationEventRequest,
} from './fetch-recommendation-events.use-case';

/** Phase G/H/I — batch fetch quotes + technical + news + events */
export class BuildStockEnrichmentUseCase {
  constructor(
    private readonly fetchQuotesUseCase: FetchRecommendationQuotesUseCase,
    private readonly fetchTechnicalUseCase: FetchRecommendationTechnicalSnapshotsUseCase,
    private readonly fetchNewsUseCase: FetchRecommendationNewsSnapshotsUseCase,
    private readonly fetchEventsUseCase: FetchRecommendationEventSnapshotsUseCase,
  ) {}

  async execute(targets: RecommendationQuoteRequest[]): Promise<{
    candidateQuotes: QuoteInsightInput[];
    technicalSnapshots: StockTechnicalSnapshot[];
    newsSnapshots: StockNewsSnapshot[];
    eventSnapshots: StockEventSnapshot[];
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

    const headlineByKey = new Map(
      newsSnapshots.map((n) => [`${n.market}:${n.symbol.toUpperCase()}`, n.headlineSample]),
    );

    const eventTargets: RecommendationEventRequest[] = targets.map((t) => ({
      symbol: t.symbol,
      market: t.market,
      headlineSample: headlineByKey.get(`${t.market}:${t.symbol.toUpperCase()}`),
    }));

    const eventSnapshots = await this.fetchEventsUseCase.execute(eventTargets);

    return { candidateQuotes, technicalSnapshots, newsSnapshots, eventSnapshots };
  }
}
