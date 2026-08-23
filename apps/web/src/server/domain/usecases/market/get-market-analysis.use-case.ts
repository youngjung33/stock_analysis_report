import {
  Market,
  MarketAnalysisReport,
  NewsAnalysisInput,
  QuoteInsightInput,
  buildMarketAnalysisReport,
} from '@sar/shared';
import { GetFeaturedQuotesUseCase } from './get-featured-quotes.use-case';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from './build-stock-enrichment.use-case';
import { IMarketDataProvider } from '../../ports/market-data.port';

function toEnrichmentTarget(q: QuoteInsightInput) {
  return {
    symbol: q.symbol,
    name: q.name,
    market: q.market,
    currency: q.currency,
    yahooSymbol: undefined as string | undefined,
  };
}

/** 시장 심층 분석 리포트 생성 use case */
export class GetMarketAnalysisUseCase {
  constructor(
    private readonly getFeaturedQuotesUseCase: GetFeaturedQuotesUseCase,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
    private readonly marketData: IMarketDataProvider,
  ) {}

  /** 지수·매크로·섹터·뉴스·종목 enrichment 집계 후 MarketAnalysisReport 반환 */
  async execute(options?: {
    userHoldings?: Array<{ symbol: string; market: Market }>;
    userWatchlist?: Array<{ symbol: string; market: Market }>;
  }): Promise<MarketAnalysisReport> {
    const [featured, marketContext, krNews, usNewsGoogle, finnhubNews] = await Promise.all([
      this.getFeaturedQuotesUseCase.execute(),
      this.buildMarketContextUseCase.execute(),
      this.marketData.fetchGoogleNews('코스피+증시+주식', Market.KR, 'ko', 'KR', 6).catch(() => []),
      this.marketData.fetchGoogleNews('US+stock+market+S&P', Market.US, 'en-US', 'US', 6).catch(() => []),
      this.marketData.fetchFinnhubMarketNews('general', 6).catch(() => []),
    ]);

    const enrichmentTargets = [
      ...featured.kr.map(toEnrichmentTarget),
      ...featured.us.map(toEnrichmentTarget),
    ];

    const { technicalSnapshots, newsSnapshots, eventSnapshots, figureStatements } =
      await this.buildStockEnrichmentUseCase.execute(enrichmentTargets);

    const news: NewsAnalysisInput[] = [
      ...krNews.map((n) => ({ ...n, market: Market.KR as Market | 'global' })),
      ...usNewsGoogle.map((n) => ({ ...n, market: Market.US as Market | 'global' })),
      ...finnhubNews.map((n) => ({ ...n, market: 'global' as const })),
    ];

    return buildMarketAnalysisReport({
      krQuotes: featured.kr,
      usQuotes: featured.us,
      indexInputs: marketContext.indexInputs,
      macroInputs: marketContext.macroInputs,
      sectorInputs: marketContext.sectorInputs,
      news,
      fetchedAt: new Date().toISOString(),
      userHoldings: options?.userHoldings,
      userWatchlist: options?.userWatchlist,
      technicalSnapshots,
      newsSnapshots,
      eventSnapshots,
      figureStatements,
    });
  }
}
