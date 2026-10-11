import {
  Market,
  MarketAnalysisReport,
  buildInvestorProfile,
  buildMarketAnalysisReport,
  createDefaultStoredProfile,
  isEnrichmentBatchIncomplete,
  type StoredInvestorProfile,
} from '@sar/shared';
import { IStockCatalogRepository } from '../../repositories';
import { buildCandidatePoolWithCatalog } from './build-candidate-pool-with-catalog';
import { BuildMarketContextUseCase } from './build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from './build-stock-enrichment.use-case';
import { fetchMarketHeadlineNews } from './fetch-market-headline-news';
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
    const [marketContext, headlineNews] = await Promise.all([
      this.buildMarketContextUseCase.execute(),
      fetchMarketHeadlineNews(this.marketData),
    ]);

    const pool = await buildCandidatePoolWithCatalog(this.catalogRepo, {
      userHoldings: options?.userHoldings,
      userWatchlist: options?.userWatchlist,
    });

    const enrichmentTargets = pool.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      market: c.market,
      currency: c.currency,
      yahooSymbol: c.yahooSymbol,
    }));

    const enrichment =
      enrichmentTargets.length > 0
        ? await this.buildStockEnrichmentUseCase.execute(enrichmentTargets)
        : null;

    const {
      candidateQuotes = [],
      technicalSnapshots = [],
      newsSnapshots = [],
      eventSnapshots = [],
      figureStatements = [],
      quality: enrichmentQuality,
    } = enrichment ?? {
      candidateQuotes: [],
      technicalSnapshots: [],
      newsSnapshots: [],
      eventSnapshots: [],
      figureStatements: [],
      quality: undefined,
    };

    const investorProfile = buildInvestorProfile(
      options?.investorProfile ?? createDefaultStoredProfile(),
    );

    const dataQuality =
      enrichmentQuality != null
        ? {
            news: headlineNews.quality,
            enrichment: enrichmentQuality,
            incompleteEnrichment: isEnrichmentBatchIncomplete(enrichmentQuality),
          }
        : {
            news: headlineNews.quality,
            enrichment: {
              quotes: { requested: 0, received: 0, cacheHits: 0, failed: 0 },
              technical: { requested: 0, received: 0, cacheHits: 0, failed: 0 },
              news: { requested: 0, received: 0, cacheHits: 0, failed: 0 },
              events: { requested: 0, received: 0, cacheHits: 0, failed: 0 },
            },
            incompleteEnrichment: false,
          };

    return buildMarketAnalysisReport({
      indexInputs: marketContext.indexInputs,
      candidateQuotes,
      macroInputs: marketContext.macroInputs,
      sectorInputs: marketContext.sectorInputs,
      news: headlineNews.items,
      fetchedAt: new Date().toISOString(),
      userHoldings: options?.userHoldings,
      userWatchlist: options?.userWatchlist,
      investorProfile,
      preferredTags: investorProfile.preferredTags,
      technicalSnapshots,
      newsSnapshots,
      eventSnapshots,
      figureStatements,
      dataQuality,
    });
  }
}
