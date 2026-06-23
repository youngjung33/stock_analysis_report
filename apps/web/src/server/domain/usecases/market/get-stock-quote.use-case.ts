import { Market, QuoteChartRange, resolveCurrency, resolveYahooSymbol } from '@sar/shared';
import { StockQuoteSnapshot } from '../../entities';
import { fetchYahooChartQuote } from '../../../data/market/yahoo-chart.client';

export class GetStockQuoteUseCase {
  async execute(input: {
    symbol: string;
    market: Market;
    range: QuoteChartRange;
  }): Promise<StockQuoteSnapshot> {
    const yahooSymbol = resolveYahooSymbol(input.symbol, input.market) ?? input.symbol.toUpperCase();
    const quote = await fetchYahooChartQuote(yahooSymbol, input.range);

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
