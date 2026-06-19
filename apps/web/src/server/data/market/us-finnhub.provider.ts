import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { IMarketDataProvider } from '../../domain/repositories';
import { MarketDataConfig } from './market-data.config';

const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';
const FINNHUB_REGISTER_URL = 'https://finnhub.io/register';

export class UsFinnhubMarketProvider implements IMarketDataProvider {
  constructor(private readonly marketDataConfig = new MarketDataConfig()) {}

  supports(market: Market): boolean {
    return market === Market.US;
  }

  isAvailable(): boolean {
    return this.marketDataConfig.isFinnhubConfigured();
  }

  unavailableReason(): string | null {
    if (this.isAvailable()) {
      return null;
    }
    return `FINNHUB_API_KEY is not configured. Get a free key at ${FINNHUB_REGISTER_URL} and set it in .env`;
  }

  async fetchQuote(stock: StockEntity) {
    const apiKey = this.marketDataConfig.finnhubApiKey;
    if (!apiKey) {
      throw new Error(this.unavailableReason() ?? 'FINNHUB_API_KEY is not configured');
    }

    const url = `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(stock.symbol)}&token=${apiKey}`;
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
