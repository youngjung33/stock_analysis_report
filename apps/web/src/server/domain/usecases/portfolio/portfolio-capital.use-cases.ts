import {
  DEFAULT_PORTFOLIO_PREFERENCES,
  buildMarketInsights,
  buildPortfolioSimulation,
} from '@sar/shared';
import { PortfolioPreferenceEntity } from '../../entities';
import {
  ICashLedgerRepository,
  IPortfolioPreferenceRepository,
} from '../../repositories';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import { GetFeaturedQuotesUseCase } from '../market/get-featured-quotes.use-case';

export class GetPortfolioPreferencesUseCase {
  constructor(private readonly prefRepo: IPortfolioPreferenceRepository) {}

  async execute(userId: string) {
    const pref = await this.prefRepo.findByUser(userId);
    return pref ?? { userId, ...DEFAULT_PORTFOLIO_PREFERENCES };
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
    });
  }
}

export class GetPortfolioSimulationUseCase {
  constructor(
    private readonly dashboardUseCase: GetDashboardUseCase,
    private readonly featuredQuotesUseCase: GetFeaturedQuotesUseCase,
    private readonly cashRepo: ICashLedgerRepository,
    private readonly prefRepo: IPortfolioPreferenceRepository,
  ) {}

  async execute(userId: string) {
    const [dashboard, featured, cashEntries, prefRow] = await Promise.all([
      this.dashboardUseCase.execute(userId),
      this.featuredQuotesUseCase.execute(),
      this.cashRepo.findByUser(userId),
      this.prefRepo.findByUser(userId),
    ]);

    const preferences = prefRow ?? { userId, ...DEFAULT_PORTFOLIO_PREFERENCES };
    const cash = {
      krw: dashboard.summary.cashKrw,
      usd: dashboard.summary.cashUsd,
    };

    const insights = buildMarketInsights(
      featured.kr.map((q) => ({
        symbol: q.symbol,
        name: q.name,
        market: q.market,
        currency: q.currency,
        currentPrice: q.currentPrice,
        changePercent: q.changePercent,
      })),
      featured.us.map((q) => ({
        symbol: q.symbol,
        name: q.name,
        market: q.market,
        currency: q.currency,
        currentPrice: q.currentPrice,
        changePercent: q.changePercent,
      })),
      6,
    );

    const simulation = buildPortfolioSimulation({
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
      recommendations: insights.recommendations.filter((r) => r.currentPrice > 0),
      usdKrwRate: dashboard.summary.usdKrwRate,
    });

    return {
      preferences,
      simulation,
      ledgerEntryCount: cashEntries.length,
      asOf: featured.fetchedAt,
    };
  }
}
