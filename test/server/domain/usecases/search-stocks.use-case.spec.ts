import { Market } from '@sar/shared';
import { SearchStocksUseCase } from '@server/domain/usecases/market/search-stocks.use-case';
import { createMockCatalogRepo, createMockMarketData } from '../../mocks/repositories.mock';

describe('SearchStocksUseCase', () => {
  it('returns empty array for blank query', async () => {
    const useCase = new SearchStocksUseCase(createMockCatalogRepo(), createMockMarketData());
    expect(await useCase.execute('   ', Market.KR)).toEqual([]);
  });

  it('uses catalog search when catalog has entries', async () => {
    const catalog = createMockCatalogRepo();
    catalog.countByMarket.mockResolvedValue(100);
    catalog.search.mockResolvedValue([
      { symbol: '005930', name: '삼성전자', market: Market.KR, yahooSymbol: '005930.KS', exchange: 'KOSPI' },
    ]);

    const useCase = new SearchStocksUseCase(catalog, createMockMarketData());
    const results = await useCase.execute('삼성', Market.KR);

    expect(results).toHaveLength(1);
    expect(catalog.search).toHaveBeenCalledWith('삼성', Market.KR, 15);
  });

  it('falls back to featured and remote when catalog empty', async () => {
    const catalog = createMockCatalogRepo();
    const marketData = createMockMarketData();
    marketData.searchRemoteStocks.mockResolvedValue([
      { symbol: '005930', name: '삼성전자', market: Market.KR, yahooSymbol: '005930.KS', exchange: 'KOSPI' },
    ]);

    const useCase = new SearchStocksUseCase(catalog, marketData);
    const results = await useCase.execute('005930', Market.KR);

    expect(results.length).toBeGreaterThan(0);
    expect(marketData.searchRemoteStocks).toHaveBeenCalled();
  });
});
