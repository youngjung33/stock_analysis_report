import { Injectable } from '@nestjs/common';
import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { IMarketDataProvider } from '../../domain/repositories';

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
      };
    }>;
  };
}

@Injectable()
export class YahooFinanceProvider implements IMarketDataProvider {
  supports(market: Market): boolean {
    return market === Market.KR;
  }

  async fetchQuote(stock: StockEntity) {
    const symbol = stock.yahooSymbol ?? stock.symbol;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance API error: ${res.status}`);
    }

    const data = (await res.json()) as YahooChartResponse;
    const meta = data.chart?.result?.[0]?.meta;
    const currentPrice = meta?.regularMarketPrice;
    const previousClose = meta?.chartPreviousClose;

    if (!currentPrice || currentPrice <= 0) {
      throw new Error(`No quote data from Yahoo Finance for ${symbol}`);
    }

    const changePercent =
      previousClose && previousClose > 0
        ? ((currentPrice - previousClose) / previousClose) * 100
        : null;

    return {
      currentPrice,
      changePercent,
    };
  }
}
