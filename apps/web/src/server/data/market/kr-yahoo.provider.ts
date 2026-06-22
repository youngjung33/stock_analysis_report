import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { IMarketDataProvider } from '../../domain/repositories';
import { resolveYahooSymbol } from '../../domain/services/stock-symbol.resolver';
import { fetchYahooChartQuote } from './yahoo-chart.client';

export class KrYahooMarketProvider implements IMarketDataProvider {
  supports(market: Market): boolean {
    return market === Market.KR;
  }

  label(): string {
    return '한국 주식 (Yahoo Finance)';
  }

  isAvailable(): boolean {
    return true;
  }

  unavailableReason(): string | null {
    return null;
  }

  async fetchQuote(stock: StockEntity) {
    const symbol =
      stock.yahooSymbol ?? resolveYahooSymbol(stock.symbol, Market.KR) ?? stock.symbol;
    return fetchYahooChartQuote(symbol);
  }
}
