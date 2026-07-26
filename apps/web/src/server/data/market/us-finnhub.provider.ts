import { Market, type QuoteSetupHintCode } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { MarketDataConfig } from './market-data.config';

const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';

/** US 종목 Finnhub 시세 (MarketDataProvider 내부 adapter) */
export class UsFinnhubMarketProvider {
  constructor(private readonly marketDataConfig = new MarketDataConfig()) {}

  supports(market: Market): boolean {
    return market === Market.US;
  }

  label(): string {
    return 'US';
  }

  isAvailable(): boolean {
    return this.marketDataConfig.isFinnhubConfigured();
  }

  unavailableReason(): string | null {
    if (this.isAvailable()) {
      return null;
    }
    return 'FINNHUB_API_KEY not configured';
  }

  unavailableReasonCode(): QuoteSetupHintCode | null {
    return this.isAvailable() ? null : 'finnhub_api_key_required';
  }

  async fetchQuote(stock: StockEntity) {
    const apiKey = this.marketDataConfig.finnhubApiKey;
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    const url = `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(stock.symbol)}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Finnhub API error (${res.status})`);
    }

    const data = (await res.json()) as { c?: number; dp?: number };
    if (!data.c || data.c <= 0) {
      throw new Error(`Finnhub quote unavailable for ${stock.symbol}`);
    }

    return {
      currentPrice: data.c,
      changePercent: data.dp ?? null,
    };
  }
}
