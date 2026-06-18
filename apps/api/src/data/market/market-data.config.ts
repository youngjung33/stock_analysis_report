import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const FINNHUB_PLACEHOLDER_KEY = 'your-finnhub-api-key';

@Injectable()
export class MarketDataConfig {
  constructor(private readonly config: ConfigService) {}

  /** Finnhub API key from .env, or null if unset / placeholder. */
  get finnhubApiKey(): string | null {
    const raw = this.config.get<string>('FINNHUB_API_KEY')?.trim();
    if (!raw || raw === FINNHUB_PLACEHOLDER_KEY) {
      return null;
    }
    return raw;
  }

  isFinnhubConfigured(): boolean {
    return this.finnhubApiKey !== null;
  }
}
