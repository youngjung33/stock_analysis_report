import { Market } from '@sar/shared';
import { RefreshQuoteResult } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';
import { resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { fetchQuoteForStock } from './quote-fetch.helpers';

export interface FetchQuoteStockInput {
  stockId: string;
  symbol: string;
  market: Market;
}

/** 다종목 시세 일괄 조회 use case (게스트 quotes API) */
export class FetchQuotesUseCase {
  constructor(private readonly marketData: IMarketDataProvider) {}

  /** body 종목 목록별 KR/US 시세 fetch — US는 rate limit sleep */
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
        this.marketData,
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

      // Finnhub free tier rate limit
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
