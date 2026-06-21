import { Market } from '@sar/shared';
import { RefreshQuoteResult } from '../../entities';
import { IMarketDataProvider } from '../../repositories';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';

export interface FetchQuoteStockInput {
  stockId: string;
  symbol: string;
  market: Market;
}

export class FetchQuotesUseCase {
  constructor(private readonly marketProviders: IMarketDataProvider[]) {}

  async execute(stocks: FetchQuoteStockInput[]): Promise<{
    updated: number;
    quotes: {
      stockId: string;
      currentPrice: number;
      changePercent: number | null;
      fetchedAt: string;
    }[];
    failed: RefreshQuoteResult['failed'];
  }> {
    const failed: RefreshQuoteResult['failed'] = [];
    const quotes: {
      stockId: string;
      currentPrice: number;
      changePercent: number | null;
      fetchedAt: string;
    }[] = [];
    let updated = 0;

    for (const stock of stocks) {
      const provider = this.marketProviders.find((p) => p.supports(stock.market));
      if (!provider) {
        failed.push({ stockId: stock.stockId, symbol: stock.symbol, reason: 'No provider for market' });
        continue;
      }

      if (!provider.isAvailable()) {
        failed.push({
          stockId: stock.stockId,
          symbol: stock.symbol,
          reason: provider.unavailableReason() ?? 'Market data provider not configured',
        });
        continue;
      }

      try {
        const quote = await provider.fetchQuote({
          id: stock.stockId,
          symbol: stock.symbol,
          name: stock.symbol,
          market: stock.market,
          currency: stock.market === Market.KR ? 'KRW' : 'USD',
          yahooSymbol: resolveYahooSymbol(stock.symbol, stock.market),
          createdAt: new Date(),
        });
        const fetchedAt = new Date().toISOString();
        quotes.push({
          stockId: stock.stockId,
          currentPrice: quote.currentPrice,
          changePercent: quote.changePercent,
          fetchedAt,
        });
        updated += 1;

        if (stock.market === Market.US) {
          await sleep(1100);
        }
      } catch (err) {
        failed.push({
          stockId: stock.stockId,
          symbol: stock.symbol,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return { updated, quotes, failed };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
