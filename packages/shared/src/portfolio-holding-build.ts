import { Market } from './enums';
import { applyCorporateActions } from './corporate-actions';
import { toPositionTransaction, type PositionState } from './position-calculator';
import { enrichHoldingKrw } from './portfolio-fx';
import type { BuiltDashboardHolding, RawDashboardHolding } from './portfolio-dashboard';

export interface HoldingQuoteSnapshot {
  currentPrice: number | null;
  changePercent: number | null;
  fetchedAt?: Date | string | null;
}

export interface QuoteRefreshState {
  lastRefreshedAt: Date | string | null;
  hasAllQuotes: boolean;
}

export function nextQuoteRefreshState(
  state: QuoteRefreshState,
  quote: HoldingQuoteSnapshot | null | undefined,
): QuoteRefreshState {
  if (!quote) {
    return { ...state, hasAllQuotes: false };
  }

  let { lastRefreshedAt } = state;
  if (quote.fetchedAt) {
    const fetchedMs = new Date(quote.fetchedAt).getTime();
    const lastMs = lastRefreshedAt ? new Date(lastRefreshedAt).getTime() : 0;
    if (!lastRefreshedAt || fetchedMs > lastMs) {
      lastRefreshedAt = quote.fetchedAt;
    }
  }

  return { lastRefreshedAt, hasAllQuotes: state.hasAllQuotes };
}

/** Position + quote → dashboard raw holding row (null when flat). */
export function buildRawDashboardHolding(input: {
  stockId: string;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  position: PositionState;
  quote?: HoldingQuoteSnapshot | null;
}): RawDashboardHolding | null {
  const { position, quote } = input;
  if (position.quantity <= 0) return null;

  const currentPrice = quote?.currentPrice ?? null;
  const changePercent = quote?.changePercent ?? null;
  const marketValue = currentPrice !== null ? currentPrice * position.quantity : null;
  const unrealizedPnl =
    currentPrice !== null ? (currentPrice - position.averageCost) * position.quantity : null;
  const unrealizedPnlPercent =
    currentPrice !== null && position.averageCost > 0
      ? ((currentPrice - position.averageCost) / position.averageCost) * 100
      : null;

  return {
    stockId: input.stockId,
    symbol: input.symbol,
    name: input.name,
    market: input.market,
    currency: input.currency,
    quantity: position.quantity,
    averageCost: position.averageCost,
    currentPrice,
    changePercent,
    marketValue,
    unrealizedPnl,
    unrealizedPnlPercent,
    realizedPnl: position.realizedPnl,
    costBasis: position.costBasis,
  };
}

export function buildHoldingWithKrw(
  raw: RawDashboardHolding,
  usdKrwRate: number | null,
): BuiltDashboardHolding {
  return {
    ...raw,
    ...enrichHoldingKrw(raw, usdKrwRate),
    weightPercent: null,
    usdKrwRate,
  };
}

type PositionTransactionInput = Parameters<typeof toPositionTransaction>[0];
type CorporateActionInput = Parameters<typeof applyCorporateActions>[1][number];

export interface StockHoldingBundle {
  stockId: string;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  transactions: PositionTransactionInput[];
  corporateActions: CorporateActionInput[];
  quote?: HoldingQuoteSnapshot | null;
}

/** Transactions + corp actions + quotes → raw dashboard holdings (server/guest shared). */
export function buildRawHoldingsFromStockBundles(
  bundles: StockHoldingBundle[],
  initialQuoteState: QuoteRefreshState = { lastRefreshedAt: null, hasAllQuotes: true },
): { rawHoldings: RawDashboardHolding[]; quoteState: QuoteRefreshState } {
  const rawHoldings: RawDashboardHolding[] = [];
  let quoteState = initialQuoteState;

  for (const bundle of bundles) {
    const position = applyCorporateActions(
      bundle.transactions.map(toPositionTransaction),
      bundle.corporateActions,
    );
    quoteState = nextQuoteRefreshState(quoteState, bundle.quote ?? null);
    const raw = buildRawDashboardHolding({
      stockId: bundle.stockId,
      symbol: bundle.symbol,
      name: bundle.name,
      market: bundle.market,
      currency: bundle.currency,
      position,
      quote: bundle.quote,
    });
    if (raw) rawHoldings.push(raw);
  }

  return { rawHoldings, quoteState };
}
