import { Market, QuoteChartRange, resolveCurrency, resolveYahooSymbol } from '@sar/shared';
import { StockQuoteSnapshot } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** 종목 기간별 시세·차트 조회 use case */
export class GetStockQuoteUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  /** symbol·market·range 기준 시세·차트 스냅샷 반환 */
  async execute(input: {
    symbol: string;
    market: Market;
    range: QuoteChartRange;
  }): Promise<StockQuoteSnapshot> {
    const yahooSymbol = resolveYahooSymbol(input.symbol, input.market) ?? input.symbol.toUpperCase();
    const quote = await this.marketData.fetchChartQuote(yahooSymbol, input.range);

    return {
      symbol: input.symbol.toUpperCase(),
      market: input.market,
      currency: resolveCurrency(input.market),
      range: input.range,
      currentPrice: quote.currentPrice,
      changePercent: quote.changePercent,
      fetchedAt: new Date().toISOString(),
      points: quote.points,
    };
  }
}
