import {
  Market,
  StockSearchResult,
  dedupeSearchResults,
  searchFeaturedStocks,
} from '@sar/shared';
import { PrismaStockCatalogRepository } from '../../../data/persistence/stock-catalog.repository';
import { fetchYahooStockSearch } from '../../../data/market/yahoo-search.client';

export class SearchStocksUseCase {
  constructor(private readonly catalogRepo = new PrismaStockCatalogRepository()) {}

  async execute(query: string, market: Market): Promise<StockSearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];

    const catalogCount = await this.catalogRepo.countByMarket(market);
    if (catalogCount > 0) {
      return this.catalogRepo.search(trimmed, market, 15);
    }

    const featured = searchFeaturedStocks(trimmed, market);
    let remote: StockSearchResult[] = [];

    try {
      remote = await fetchYahooStockSearch(trimmed, market);
    } catch {
      // DB 마스터 없을 때 Yahoo fallback
    }

    return dedupeSearchResults([...featured, ...remote]).slice(0, 15);
  }
}
