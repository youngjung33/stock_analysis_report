import { Market, buildCandidatePool } from '@sar/shared';
import { IStockCatalogRepository } from '../../repositories';

/** Sector + holdings/watchlist pool with StockCatalog yahooSymbol·name merge (simulation·ledger 동일 패턴) */
export async function buildCandidatePoolWithCatalog(
  catalogRepo: IStockCatalogRepository,
  input: {
    userHoldings?: Array<{ symbol: string; market: Market; name?: string }>;
    userWatchlist?: Array<{ symbol: string; market: Market; name?: string }>;
  },
) {
  const pool = buildCandidatePool(input);
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
  });

  return merged.map((c) => {
    const cat = catalogByKey.get(`${c.market}:${c.symbol.toUpperCase()}`);
    if (!cat) return c;
    return {
      ...c,
      name: cat.name || c.name,
      yahooSymbol: cat.yahooSymbol ?? c.yahooSymbol,
    };
  });
}
