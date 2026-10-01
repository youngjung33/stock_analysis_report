import {
  Market,
  MarketAnalysisReport,
  NewsAnalysisInput,
  buildMarketAnalysisReport,
  type StoredInvestorProfile,
} from '@sar/shared';
import { IStockCatalogRepository } from '../../repositories';
import { buildCandidatePoolWithCatalog } from './build-candidate-pool-with-catalog';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from './build-stock-enrichment.use-case';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** 시장 심층 분석 리포트 생성 use case */
export class GetMarketAnalysisUseCase {
  constructor(
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
    private readonly marketData: IMarketDataProvider,
    private readonly catalogRepo: IStockCatalogRepository,
  ) {}

  /** 지수·매크로·섹터·뉴스·종목 enrichment 집계 후 MarketAnalysisReport 반환 */
  async execute(options?: {
    userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
    userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
    investorProfile?: StoredInvestorProfile | null;
  }): Promise<MarketAnalysisReport> {
    const [marketContext, krNews, usNewsGoogle, finnhubNews] = await Promise.all([
      this.buildMarketContextUseCase.execute(),
      this.marketData.fetchGoogleNews('코스피+증시+주식', Market.KR, 'ko', 'KR', 6).catch(() => []),
      this.marketData.fetchGoogleNews('US+stock+market+S&P', Market.US, 'en-US', 'US', 6).catch(() => []),
      this.marketData.fetchFinnhubMarketNews('general', 6).catch(() => []),
    ]);

    const pool = await buildCandidatePoolWithCatalog(this.catalogRepo, {
      userHoldings: options?.userHoldings,
      userWatchlist: options?.userWatchlist,
      investorProfile: options?.investorProfile,
    });

    const enrichmentTargets = pool.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      market: c.market,
      currency: c.currency,
      yahooSymbol: c.yahooSymbol,
    }));

    const { candidateQuotes, technicalSnapshots, newsSnapshots, eventSnapshots, figureStatements } =
      enrichmentTargets.length > 0
        ? await this.buildStockEnrichmentUseCase.execute(enrichmentTargets)
        : {
            candidateQuotes: [],
            technicalSnapshots: [],
            newsSnapshots: [],
            eventSnapshots: [],
            figureStatements: [],
          };

    const news: NewsAnalysisInput[] = [
      ...krNews.map((n) => ({ ...n, market: Market.KR as Market | 'global' })),
      ...usNewsGoogle.map((n) => ({ ...n, market: Market.US as Market | 'global' })),
      ...finnhubNews.map((n) => ({ ...n, market: 'global' as const })),
    ];

    return buildMarketAnalysisReport({
      indexInputs: marketContext.indexInputs,
      candidateQuotes,
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
