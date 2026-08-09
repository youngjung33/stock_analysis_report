import { Market, type QuoteInsightInput } from '@sar/shared';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  getCachedRecommendationQuote,
  setCachedRecommendationQuote,
} from '../../../data/market/recommendation-quote.cache';

export interface RecommendationQuoteRequest {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  yahooSymbol?: string;
}

/** 후보 풀 종목 시세 fetch — 15분 TTL 캐시, US rate limit sleep */
export class FetchRecommendationQuotesUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  async execute(stocks: RecommendationQuoteRequest[]): Promise<QuoteInsightInput[]> {
    const quotes: QuoteInsightInput[] = [];

    for (const stock of stocks) {
      const cached = getCachedRecommendationQuote(stock.symbol, stock.market);
      if (cached) {
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

      if (!marketDataSupports(this.marketData, stock.market)) continue;

      try {
        const quote = await this.marketData.fetchStockQuote({
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
      } catch {
        // skip failed quote
      }

      if (stock.market === Market.US) {
        await sleep(1100);
      }
    }

    return quotes;
  }
}

function marketDataSupports(marketData: IMarketDataProvider, market: Market): boolean {
  return marketData.supports(market) && marketData.isAvailable(market);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
