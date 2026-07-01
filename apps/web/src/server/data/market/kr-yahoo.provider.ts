import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { resolveYahooSymbol } from '../../domain/services/stock-symbol.resolver';
import { fetchYahooChartQuote } from './yahoo-chart.client';

/** KR 종목 Yahoo 시세 (MarketDataProvider 내부 adapter) */
export class KrYahooMarketProvider {
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
