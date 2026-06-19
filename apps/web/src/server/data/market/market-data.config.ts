export const FINNHUB_PLACEHOLDER_KEY = 'your-finnhub-api-key';

export class MarketDataConfig {
  get finnhubApiKey(): string | null {
    const raw = process.env.FINNHUB_API_KEY?.trim();
    if (!raw || raw === FINNHUB_PLACEHOLDER_KEY) {
      return null;
    }
    return raw;
  }

  isFinnhubConfigured(): boolean {
    return this.finnhubApiKey !== null;
  }
}
