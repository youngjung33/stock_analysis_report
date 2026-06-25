import { Market } from './enums';
import { FEATURED_KR_STOCKS, FEATURED_US_STOCKS } from './featured-stocks';
import { resolveYahooSymbol } from './stock-symbol';

export interface StockSearchResult {
  symbol: string;
  name: string;
  market: Market;
  yahooSymbol: string;
  exchange?: string;
}

export interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchange?: string;
}

const KR_SUFFIX = /\.(KS|KQ)$/i;
const US_EXCLUDED_TYPES = new Set(['MUTUALFUND', 'CRYPTOCURRENCY', 'FUTURE', 'INDEX']);

export function searchFeaturedStocks(query: string, market: Market): StockSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const list = market === Market.KR ? FEATURED_KR_STOCKS : FEATURED_US_STOCKS;
  return list
    .filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    )
    .map((s) => ({
      symbol: s.symbol,
      name: s.name,
      market: s.market,
      yahooSymbol: resolveYahooSymbol(s.symbol, s.market) ?? s.symbol,
    }));
}

export function parseYahooSearchQuote(
  quote: YahooSearchQuote,
  market: Market,
): StockSearchResult | null {
  const rawSymbol = quote.symbol?.trim();
  if (!rawSymbol) return null;

  const name = (quote.longname || quote.shortname || rawSymbol).trim();
  if (!name) return null;

  if (market === Market.KR) {
    if (!KR_SUFFIX.test(rawSymbol)) return null;
    const symbol = rawSymbol.replace(/\.(KS|KQ)$/i, '');
    const suffix = rawSymbol.toUpperCase().endsWith('.KQ') ? '.KQ' : '.KS';
    return {
      symbol,
      name,
      market: Market.KR,
      yahooSymbol: `${symbol}${suffix}`,
      exchange: quote.exchange,
    };
  }

  if (KR_SUFFIX.test(rawSymbol)) return null;
  if (rawSymbol.includes('.')) return null;
  if (quote.quoteType && US_EXCLUDED_TYPES.has(quote.quoteType)) return null;
  if (quote.quoteType && quote.quoteType !== 'EQUITY') return null;

  const symbol = rawSymbol.toUpperCase();
  return {
    symbol,
    name,
    market: Market.US,
    yahooSymbol: symbol,
    exchange: quote.exchange,
  };
}

export function dedupeSearchResults(results: StockSearchResult[]): StockSearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.market}:${r.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
