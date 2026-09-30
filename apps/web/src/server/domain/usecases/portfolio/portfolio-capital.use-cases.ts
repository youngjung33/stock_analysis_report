import {
  DEFAULT_PORTFOLIO_PREFERENCES,
  Market,
  buildRankedPortfolioSimulation,
  type StoredInvestorProfile,
} from '@sar/shared';
import { PortfolioPreferenceEntity } from '../../entities';
import {
  ICashLedgerRepository,
  IPortfolioPreferenceRepository,
  IStockCatalogRepository,
  IWatchlistRepository,
} from '../../repositories';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import {
  buildCandidatePoolWithCatalog,
  catalogSymbolsFromCandidatePool,
} from '../market/build-candidate-pool-with-catalog';
import { BuildMarketContextUseCase } from '../market/build-market-context.use-case';
import { BuildStockEnrichmentUseCase } from '../market/build-stock-enrichment.use-case';

export interface PortfolioSimulationSnapshot {
  cash: { krw: number; usd: number };
  holdings: Array<{
    symbol: string;
    name: string;
    market: Market;
    currency: string;
    quantity: number;
    currentPrice: number | null;
    marketValueKrw: number | null;
    weightPercent: number | null;
  }>;
  preferences: {
    targetKrPercent: number;
    targetUsPercent: number;
    maxSingleWeightPercent: number;
    investorProfile?: StoredInvestorProfile | null;
  };
  watchlist: Array<{ symbol: string; market: Market; name: string }>;
  usdKrwRate?: number | null;
  ledgerEntryCount?: number;
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
    private readonly cashRepo: ICashLedgerRepository,
    private readonly prefRepo: IPortfolioPreferenceRepository,
    private readonly watchlistRepo: IWatchlistRepository,
    private readonly catalogRepo: IStockCatalogRepository,
    private readonly buildMarketContextUseCase: BuildMarketContextUseCase,
    private readonly buildStockEnrichmentUseCase: BuildStockEnrichmentUseCase,
  ) {}

  async execute(userId: string) {
    const [dashboard, cashEntries, prefRow, watchlistItems] = await Promise.all([
      this.dashboardUseCase.execute(userId),
      this.cashRepo.findByUser(userId),
      this.prefRepo.findByUser(userId),
      this.watchlistRepo.findByUser(userId),
    ]);

    const preferences = prefRow ?? { userId, ...DEFAULT_PORTFOLIO_PREFERENCES, investorProfile: null };

    return this.executeFromSnapshot({
      cash: {
        krw: dashboard.summary.cashKrw,
        usd: dashboard.summary.cashUsd,
      },
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
        investorProfile: preferences.investorProfile,
      },
      watchlist: watchlistItems.map((w) => ({
        symbol: w.symbol,
        market: w.market,
        name: w.name,
      })),
      usdKrwRate: dashboard.summary.usdKrwRate,
      ledgerEntryCount: cashEntries.length,
    });
  }

  /** Guest/client snapshot — full server enrichment pipeline */
  async executeFromSnapshot(snapshot: PortfolioSimulationSnapshot) {
    const marketContext = await this.buildMarketContextUseCase.execute();

    const userHoldings = snapshot.holdings.map((h) => ({
      symbol: h.symbol,
      market: h.market,
      name: h.name,
    }));
    const userWatchlist = snapshot.watchlist;

    const poolWithCatalog = await buildCandidatePoolWithCatalog(this.catalogRepo, {
      userHoldings,
      userWatchlist,
    });

    const catalogSymbols = catalogSymbolsFromCandidatePool(poolWithCatalog);

    const enrichmentTargets = poolWithCatalog.map((c) => ({
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

    const {
      simulation,
      builtProfile,
      recommendations,
      regimes,
    } = buildRankedPortfolioSimulation({
      cash: snapshot.cash,
      holdings: snapshot.holdings,
      preferences: {
        targetKrPercent: snapshot.preferences.targetKrPercent,
        targetUsPercent: snapshot.preferences.targetUsPercent,
        maxSingleWeightPercent: snapshot.preferences.maxSingleWeightPercent,
      },
      storedProfile: snapshot.preferences.investorProfile ?? null,
      usdKrwRate: snapshot.usdKrwRate ?? marketContext.usdKrwRate,
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
        figureStatements,
      },
      candidateQuotes,
    });

    return {
      preferences: {
        targetKrPercent: snapshot.preferences.targetKrPercent,
        targetUsPercent: snapshot.preferences.targetUsPercent,
        maxSingleWeightPercent: snapshot.preferences.maxSingleWeightPercent,
        investorProfile: snapshot.preferences.investorProfile ?? null,
      },
      simulation,
      ledgerEntryCount: snapshot.ledgerEntryCount ?? 0,
      asOf: new Date().toISOString(),
      investorProfile: builtProfile,
      recommendations,
      regimes,
    };
  }
}
