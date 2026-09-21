import {
  FEATURED_KR_STOCKS,
  FEATURED_US_STOCKS,
  FeaturedStock,
  Market,
  REGION_SENTIMENT_INDEX_SYMBOL,
  featuredStockId,
  resolveCurrency,
} from '@sar/shared';
import { FeaturedQuotesResult } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';
import { FetchQuotesUseCase } from './fetch-quotes.use-case';

/** KR/US 대표 종목 시세 + 코스피·나스닥 지수 조회 use case */
export class GetFeaturedQuotesUseCase {
  constructor(
    private readonly fetchQuotesUseCase: FetchQuotesUseCase,
    private readonly marketData: IMarketDataProvider,
  ) {}

  /** FEATURED 종목 시세 fetch — kr/us 섹션·fetchedAt 반환 */
  async execute(): Promise<FeaturedQuotesResult> {
    const inputs = [...FEATURED_KR_STOCKS, ...FEATURED_US_STOCKS].map((stock) => ({
      stockId: featuredStockId(stock.symbol, stock.market),
      symbol: stock.symbol,
      market: stock.market,
    }));

    const [{ quotes, failed }, krIndexSeries, usIndexSeries] = await Promise.all([
      this.fetchQuotesUseCase.execute(inputs),
      this.marketData.fetchChartSeries(REGION_SENTIMENT_INDEX_SYMBOL[Market.KR]).catch(() => null),
      this.marketData.fetchChartSeries(REGION_SENTIMENT_INDEX_SYMBOL[Market.US]).catch(() => null),
    ]);
    const quoteMap = new Map(quotes.map((q) => [q.stockId, q]));
    const failedMap = new Map(failed.map((f) => [f.stockId, f.reasonCode]));

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
          unavailableReasonCode: quote ? null : (failedMap.get(stockId) ?? 'fetch_error'),
        };
      });

    return {
      kr: mapSection(FEATURED_KR_STOCKS),
      us: mapSection(FEATURED_US_STOCKS),
      indices: [
        {
          name: 'KOSPI',
          yahooSymbol: REGION_SENTIMENT_INDEX_SYMBOL[Market.KR],
          market: Market.KR,
          currentPrice: krIndexSeries?.currentPrice ?? null,
          changePercent1d: krIndexSeries?.changePercent1d ?? null,
        },
        {
          name: 'NASDAQ',
          yahooSymbol: REGION_SENTIMENT_INDEX_SYMBOL[Market.US],
          market: Market.US,
          currentPrice: usIndexSeries?.currentPrice ?? null,
          changePercent1d: usIndexSeries?.changePercent1d ?? null,
        },
      ],
      fetchedAt: new Date().toISOString(),
    };
  }
}
