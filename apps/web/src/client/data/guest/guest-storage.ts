import { Market, TransactionType } from '@sar/shared';
import { Stock, Transaction } from '../../domain/models';

const STORAGE_KEY = 'sar_guest_data';

export interface GuestQuote {
  stockId: string;
  currentPrice: number;
  changePercent: number | null;
  fetchedAt: string;
}

interface GuestStore {
  transactions: Transaction[];
  quotes: Record<string, GuestQuote>;
}

function emptyStore(): GuestStore {
  return { transactions: [], quotes: {} };
}

function readStore(): GuestStore {
  if (typeof sessionStorage === 'undefined') return emptyStore();
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore();
  try {
    return JSON.parse(raw) as GuestStore;
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
