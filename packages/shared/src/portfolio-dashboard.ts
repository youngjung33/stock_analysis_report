import { Market } from './enums';
import { computeAllocation } from './portfolio-allocation';
import { cashToKrw, type CashBalances } from './cash-ledger';
import { aggregateKrwSummary, enrichHoldingKrw } from './portfolio-fx';
import { aggregatePortfolioTodayPnl } from './portfolio-today-pnl';

export interface RawDashboardHolding {
  stockId: string;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  changePercent: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  realizedPnl: number;
  costBasis: number;
}

export interface DashboardSummaryResult {
  totalCostBasis: number;
  totalMarketValue: number | null;
  totalUnrealizedPnl: number | null;
  totalRealizedPnl: number;
  holdingsCount: number;
  todayPnl: number | null;
  todayPnlPercent: number | null;
  totalCostBasisKrw: number | null;
  totalMarketValueKrw: number | null;
  totalUnrealizedPnlKrw: number | null;
  totalRealizedPnlKrw: number | null;
  todayPnlKrw: number | null;
  todayPnlPercentKrw: number | null;
  usdKrwRate: number | null;
  hasUsdHoldings: boolean;
  allocationByMarket: ReturnType<typeof computeAllocation>['allocationByMarket'];
  cashKrw: number;
  cashUsd: number;
  cashTotalKrw: number;
  totalAssetsKrw: number | null;
  cashPercent: number | null;
  investedPercent: number | null;
}

export interface BuiltDashboardHolding extends RawDashboardHolding {
  marketValueKrw: number | null;
  costBasisKrw: number;
  unrealizedPnlKrw: number | null;
  realizedPnlKrw: number;
  weightPercent: number | null;
  usdKrwRate: number | null;
}

export interface BuildDashboardFromHoldingsInput {
  rawHoldings: RawDashboardHolding[];
  cashBalances: CashBalances;
  usdKrwRate: number | null;
  hasAllQuotes: boolean;
  lastRefreshedAt?: Date | string | null;
  /** Guest mode uses 0 instead of null when portfolio is empty */
  zeroWhenEmpty?: boolean;
}

export function buildDashboardFromRawHoldings(input: BuildDashboardFromHoldingsInput): {
  summary: DashboardSummaryResult;
  holdings: BuiltDashboardHolding[];
  lastRefreshedAt: Date | string | null;
} {
  const { rawHoldings, cashBalances, hasAllQuotes, zeroWhenEmpty = false } = input;
  let usdKrwRate = input.usdKrwRate;

  let totalCostBasis = 0;
  let totalMarketValue = 0;
  let totalUnrealizedPnl = 0;
  let totalRealizedPnl = 0;

  for (const h of rawHoldings) {
    totalCostBasis += h.costBasis;
    totalRealizedPnl += h.realizedPnl;
    if (h.marketValue !== null) totalMarketValue += h.marketValue;
    if (h.unrealizedPnl !== null) totalUnrealizedPnl += h.unrealizedPnl;
  }

  const hasHoldings = rawHoldings.length > 0;
  const today =
    hasHoldings && hasAllQuotes
      ? aggregatePortfolioTodayPnl(rawHoldings)
      : { todayPnl: null, todayPnlPercent: null };

  const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
  const krwSummary = aggregateKrwSummary(rawHoldings, usdKrwRate, hasAllQuotes);
  const allocation = computeAllocation(
    rawHoldings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      market: h.market,
      marketValueKrw: enrichHoldingKrw(h, usdKrwRate).marketValueKrw,
    })),
  );
  const weightMap = new Map(allocation.items.map((i) => [`${i.symbol}:${i.market}`, i.weightPercent]));

  const holdings: BuiltDashboardHolding[] = rawHoldings.map((h) => ({
    ...h,
    ...enrichHoldingKrw(h, usdKrwRate),
    weightPercent: weightMap.get(`${h.symbol}:${h.market}`) ?? null,
    usdKrwRate,
  }));

  const cashTotalKrwFinal = cashToKrw(cashBalances, usdKrwRate);
  if (usdKrwRate === null) {
    usdKrwRate = krwSummary.usdKrwRate;
  }

  const totalAssetsKrw =
    krwSummary.totalMarketValueKrw !== null
      ? krwSummary.totalMarketValueKrw + cashTotalKrwFinal
      : cashTotalKrwFinal > 0
        ? cashTotalKrwFinal
        : null;

  const emptyNum = (value: number | null) =>
    zeroWhenEmpty && !hasHoldings ? 0 : value;

  const summary: DashboardSummaryResult = {
    totalCostBasis,
    totalMarketValue: emptyNum(hasAllQuotes ? totalMarketValue : null),
    totalUnrealizedPnl: emptyNum(hasAllQuotes ? totalUnrealizedPnl : null),
    totalRealizedPnl,
    holdingsCount: holdings.length,
    todayPnl: emptyNum(today.todayPnl),
    todayPnlPercent: emptyNum(today.todayPnlPercent),
    totalCostBasisKrw: krwSummary.totalCostBasisKrw,
    totalMarketValueKrw: krwSummary.totalMarketValueKrw,
    totalUnrealizedPnlKrw: krwSummary.totalUnrealizedPnlKrw,
    totalRealizedPnlKrw: krwSummary.totalRealizedPnlKrw,
    todayPnlKrw: krwSummary.todayPnlKrw,
    todayPnlPercentKrw: krwSummary.todayPnlPercentKrw,
    usdKrwRate: krwSummary.usdKrwRate ?? usdKrwRate,
    hasUsdHoldings: krwSummary.hasUsdHoldings || cashBalances.usd > 0,
    allocationByMarket: allocation.allocationByMarket,
    cashKrw: cashBalances.krw,
    cashUsd: cashBalances.usd,
    cashTotalKrw: cashTotalKrwFinal,
    totalAssetsKrw,
    cashPercent:
      totalAssetsKrw && totalAssetsKrw > 0
        ? (cashTotalKrwFinal / totalAssetsKrw) * 100
        : cashTotalKrwFinal > 0
          ? 100
          : null,
    investedPercent:
      totalAssetsKrw && totalAssetsKrw > 0 && krwSummary.totalMarketValueKrw !== null
        ? (krwSummary.totalMarketValueKrw / totalAssetsKrw) * 100
        : null,
  };

  return { summary, holdings, lastRefreshedAt: input.lastRefreshedAt ?? null };
}
