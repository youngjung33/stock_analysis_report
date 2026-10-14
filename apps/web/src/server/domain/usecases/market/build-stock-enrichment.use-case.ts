import type {
  FigureStatementSnapshot,
  QuoteInsightInput,
  StockEventSnapshot,
  StockNewsSnapshot,
  StockTechnicalSnapshot,
  EnrichmentBatchQuality,
} from '@sar/shared';
import { createEnrichmentBatchQuality } from '@sar/shared';
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

export interface BuildStockEnrichmentOptions {
  bypassCache?: boolean;
  /** 종목 리포트 등 — 표시 가격은 live chart, 풀 시세 fetch 생략 */
  skipQuotes?: boolean;
}

export interface BuildStockEnrichmentResult {
  candidateQuotes: QuoteInsightInput[];
  technicalSnapshots: StockTechnicalSnapshot[];
  newsSnapshots: StockNewsSnapshot[];
  eventSnapshots: StockEventSnapshot[];
  figureStatements: FigureStatementSnapshot[];
  quality: EnrichmentBatchQuality;
}

/** Phase G–J — batch fetch quotes + technical + news + events + figure statements */
export class BuildStockEnrichmentUseCase {
  constructor(
    private readonly fetchQuotesUseCase: FetchRecommendationQuotesUseCase,
    private readonly fetchTechnicalUseCase: FetchRecommendationTechnicalSnapshotsUseCase,
    private readonly fetchNewsUseCase: FetchRecommendationNewsSnapshotsUseCase,
    private readonly fetchEventsUseCase: FetchRecommendationEventSnapshotsUseCase,
    private readonly fetchFiguresUseCase: FetchRecommendationFigureStatementsUseCase,
  ) {}

  async execute(
    targets: RecommendationQuoteRequest[],
    options?: BuildStockEnrichmentOptions,
  ): Promise<BuildStockEnrichmentResult> {
    const quality = createEnrichmentBatchQuality(0);
    const fetchOpts = {
      bypassCache: options?.bypassCache,
      quality: quality.quotes,
    };
    const technicalOpts = { bypassCache: options?.bypassCache, quality: quality.technical };
    const newsOpts = { bypassCache: options?.bypassCache, quality: quality.news };
    const eventOpts = { bypassCache: options?.bypassCache, quality: quality.events };

    const newsTargets: RecommendationNewsRequest[] = targets.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      market: t.market,
    }));

    const quotesPromise = options?.skipQuotes
      ? Promise.resolve<QuoteInsightInput[]>([])
      : this.fetchQuotesUseCase.execute(targets, fetchOpts);

    const [candidateQuotes, technicalSnapshots, newsSnapshots, figureStatements] = await Promise.all([
      quotesPromise,
      this.fetchTechnicalUseCase.execute(targets as RecommendationTechnicalRequest[], technicalOpts),
      this.fetchNewsUseCase.execute(newsTargets, newsOpts),
      this.fetchFiguresUseCase.execute(),
    ]);

    const headlineByKey = new Map(
      newsSnapshots.map((n) => {
        const key = `${n.market}:${n.symbol.toUpperCase()}`;
        const sample =
          n.headlineSample?.trim() ||
          n.recentTitles?.find((t) => t.trim().length > 0)?.trim() ||
          undefined;
        return [key, sample];
      }),
    );

    const eventTargets: RecommendationEventRequest[] = targets.map((t) => ({
      symbol: t.symbol,
      market: t.market,
      headlineSample: headlineByKey.get(`${t.market}:${t.symbol.toUpperCase()}`),
    }));

    const eventSnapshots = await this.fetchEventsUseCase.execute(eventTargets, eventOpts);

    return {
      candidateQuotes,
      technicalSnapshots,
      newsSnapshots,
      eventSnapshots,
      figureStatements,
      quality,
    };
  }
}
