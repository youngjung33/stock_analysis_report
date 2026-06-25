import {
  Market,
  StockSearchResult,
  dedupeSearchResults,
  parseYahooSearchQuote,
} from '@sar/shared';

const YAHOO_SEARCH_BASE = 'https://query1.finance.yahoo.com/v1/finance/search';

interface YahooSearchResponse {
  quotes?: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    quoteType?: string;
    exchange?: string;
  }>;
}

export async function fetchYahooStockSearch(
  query: string,
  market: Market,
  limit = 12,
): Promise<StockSearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const url = `${YAHOO_SEARCH_BASE}?q=${encodeURIComponent(q)}&quotesCount=${limit}&newsCount=0&enableFuzzyQuery=true`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
  });

  if (!res.ok) {
    throw new Error(`Yahoo search error: ${res.status}`);
  }

  const data = (await res.json()) as YahooSearchResponse;
  const parsed = (data.quotes ?? [])
    .map((quote) => parseYahooSearchQuote(quote, market))
    .filter((r): r is StockSearchResult => r !== null);

  return dedupeSearchResults(parsed);
}
