import { Injectable } from '@nestjs/common';
import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { IMarketDataProvider } from '../../domain/repositories';
import { resolveYahooSymbol } from '../../domain/services/stock-symbol.resolver';
import { fetchYahooChartQuote } from './yahoo-chart.client';

/** 한국 주식 시세 — Yahoo Finance chart API (data 계층, API 키 불필요). */
@Injectable()
export class KrYahooMarketProvider implements IMarketDataProvider {
  supports(market: Market): boolean {
    return market === Market.KR;
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
