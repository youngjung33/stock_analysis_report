import {
  Market,
  StockSearchResult,
  dedupeSearchResults,
  searchFeaturedStocks,
} from '@sar/shared';
import { IStockCatalogRepository } from '../../repositories';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** 종목 검색 — DB catalog 우선, 없으면 Yahoo fallback */
export class SearchStocksUseCase {
  constructor(
    private readonly catalogRepo: IStockCatalogRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  /** query·market 기준 종목 검색 — catalog 우선, 없으면 Yahoo fallback */
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
      remote = await this.marketData.searchRemoteStocks(trimmed, market);
    } catch {
      // DB 마스터 없을 때 Yahoo fallback 실패 시 featured만 반환
    }

    return dedupeSearchResults([...featured, ...remote]).slice(0, 15);
  }
}
