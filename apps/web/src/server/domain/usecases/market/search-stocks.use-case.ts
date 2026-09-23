import { Market, StockSearchResult } from '@sar/shared';
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

    let catalogCount = 0;
    try {
      catalogCount = await this.catalogRepo.countByMarket(market);
    } catch {
      catalogCount = 0;
    }

    if (catalogCount > 0) {
      return this.catalogRepo.search(trimmed, market, 15);
    }

    try {
      return await this.marketData.searchRemoteStocks(trimmed, market);
    } catch {
      return [];
    }
  }
}
