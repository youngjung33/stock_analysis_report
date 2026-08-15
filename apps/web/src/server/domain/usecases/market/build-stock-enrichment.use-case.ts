import type {
  FigureStatementSnapshot,
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
import { FetchRecommendationFigureStatementsUseCase } from './fetch-recommendation-figures.use-case';

/** Phase G–J — batch fetch quotes + technical + news + events + figure statements */
export class BuildStockEnrichmentUseCase {
  constructor(
    private readonly fetchQuotesUseCase: FetchRecommendationQuotesUseCase,
    private readonly fetchTechnicalUseCase: FetchRecommendationTechnicalSnapshotsUseCase,
    private readonly fetchNewsUseCase: FetchRecommendationNewsSnapshotsUseCase,
    private readonly fetchEventsUseCase: FetchRecommendationEventSnapshotsUseCase,
    private readonly fetchFiguresUseCase: FetchRecommendationFigureStatementsUseCase,
  ) {}

  async execute(targets: RecommendationQuoteRequest[]): Promise<{
    candidateQuotes: QuoteInsightInput[];
    technicalSnapshots: StockTechnicalSnapshot[];
    newsSnapshots: StockNewsSnapshot[];
    eventSnapshots: StockEventSnapshot[];
    figureStatements: FigureStatementSnapshot[];
  }> {
    const newsTargets: RecommendationNewsRequest[] = targets.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      market: t.market,
    }));

    const [candidateQuotes, technicalSnapshots, newsSnapshots, figureStatements] = await Promise.all([
      this.fetchQuotesUseCase.execute(targets),
      this.fetchTechnicalUseCase.execute(targets as RecommendationTechnicalRequest[]),
      this.fetchNewsUseCase.execute(newsTargets),
      this.fetchFiguresUseCase.execute(),
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

    return { candidateQuotes, technicalSnapshots, newsSnapshots, eventSnapshots, figureStatements };
  }
}
