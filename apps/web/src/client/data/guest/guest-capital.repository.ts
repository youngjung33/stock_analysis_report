import {
  buildMarketInsights,
  buildPortfolioSimulation,
  CashLedgerType,
} from '@sar/shared';
import {
  CashLedgerEntry,
  CashSummary,
  PortfolioPreferences,
  PortfolioSimulationResponse,
} from '../../domain/models';
import { ICashRepository, IPortfolioCapitalRepository } from '../../domain/repositories';
import { IMarketRepository, IPortfolioRepository } from '../../domain/repositories';
import {
  getGuestCashBalances,
  getGuestPortfolioPreference,
  listGuestCashLedger,
  saveGuestCashEntry,
  saveGuestPortfolioPreference,
} from './guest-storage';

export class GuestCashRepository implements ICashRepository {
  async getSummary(): Promise<CashSummary> {
    const entries = listGuestCashLedger();
    return {
      balances: getGuestCashBalances(),
      entries: entries.map((e) => ({
        id: e.id,
        currency: e.currency,
        type: e.type,
        amount: e.amount,
        occurredAt: e.occurredAt,
        memo: e.memo ?? null,
        refId: e.refId ?? null,
      })),
    };
  }

  async recordEntry(input: {
    currency: import('@sar/shared').CashCurrency;
    type: CashLedgerType;
    amount: number;
    memo?: string;
  }): Promise<CashLedgerEntry> {
    const entry = saveGuestCashEntry(input);
    return {
      id: entry.id,
      currency: entry.currency,
      type: entry.type,
      amount: entry.amount,
      occurredAt: entry.occurredAt,
      memo: entry.memo ?? null,
      refId: entry.refId ?? null,
    };
  }
}

export class GuestPortfolioCapitalRepository implements IPortfolioCapitalRepository {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly marketRepo: IMarketRepository,
  ) {}

  async getPreferences(): Promise<PortfolioPreferences> {
    return getGuestPortfolioPreference();
  }

  async updatePreferences(prefs: Omit<PortfolioPreferences, 'userId'>): Promise<PortfolioPreferences> {
    saveGuestPortfolioPreference(prefs);
    return prefs;
  }

  async getSimulation(): Promise<PortfolioSimulationResponse> {
    const [dashboard, featured, preferences] = await Promise.all([
      this.portfolioRepo.getDashboard(),
      this.marketRepo.getFeaturedQuotes(),
      this.getPreferences(),
    ]);

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
      cash: { krw: dashboard.summary.cashKrw, usd: dashboard.summary.cashUsd },
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
      preferences,
      recommendations: insights.recommendations.filter((r) => r.currentPrice > 0),
      usdKrwRate: dashboard.summary.usdKrwRate,
    });

    return {
      preferences,
      simulation,
      ledgerEntryCount: listGuestCashLedger().length,
      asOf: featured.fetchedAt,
    };
  }
}
