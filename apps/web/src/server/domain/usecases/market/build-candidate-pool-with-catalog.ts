import { Market, buildCandidatePool } from '@sar/shared';
import { IStockCatalogRepository } from '../../repositories';
import { resolveGuestBaselineSymbols } from './resolve-guest-baseline';

function hasHoldingsOrWatchlist(input: {
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
}): boolean {
  return (input.userHoldings?.length ?? 0) > 0 || (input.userWatchlist?.length ?? 0) > 0;
}

/** Holdings/watchlist pool + catalog merge; 비회원은 시총 상위 baseline */
export async function buildCandidatePoolWithCatalog(
  catalogRepo: IStockCatalogRepository,
  input: {
    userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
    userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
  },
) {
  const baselineSymbols = hasHoldingsOrWatchlist(input)
    ? undefined
    : await resolveGuestBaselineSymbols(catalogRepo);

  const pool = buildCandidatePool({
    userHoldings: input.userHoldings,
    userWatchlist: input.userWatchlist,
    baselineSymbols,
  });
  const krSymbols = pool.filter((c) => c.market === Market.KR).map((c) => c.symbol);
  const usSymbols = pool.filter((c) => c.market === Market.US).map((c) => c.symbol);

  const [krCatalog, usCatalog] = await Promise.all([
    krSymbols.length > 0 ? catalogRepo.findBySymbols(krSymbols, Market.KR) : Promise.resolve([]),
    usSymbols.length > 0 ? catalogRepo.findBySymbols(usSymbols, Market.US) : Promise.resolve([]),
  ]);

  const catalogSymbols = [...krCatalog, ...usCatalog].map((c) => ({
    symbol: c.symbol,
    market: c.market,
    name: c.name,
    yahooSymbol: c.yahooSymbol,
  }));

  const catalogByKey = new Map(
    catalogSymbols.map((c) => [`${c.market}:${c.symbol.toUpperCase()}`, c]),
  );

  const merged = buildCandidatePool({
    userHoldings: input.userHoldings,
    userWatchlist: input.userWatchlist,
    catalogSymbols,
    baselineSymbols,
  });

  return merged.map((c) => enrichCandidateFromCatalog(c, catalogByKey));
}

function enrichCandidateFromCatalog(
  c: ReturnType<typeof buildCandidatePool>[number],
  catalogByKey: Map<string, { name: string; yahooSymbol?: string }>,
) {
  const cat = catalogByKey.get(`${c.market}:${c.symbol.toUpperCase()}`);
  if (!cat) return c;
  return {
    ...c,
    name: cat.name || c.name,
    yahooSymbol: cat.yahooSymbol ?? c.yahooSymbol,
  };
}

/** Pool rows → engine/catalogSymbols payload (simulation·ledger 공통) */
export function catalogSymbolsFromCandidatePool(
  pool: ReturnType<typeof buildCandidatePool>,
) {
  return pool.map((c) => ({
    symbol: c.symbol,
    market: c.market,
    name: c.name,
    yahooSymbol: c.yahooSymbol,
  }));
}
