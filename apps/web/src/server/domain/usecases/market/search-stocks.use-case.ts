import {
  Market,
  StockSearchResult,
  dedupeSearchResults,
  searchFeaturedStocks,
} from '@sar/shared';
import { fetchYahooStockSearch } from '../../../data/market/yahoo-search.client';

export class SearchStocksUseCase {
  async execute(query: string, market: Market): Promise<StockSearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];

    const featured = searchFeaturedStocks(trimmed, market);
    let remote: StockSearchResult[] = [];

    try {
      remote = await fetchYahooStockSearch(trimmed, market);
    } catch {
      // Yahoo 실패 시 대표 종목 매칭만 반환
    }

    return dedupeSearchResults([...featured, ...remote]).slice(0, 15);
  }
}
