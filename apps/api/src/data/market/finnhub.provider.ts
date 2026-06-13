import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { IMarketDataProvider } from '../../domain/repositories';

@Injectable()
export class FinnhubProvider implements IMarketDataProvider {
  constructor(private readonly config: ConfigService) {}

  supports(market: Market): boolean {
    return market === Market.US;
  }

  async fetchQuote(stock: StockEntity) {
    const apiKey = this.config.get<string>('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY is not configured');
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(stock.symbol)}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Finnhub API error: ${res.status}`);
    }

    const data = (await res.json()) as { c?: number; dp?: number };
    if (!data.c || data.c <= 0) {
      throw new Error('No quote data from Finnhub');
    }

    return {
      currentPrice: data.c,
      changePercent: data.dp ?? null,
    };
  }
}
