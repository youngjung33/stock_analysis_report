import { Market } from '@sar/shared';
import { StockEntity } from '../../domain/entities';
import { MarketDataConfig } from './market-data.config';

const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';
const FINNHUB_REGISTER_URL = 'https://finnhub.io/register';

/** US 종목 Finnhub 시세 (MarketDataProvider 내부 adapter) */
export class UsFinnhubMarketProvider {
  constructor(private readonly marketDataConfig = new MarketDataConfig()) {}

  supports(market: Market): boolean {
    return market === Market.US;
  }

  label(): string {
    return '미국 주식 (Finnhub)';
  }

  isAvailable(): boolean {
    return this.marketDataConfig.isFinnhubConfigured();
  }

  unavailableReason(): string | null {
    if (this.isAvailable()) {
      return null;
    }
    return `미국 주식 시세는 Finnhub API 키가 필요합니다. ${FINNHUB_REGISTER_URL} 에서 무료 키를 발급한 뒤 apps/web/.env 의 FINNHUB_API_KEY 에 설정해 주세요.`;
  }

  async fetchQuote(stock: StockEntity) {
    const apiKey = this.marketDataConfig.finnhubApiKey;
    if (!apiKey) {
      throw new Error(this.unavailableReason() ?? 'FINNHUB_API_KEY is not configured');
    }

    const url = `${FINNHUB_QUOTE_URL}?symbol=${encodeURIComponent(stock.symbol)}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Finnhub API 오류 (${res.status}). API 키를 확인해 주세요.`);
    }

    const data = (await res.json()) as { c?: number; dp?: number };
    if (!data.c || data.c <= 0) {
      throw new Error(`${stock.symbol} 시세를 Finnhub에서 가져오지 못했습니다.`);
    }

    return {
      currentPrice: data.c,
      changePercent: data.dp ?? null,
    };
  }
}
