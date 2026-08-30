import { CashLedgerType } from '@sar/shared';
import {
  CashLedgerEntry,
  CashSummary,
  PortfolioPreferences,
  PortfolioSimulationResponse,
} from '../../domain/models';
import { ICashRepository, IPortfolioCapitalRepository, IPortfolioRepository } from '../../domain/repositories';
import { apiClient } from '../api/client';
import {
  getGuestCashBalances,
  getGuestInvestorProfile,
  getGuestPortfolioPreference,
  getGuestWatchlist,
  listGuestCashLedger,
  saveGuestCashEntry,
  saveGuestInvestorProfile,
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
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async getPreferences(): Promise<PortfolioPreferences> {
    const prefs = getGuestPortfolioPreference();
    return {
      ...prefs,
      investorProfile: getGuestInvestorProfile(),
    };
  }

  async updatePreferences(prefs: Omit<PortfolioPreferences, 'userId'>): Promise<PortfolioPreferences> {
    saveGuestPortfolioPreference({
      targetKrPercent: prefs.targetKrPercent,
      targetUsPercent: prefs.targetUsPercent,
      maxSingleWeightPercent: prefs.maxSingleWeightPercent,
    });
    if (prefs.investorProfile) {
      saveGuestInvestorProfile(prefs.investorProfile);
    }
    return {
      targetKrPercent: prefs.targetKrPercent,
      targetUsPercent: prefs.targetUsPercent,
      maxSingleWeightPercent: prefs.maxSingleWeightPercent,
      investorProfile: prefs.investorProfile ?? getGuestInvestorProfile(),
    };
  }

  async getSimulation(): Promise<PortfolioSimulationResponse> {
    const [dashboard, preferences] = await Promise.all([
      this.portfolioRepo.getDashboard(),
      this.getPreferences(),
    ]);

    const { data } = await apiClient.post<PortfolioSimulationResponse>('/portfolio/simulation', {
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
      preferences: {
        targetKrPercent: preferences.targetKrPercent,
        targetUsPercent: preferences.targetUsPercent,
        maxSingleWeightPercent: preferences.maxSingleWeightPercent,
        investorProfile: preferences.investorProfile,
      },
      watchlist: getGuestWatchlist().map((w) => ({
        symbol: w.symbol,
        market: w.market,
        name: w.name,
      })),
      usdKrwRate: dashboard.summary.usdKrwRate,
      ledgerEntryCount: listGuestCashLedger().length,
    });

    return data;
  }
}
