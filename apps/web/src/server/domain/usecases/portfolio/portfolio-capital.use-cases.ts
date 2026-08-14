import {
  DEFAULT_PORTFOLIO_PREFERENCES,
  Market,
  buildCandidatePool,
  buildRankedPortfolioSimulation,
  toFeaturedQuoteInputs,
} from '@sar/shared';
import { PortfolioPreferenceEntity } from '../../entities';
import {
  ICashLedgerRepository,
  IPortfolioPreferenceRepository,
  IStockCatalogRepository,
  IWatchlistRepository,
} from '../../repositories';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import { GetFeaturedQuotesUseCase } from '../market/get-featured-quotes.use-case';
import { BuildMarketContextUseCase } from '../market/build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from '../market/build-stock-enrichment.use-case';

function symbolKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

export class GetPortfolioPreferencesUseCase {
  constructor(private readonly prefRepo: IPortfolioPreferenceRepository) {}

  async execute(userId: string) {
    const pref = await this.prefRepo.findByUser(userId);
    return pref ?? { userId, ...DEFAULT_PORTFOLIO_PREFERENCES, investorProfile: null };
  }
}

export class UpdatePortfolioPreferencesUseCase {
  constructor(private readonly prefRepo: IPortfolioPreferenceRepository) {}

  execute(input: PortfolioPreferenceEntity) {
    const kr = Math.max(0, Math.min(100, input.targetKrPercent));
    const us = Math.max(0, Math.min(100, input.targetUsPercent));
    const maxW = Math.max(5, Math.min(100, input.maxSingleWeightPercent));
    return this.prefRepo.upsert({
      userId: input.userId,
      targetKrPercent: kr,
      targetUsPercent: us,
      maxSingleWeightPercent: maxW,
      investorProfile: input.investorProfile,
    });
  }
}

export class GetPortfolioSimulationUseCase {
  constructor(
    private readonly dashboardUseCase: GetDashboardUseCase,
    private readonly featuredQuotesUseCase: GetFeaturedQuotesUseCase,
    private readonly cashRepo: ICashLedgerRepository,
    private readonly prefRepo: IPortfolioPreferenceRepository,
    private readonly watchlistRepo: IWatchlistRepository,
    private readonly catalogRepo: IStockCatalogRepository,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
  ) {}

  async execute(userId: string) {
    const [dashboard, featured, cashEntries, prefRow, watchlistItems, marketContext] =
      await Promise.all([
        this.dashboardUseCase.execute(userId),
        this.featuredQuotesUseCase.execute(),
        this.cashRepo.findByUser(userId),
        this.prefRepo.findByUser(userId),
        this.watchlistRepo.findByUser(userId),
        this.buildMarketContextUseCase.execute(),
      ]);

    const preferences = prefRow ?? { userId, ...DEFAULT_PORTFOLIO_PREFERENCES, investorProfile: null };
    const cash = {
      krw: dashboard.summary.cashKrw,
      usd: dashboard.summary.cashUsd,
    };

    const userHoldings = dashboard.holdings.map((h) => ({
      symbol: h.symbol,
      market: h.market,
      name: h.name,
    }));
    const userWatchlist = watchlistItems.map((w) => ({
      symbol: w.symbol,
      market: w.market,
      name: w.name,
    }));

    const pool = buildCandidatePool({ userHoldings, userWatchlist });
    const featuredKeys = new Set([
      ...featured.kr.map((q) => symbolKey(q.symbol, q.market)),
      ...featured.us.map((q) => symbolKey(q.symbol, q.market)),
    ]);
    const extraCandidates = pool.filter((c) => !featuredKeys.has(symbolKey(c.symbol, c.market)));

    const krExtraSymbols = extraCandidates.filter((c) => c.market === Market.KR).map((c) => c.symbol);
    const usExtraSymbols = extraCandidates.filter((c) => c.market === Market.US).map((c) => c.symbol);
    const [krCatalog, usCatalog] = await Promise.all([
      this.catalogRepo.findBySymbols(krExtraSymbols, Market.KR),
      this.catalogRepo.findBySymbols(usExtraSymbols, Market.US),
    ]);
    const catalogSymbols = [...krCatalog, ...usCatalog].map((c) => ({
      symbol: c.symbol,
      market: c.market,
      name: c.name,
      yahooSymbol: c.yahooSymbol,
    }));

    const poolWithCatalog = buildCandidatePool({
      userHoldings,
      userWatchlist,
      catalogSymbols,
    });
    const quoteTargets = poolWithCatalog.filter(
      (c) => !featuredKeys.has(symbolKey(c.symbol, c.market)),
    );

    const enrichmentTargets = quoteTargets.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      market: c.market,
      currency: c.currency,
      yahooSymbol: c.yahooSymbol,
    }));

    const featuredTargets = [
      ...featured.kr.map((q) => ({
        symbol: q.symbol,
        market: q.market,
        yahooSymbol: undefined as string | undefined,
      })),
      ...featured.us.map((q) => ({
        symbol: q.symbol,
        market: q.market,
        yahooSymbol: undefined as string | undefined,
      })),
    ];

    const { candidateQuotes, technicalSnapshots, newsSnapshots, eventSnapshots } = await this.buildStockEnrichmentUseCase.execute([
      ...enrichmentTargets,
      ...featuredTargets.filter(
        (f) => !enrichmentTargets.some((t) => t.symbol === f.symbol && t.market === f.market),
      ),
    ]);

    const {
      simulation,
      builtProfile,
      recommendations,
      regimes,
    } = buildRankedPortfolioSimulation({
      cash,
      holdings: dashboard.holdings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        market: h.market,
        currency: h.currency,
        quantity: h.quantity,
        currentPrice: h.currentPrice,
        marketValueKrw: h.marketValueKrw,
        weightPercent: h.weightPercent,
      })),
      preferences: {
        targetKrPercent: preferences.targetKrPercent,
        targetUsPercent: preferences.targetUsPercent,
        maxSingleWeightPercent: preferences.maxSingleWeightPercent,
      },
      featuredKr: toFeaturedQuoteInputs(featured.kr),
      featuredUs: toFeaturedQuoteInputs(featured.us),
      storedProfile: preferences.investorProfile,
      usdKrwRate: dashboard.summary.usdKrwRate ?? marketContext.usdKrwRate,
      marketContext: {
        macro: marketContext.macro,
        sectors: marketContext.sectors,
        indices: marketContext.indices,
        usdKrwRate: marketContext.usdKrwRate,
        usdKrwChange1d: marketContext.usdKrwChange1d,
        userHoldings,
        userWatchlist,
        catalogSymbols,
        technicalSnapshots,
        newsSnapshots,
        eventSnapshots,
      },
      candidateQuotes,
    });

    return {
      preferences,
      simulation,
      ledgerEntryCount: cashEntries.length,
      asOf: featured.fetchedAt,
      investorProfile: builtProfile,
      recommendations,
      regimes,
    };
  }
}
