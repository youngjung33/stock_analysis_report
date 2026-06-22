import { Market } from '@sar/shared';
import { RefreshQuoteResult } from '../../entities';
import { IMarketDataProvider } from '../../repositories';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { fetchQuoteForStock } from './quote-fetch.helpers';

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
    succeeded: RefreshQuoteResult['succeeded'];
    failed: RefreshQuoteResult['failed'];
  }> {
    const failed: RefreshQuoteResult['failed'] = [];
    const succeeded: RefreshQuoteResult['succeeded'] = [];
    const quotes: {
      stockId: string;
      currentPrice: number;
      changePercent: number | null;
      fetchedAt: string;
    }[] = [];
    let updated = 0;

    for (const stock of stocks) {
      const quote = await fetchQuoteForStock(
        this.marketProviders,
        {
          id: stock.stockId,
          symbol: stock.symbol,
          name: stock.symbol,
          market: stock.market,
          currency: stock.market === Market.KR ? 'KRW' : 'USD',
          yahooSymbol: resolveYahooSymbol(stock.symbol, stock.market),
          createdAt: new Date(),
        },
        failed,
      );
      if (!quote) continue;

      const fetchedAt = new Date().toISOString();
      quotes.push({
        stockId: stock.stockId,
        currentPrice: quote.currentPrice,
        changePercent: quote.changePercent,
        fetchedAt,
      });
      succeeded.push({ stockId: stock.stockId, symbol: stock.symbol, market: stock.market });
      updated += 1;

      if (stock.market === Market.US) {
        await sleep(1100);
      }
    }

    return { updated, quotes, succeeded, failed };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
