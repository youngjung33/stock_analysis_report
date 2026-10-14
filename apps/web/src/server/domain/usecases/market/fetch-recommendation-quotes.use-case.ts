import { Market, type QuoteInsightInput } from '@sar/shared';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationQuote,
  setCachedRecommendationQuote,
} from '../../../data/market/recommendation-quote.cache';
import type { EnrichmentFetchOptions } from './enrichment-fetch.types';
import type { StockEntity } from '../../entities';

const inflightQuotes = new Map<
  string,
  Promise<{ currentPrice: number; changePercent: number | null }>
>();

function quoteInflightKey(market: Market, symbol: string): string {
  return `${market}:${symbol.toUpperCase()}`;
}

export function clearRecommendationQuoteInflightForTests(): void {
  inflightQuotes.clear();
}

export interface RecommendationQuoteRequest {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  yahooSymbol?: string;
}

/** 후보 풀 종목 시세 fetch — 15분 TTL 캐시 + 동시 요청 dedupe */
export class FetchRecommendationQuotesUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(
    stocks: RecommendationQuoteRequest[],
    options?: EnrichmentFetchOptions,
  ): Promise<QuoteInsightInput[]> {
    const quotes: QuoteInsightInput[] = [];
    const quality = options?.quality;

    for (const stock of stocks) {
      if (quality) quality.requested += 1;

      const cached =
        options?.bypassCache ? null : getCachedRecommendationQuote(stock.symbol, stock.market);
      if (cached) {
        if (quality) {
          quality.cacheHits += 1;
          quality.received += 1;
        }
        quotes.push({
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          currency: stock.currency,
          currentPrice: cached.currentPrice,
          changePercent: cached.changePercent,
        });
        continue;
      }

      if (!marketDataSupports(this.marketData, stock.market)) {
        if (quality) quality.failed += 1;
        continue;
      }

      try {
        const quote = await this.fetchQuoteDeduped({
          id: `rec:${stock.market}:${stock.symbol}`,
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          currency: stock.currency,
          yahooSymbol: stock.yahooSymbol ?? resolveYahooSymbol(stock.symbol, stock.market),
          createdAt: new Date(),
        });

        setCachedRecommendationQuote({
          symbol: stock.symbol,
          market: stock.market,
          currentPrice: quote.currentPrice,
          changePercent: quote.changePercent,
          fetchedAt: Date.now(),
        });

        quotes.push({
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          currency: stock.currency,
          currentPrice: quote.currentPrice,
          changePercent: quote.changePercent,
        });
        if (quality) quality.received += 1;
      } catch {
        if (quality) quality.failed += 1;
      }
    }

    return quotes;
  }

  private fetchQuoteDeduped(stock: StockEntity) {
    const key = quoteInflightKey(stock.market as Market, stock.symbol);
    const existing = inflightQuotes.get(key);
    if (existing) return existing;

    const promise = this.marketData.fetchStockQuote(stock).finally(() => {
      inflightQuotes.delete(key);
    });
    inflightQuotes.set(key, promise);
    return promise;
  }
}

function marketDataSupports(marketData: IMarketDataProvider, market: Market): boolean {
  return marketData.supports(market) && marketData.isAvailable(market);
}
