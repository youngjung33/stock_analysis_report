import { Market } from '../enums';
import { FEATURED_KR_STOCKS, FEATURED_US_STOCKS } from '../featured-stocks';
import { resolveCurrency } from '../stock-symbol';
import { SECTOR_LEADER_SYMBOLS } from './sector-tags';
import type { CandidateStockInput } from './types';

export const MAX_CANDIDATES_PER_MARKET = 20;

function symbolKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

function addCandidate(
  map: Map<string, CandidateStockInput>,
  input: CandidateStockInput,
): void {
  const key = symbolKey(input.symbol, input.market);
  const existing = map.get(key);
  if (!existing) {
    map.set(key, input);
    return;
  }
  if (existing.source === 'featured') return;
  if (input.source === 'featured') {
    map.set(key, input);
  }
}

export function buildCandidatePool(input: {
  userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
  userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
  catalogSymbols?: Array<{ symbol: string; market: Market; name: string; yahooSymbol?: string }>;
}): CandidateStockInput[] {
  const map = new Map<string, CandidateStockInput>();

  for (const stock of FEATURED_KR_STOCKS) {
    addCandidate(map, {
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      currency: resolveCurrency(stock.market),
      source: 'featured',
    });
  }
  for (const stock of FEATURED_US_STOCKS) {
    addCandidate(map, {
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      currency: resolveCurrency(stock.market),
      source: 'featured',
    });
  }

  for (const [marketKey, sectors] of Object.entries(SECTOR_LEADER_SYMBOLS)) {
    const market = marketKey as Market;
    for (const entry of Object.values(sectors)) {
      for (const symbol of entry.symbols) {
        addCandidate(map, {
          symbol,
          name: symbol,
          market,
          currency: resolveCurrency(market),
          source: 'sector',
        });
      }
    }
  }

  for (const w of input.userWatchlist ?? []) {
    addCandidate(map, {
      symbol: w.symbol,
      name: w.name ?? w.symbol,
      market: w.market,
      currency: resolveCurrency(w.market),
      source: 'watchlist',
    });
  }

  for (const h of input.userHoldings ?? []) {
    addCandidate(map, {
      symbol: h.symbol,
      name: h.name ?? h.symbol,
      market: h.market,
      currency: resolveCurrency(h.market),
      source: 'holding',
    });
  }

  for (const c of input.catalogSymbols ?? []) {
    addCandidate(map, {
      symbol: c.symbol,
      name: c.name,
      market: c.market,
      currency: resolveCurrency(c.market),
      yahooSymbol: c.yahooSymbol,
      source: 'catalog',
    });
  }

  const kr = [...map.values()].filter((c) => c.market === Market.KR).slice(0, MAX_CANDIDATES_PER_MARKET);
  const us = [...map.values()].filter((c) => c.market === Market.US).slice(0, MAX_CANDIDATES_PER_MARKET);
  return [...kr, ...us];
}

export function mergeQuotesIntoCandidates(
  candidates: CandidateStockInput[],
  quotes: Array<{
    symbol: string;
    market: Market;
    name?: string;
    currency?: string;
    currentPrice: number | null;
    changePercent: number | null;
  }>,
): import('../market-insights').QuoteInsightInput[] {
  const quoteMap = new Map(quotes.map((q) => [symbolKey(q.symbol, q.market), q]));

  return candidates.map((c) => {
    const q = quoteMap.get(symbolKey(c.symbol, c.market));
    return {
      symbol: c.symbol,
      name: q?.name ?? c.name,
      market: c.market,
      currency: q?.currency ?? c.currency,
      currentPrice: q?.currentPrice ?? null,
      changePercent: q?.changePercent ?? null,
    };
  });
}
