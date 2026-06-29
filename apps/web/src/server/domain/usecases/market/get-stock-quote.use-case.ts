import { Market, QuoteChartRange, resolveCurrency, resolveYahooSymbol } from '@sar/shared';
import { StockQuoteSnapshot } from '../../entities';
import { IChartQuoteProvider } from '../../ports/market-data.ports';

/** 종목 기간별 시세·차트 조회 use case */
export class GetStockQuoteUseCase {
  constructor(private readonly chartQuoteProvider: IChartQuoteProvider) {}

  async execute(input: {
    symbol: string;
    market: Market;
    range: QuoteChartRange;
  }): Promise<StockQuoteSnapshot> {
    const yahooSymbol = resolveYahooSymbol(input.symbol, input.market) ?? input.symbol.toUpperCase();
    const quote = await this.chartQuoteProvider.fetchQuote(yahooSymbol, input.range);

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
