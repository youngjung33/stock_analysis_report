import {
  applyIndexRegionSentiment,
  buildCandidatePool,
  buildMarketInsights,
  Market,
  type MarketInsightsResult,
} from '@sar/shared';
import { MarketSentimentSummaryResult } from '../../entities';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { FetchRecommendationQuotesUseCase } from './fetch-recommendation-quotes.use-case';
import { GetMarketIndicesUseCase } from './get-market-indices.use-case';

/** 대시보드 시장 정세 — 지수 + 섹터 후보 시세 기반 추천·레짐 */
export class GetMarketSentimentSummaryUseCase {
  constructor(
    private readonly getMarketIndicesUseCase: GetMarketIndicesUseCase,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly fetchRecommendationQuotesUseCase: FetchRecommendationQuotesUseCase,
  ) {}

  async execute(options?: {
    userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
    userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
  }): Promise<MarketSentimentSummaryResult> {
    const [indicesResult, marketContext] = await Promise.all([
      this.getMarketIndicesUseCase.execute(),
      this.buildMarketContextUseCase.execute(),
    ]);

    const pool = buildCandidatePool({
      userHoldings: options?.userHoldings,
      userWatchlist: options?.userWatchlist,
    });
    const quoteTargets = pool.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      market: c.market,
      currency: c.currency,
      yahooSymbol: c.yahooSymbol,
    }));

    const candidateQuotes =
      quoteTargets.length > 0
        ? await this.fetchRecommendationQuotesUseCase.execute(quoteTargets)
        : [];

    const base = buildMarketInsights(marketContext.indices, 4, {
      macro: marketContext.macro,
      sectors: marketContext.sectors,
      indices: marketContext.indices,
      candidateQuotes,
      usdKrwRate: marketContext.usdKrwRate,
      usdKrwChange1d: marketContext.usdKrwChange1d,
    });

    const insights: MarketInsightsResult = applyIndexRegionSentiment(
      base,
      indicesResult.indices,
      {
        macro: marketContext.macro,
        usdKrwChange1d: marketContext.usdKrwChange1d,
      },
    );

    return {
      indices: indicesResult.indices,
      insights,
      fetchedAt: indicesResult.fetchedAt,
    };
  }
}
