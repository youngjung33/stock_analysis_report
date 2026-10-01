import { Market } from '../enums';
import { resolveCurrency } from '../stock-symbol';
import { SECTOR_LEADER_SYMBOLS } from './sector-tags';
import type { CandidateStockInput } from './types';

export const MAX_CANDIDATES_PER_MARKET = 20;

type CandidateSource = NonNullable<CandidateStockInput['source']>;

const SOURCE_PRIORITY: Record<CandidateSource, number> = {
  holding: 0,
  watchlist: 1,
  profile: 2,
  catalog: 3,
  sector: 4,
};

function symbolKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

function sourcePriority(source: CandidateStockInput['source']): number {
  return SOURCE_PRIORITY[source ?? 'sector'];
}

function addCandidate(map: Map<string, CandidateStockInput>, input: CandidateStockInput): void {
  const key = symbolKey(input.symbol, input.market);
  const existing = map.get(key);
  if (!existing) {
    map.set(key, input);
    return;
  }
  if (sourcePriority(input.source) < sourcePriority(existing.source)) {
    map.set(key, input);
  }
}

function takeTopByMarket(candidates: CandidateStockInput[], market: Market): CandidateStockInput[] {
  return [...candidates]
    .filter((c) => c.market === market)
    .sort((a, b) => sourcePriority(a.source) - sourcePriority(b.source))
    .slice(0, MAX_CANDIDATES_PER_MARKET);
}

export function buildCandidatePool(input: {
  userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
  userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
  profileSymbols?: Array<{ symbol: string; market: Market; name?: string }>;
  catalogSymbols?: Array<{ symbol: string; market: Market; name: string; yahooSymbol?: string }>;
}): CandidateStockInput[] {
  const map = new Map<string, CandidateStockInput>();

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

  for (const p of input.profileSymbols ?? []) {
    addCandidate(map, {
      symbol: p.symbol,
      name: p.name ?? p.symbol,
      market: p.market,
      currency: resolveCurrency(p.market),
      source: 'profile',
    });
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

  const all = [...map.values()];
  const kr = takeTopByMarket(all, Market.KR);
  const us = takeTopByMarket(all, Market.US);
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
