import { Market, TransactionType, CorporateActionType, CashLedgerType, computeCashBalances, DEFAULT_PORTFOLIO_PREFERENCES, type CashCurrency } from '@sar/shared';
import { Stock, Transaction, WatchlistItem } from '../../domain/models';

const STORAGE_KEY = 'sar_guest_data';

export interface GuestQuote {
  stockId: string;
  currentPrice: number;
  changePercent: number | null;
  fetchedAt: string;
}

interface GuestCashEntry {
  id: string;
  currency: CashCurrency;
  type: CashLedgerType;
  amount: number;
  occurredAt: string;
  memo?: string;
  refId?: string;
}

interface GuestStore {
  transactions: Transaction[];
  quotes: Record<string, GuestQuote>;
  watchlist: WatchlistItem[];
  corporateActions: GuestCorporateAction[];
  cashLedger: GuestCashEntry[];
  portfolioPreference: {
    targetKrPercent: number;
    targetUsPercent: number;
    maxSingleWeightPercent: number;
  } | null;
}

function emptyStore(): GuestStore {
  return {
    transactions: [],
    quotes: {},
    watchlist: [],
    corporateActions: [],
    cashLedger: [],
    portfolioPreference: null,
  };
}

function readStore(): GuestStore {
  if (typeof sessionStorage === 'undefined') return emptyStore();
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    const parsed = JSON.parse(raw) as Partial<GuestStore>;
    return {
      transactions: parsed.transactions ?? [],
      quotes: parsed.quotes ?? {},
      watchlist: parsed.watchlist ?? [],
      corporateActions: parsed.corporateActions ?? [],
      cashLedger: parsed.cashLedger ?? [],
      portfolioPreference: parsed.portfolioPreference ?? null,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: GuestStore): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearGuestStore(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function listGuestTransactions(): Transaction[] {
  return readStore().transactions;
}

export function saveGuestTransaction(tx: Transaction): void {
  const store = readStore();
  store.transactions.unshift(tx);
  writeStore(store);
}

export function deleteGuestTransaction(id: string): void {
  const store = readStore();
  store.transactions = store.transactions.filter((tx) => tx.id !== id);
  writeStore(store);
}

export function getGuestQuotes(): Record<string, GuestQuote> {
  return readStore().quotes;
}

export function saveGuestQuotes(quotes: GuestQuote[]): void {
  const store = readStore();
  for (const quote of quotes) {
    store.quotes[quote.stockId] = quote;
  }
  writeStore(store);
}

export function buildGuestStockId(symbol: string, market: Market): string {
  return `guest-${market}-${symbol.toUpperCase()}`;
}

export function createGuestStock(
  symbol: string,
  market: Market,
  name?: string,
): Stock {
  const upper = symbol.toUpperCase();
  return {
    id: buildGuestStockId(upper, market),
    symbol: upper,
    name: name?.trim() || upper,
    market,
    currency: market === Market.KR ? 'KRW' : 'USD',
  };
}

export function guestTransactionsForStock(stockId: string, type?: TransactionType): Transaction[] {
  const txs = listGuestTransactions().filter((tx) => tx.stockId === stockId);
  if (!type) return txs;
  return txs.filter((tx) => tx.type === type);
}

export interface GuestCorporateAction {
  id: string;
  stockId: string;
  symbol: string;
  market: Market;
  type: CorporateActionType;
  effectiveAt: string;
  cashAmount?: number;
  splitRatio?: number;
  targetSymbol?: string;
  targetMarket?: Market;
  targetName?: string;
  targetQuantity?: number;
  targetPrice?: number;
  memo?: string;
}

export function listGuestCorporateActions(): GuestCorporateAction[] {
  return readStore().corporateActions ?? [];
}

export function saveGuestCorporateAction(input: {
  stockSymbol: string;
  name: string;
  market: Market;
  type: CorporateActionType;
  effectiveAt: string;
  cashAmount?: number;
  splitRatio?: number;
  targetSymbol?: string;
  targetMarket?: Market;
  targetName?: string;
  targetQuantity?: number;
  targetPrice?: number;
  memo?: string;
}): void {
  const store = readStore();
  const stock = createGuestStock(input.stockSymbol, input.market, input.name);
  const id = `guest-ca-${Date.now()}`;
  store.corporateActions.unshift({
    id,
    stockId: stock.id,
    symbol: stock.symbol,
    market: stock.market,
    type: input.type,
    effectiveAt: input.effectiveAt,
    cashAmount: input.cashAmount,
    splitRatio: input.splitRatio,
    targetSymbol: input.targetSymbol,
    targetMarket: input.targetMarket,
    targetName: input.targetName,
    targetQuantity: input.targetQuantity,
    targetPrice: input.targetPrice,
    memo: input.memo,
  });
  writeStore(store);

  if (input.type === 'DIVIDEND' && input.cashAmount && input.cashAmount > 0) {
    saveGuestCashEntry({
      currency: stock.currency === 'USD' ? 'USD' : 'KRW',
      type: CashLedgerType.DIVIDEND,
      amount: input.cashAmount,
      memo: input.memo ?? `${stock.symbol} 배당`,
      refId: id,
      occurredAt: input.effectiveAt,
    });
  }
}

export function getGuestWatchlist(): WatchlistItem[] {
  return readStore().watchlist ?? [];
}

export function saveGuestWatchlistItem(input: {
  symbol: string;
  name: string;
  market: Market;
}): WatchlistItem {
  const store = readStore();
  const existing = store.watchlist.find(
    (w) => w.symbol === input.symbol && w.market === input.market,
  );
  if (existing) return existing;

  const item: WatchlistItem = {
    id: `guest-wl-${Date.now()}`,
    symbol: input.symbol.toUpperCase(),
    name: input.name,
    market: input.market,
    createdAt: new Date().toISOString(),
  };
  store.watchlist.unshift(item);
  writeStore(store);
  return item;
}

export function removeGuestWatchlistItem(id: string): void {
  const store = readStore();
  store.watchlist = store.watchlist.filter((w) => w.id !== id);
  writeStore(store);
}

export function listGuestCashLedger(): GuestCashEntry[] {
  return readStore().cashLedger ?? [];
}

export function getGuestCashBalances() {
  return computeCashBalances(listGuestCashLedger());
}

export function saveGuestCashEntry(input: {
  currency: CashCurrency;
  type: CashLedgerType;
  amount: number;
  memo?: string;
  refId?: string;
  occurredAt?: string;
}): GuestCashEntry {
  const store = readStore();
  const signed =
    input.type === CashLedgerType.WITHDRAW || input.type === CashLedgerType.BUY_SETTLE
      ? -Math.abs(input.amount)
      : Math.abs(input.amount);
  const entry: GuestCashEntry = {
    id: crypto.randomUUID(),
    currency: input.currency,
    type: input.type,
    amount: signed,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    memo: input.memo,
    refId: input.refId,
  };
  store.cashLedger.unshift(entry);
  writeStore(store);
  return entry;
}

export function deleteGuestCashByRef(refId: string): void {
  const store = readStore();
  store.cashLedger = store.cashLedger.filter((e) => e.refId !== refId);
  writeStore(store);
}

export function getGuestPortfolioPreference() {
  return readStore().portfolioPreference ?? { ...DEFAULT_PORTFOLIO_PREFERENCES };
}

export function saveGuestPortfolioPreference(prefs: {
  targetKrPercent: number;
  targetUsPercent: number;
  maxSingleWeightPercent: number;
}) {
  const store = readStore();
  store.portfolioPreference = prefs;
  writeStore(store);
}
