import {
  FEATURED_KR_STOCKS,
  FEATURED_US_STOCKS,
  FeaturedStock,
  featuredStockId,
  resolveCurrency,
} from '@sar/shared';
import { FeaturedQuotesResult } from '../../entities';
import { FetchQuotesUseCase } from './fetch-quotes.use-case';

export class GetFeaturedQuotesUseCase {
  constructor(private readonly fetchQuotesUseCase: FetchQuotesUseCase) {}

  async execute(): Promise<FeaturedQuotesResult> {
    const inputs = [...FEATURED_KR_STOCKS, ...FEATURED_US_STOCKS].map((stock) => ({
      stockId: featuredStockId(stock.symbol, stock.market),
      symbol: stock.symbol,
      market: stock.market,
    }));

    const { quotes, failed } = await this.fetchQuotesUseCase.execute(inputs);
    const quoteMap = new Map(quotes.map((q) => [q.stockId, q]));
    const failedMap = new Map(failed.map((f) => [f.stockId, f.reason]));

    const mapSection = (stocks: FeaturedStock[]) =>
      stocks.map((stock) => {
        const stockId = featuredStockId(stock.symbol, stock.market);
        const quote = quoteMap.get(stockId);
        return {
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          currency: resolveCurrency(stock.market),
          currentPrice: quote?.currentPrice ?? null,
          changePercent: quote?.changePercent ?? null,
          unavailableReason: quote ? null : (failedMap.get(stockId) ?? '시세를 가져오지 못했습니다.'),
        };
      });

    return {
      kr: mapSection(FEATURED_KR_STOCKS),
      us: mapSection(FEATURED_US_STOCKS),
      fetchedAt: new Date().toISOString(),
    };
  }
}
