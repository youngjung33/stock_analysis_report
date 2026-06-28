import { Market } from './enums';
import { aggregatePortfolioTodayPnl, TodayPnlHoldingInput } from './portfolio-today-pnl';

export function convertToKrw(
  amount: number | null | undefined,
  currency: string,
  usdKrwRate: number | null,
): number | null {
  if (amount === null || amount === undefined) return null;
  if (currency === 'KRW') return amount;
  if (currency === 'USD') {
    if (usdKrwRate === null || usdKrwRate <= 0) return null;
    return amount * usdKrwRate;
  }
  return null;
}

export interface HoldingFxInput {
  market: Market;
  currency: string;
  costBasis: number;
  marketValue: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number;
  quantity: number;
  currentPrice: number | null;
  changePercent: number | null;
}

export interface HoldingKrwFields {
  costBasisKrw: number;
  marketValueKrw: number | null;
  unrealizedPnlKrw: number | null;
  realizedPnlKrw: number;
}

export interface KrwDashboardSummary {
  totalCostBasisKrw: number;
  totalMarketValueKrw: number | null;
  totalUnrealizedPnlKrw: number | null;
  totalRealizedPnlKrw: number;
  todayPnlKrw: number | null;
  todayPnlPercentKrw: number | null;
  usdKrwRate: number | null;
  hasUsdHoldings: boolean;
}

export function enrichHoldingKrw(
  holding: HoldingFxInput,
  usdKrwRate: number | null,
): HoldingKrwFields {
  return {
    costBasisKrw: convertToKrw(holding.costBasis, holding.currency, usdKrwRate) ?? holding.costBasis,
    marketValueKrw: convertToKrw(holding.marketValue, holding.currency, usdKrwRate),
    unrealizedPnlKrw: convertToKrw(holding.unrealizedPnl, holding.currency, usdKrwRate),
    realizedPnlKrw:
      convertToKrw(holding.realizedPnl, holding.currency, usdKrwRate) ?? holding.realizedPnl,
  };
}

export function aggregateKrwSummary(
  holdings: HoldingFxInput[],
  usdKrwRate: number | null,
  hasAllQuotes: boolean,
): KrwDashboardSummary {
  let totalCostBasisKrw = 0;
  let totalMarketValueKrw = 0;
  let totalUnrealizedPnlKrw = 0;
  let totalRealizedPnlKrw = 0;
  let hasUsdHoldings = false;
  let hasAllKrwValues = hasAllQuotes;

  for (const h of holdings) {
    const krw = enrichHoldingKrw(h, usdKrwRate);
    totalCostBasisKrw += krw.costBasisKrw;
    totalRealizedPnlKrw += krw.realizedPnlKrw;
    if (h.currency === 'USD') hasUsdHoldings = true;
    if (krw.marketValueKrw !== null) totalMarketValueKrw += krw.marketValueKrw;
    else hasAllKrwValues = false;
    if (krw.unrealizedPnlKrw !== null) totalUnrealizedPnlKrw += krw.unrealizedPnlKrw;
    else if (h.marketValue !== null) hasAllKrwValues = false;
  }

  const todayInputs: TodayPnlHoldingInput[] = holdings.map((h) => ({
    quantity: h.quantity,
    currentPrice: h.currentPrice,
    changePercent: h.changePercent,
  }));
  const todayNative = aggregatePortfolioTodayPnl(todayInputs);

  let todayPnlKrw: number | null = null;
  let todayPnlPercentKrw: number | null = null;

  if (todayNative.todayPnl !== null && hasAllQuotes) {
    todayPnlKrw = 0;
    let previousKrw = 0;
    for (const h of holdings) {
      if (h.currentPrice === null || h.changePercent === null) continue;
      const prevClose = h.currentPrice / (1 + h.changePercent / 100);
      const nativeToday = (h.currentPrice - prevClose) * h.quantity;
      const krwToday = convertToKrw(nativeToday, h.currency, usdKrwRate);
      const prevKrw = convertToKrw(prevClose * h.quantity, h.currency, usdKrwRate);
      if (krwToday !== null && prevKrw !== null) {
        todayPnlKrw += krwToday;
        previousKrw += prevKrw;
      }
    }
    todayPnlPercentKrw = previousKrw > 0 ? (todayPnlKrw / previousKrw) * 100 : null;
  }

  return {
    totalCostBasisKrw,
    totalMarketValueKrw: hasAllKrwValues && holdings.length > 0 ? totalMarketValueKrw : null,
    totalUnrealizedPnlKrw: hasAllKrwValues && holdings.length > 0 ? totalUnrealizedPnlKrw : null,
    totalRealizedPnlKrw,
    todayPnlKrw,
    todayPnlPercentKrw,
    usdKrwRate,
    hasUsdHoldings,
  };
}
