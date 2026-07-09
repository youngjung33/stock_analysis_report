import { Market } from '@sar/shared';
import { RefreshQuoteResult, StockEntity } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';
import { fetchQuoteForStock } from './quote-fetch.helpers';

/** 보유 종목 시세 DB 갱신 — KR 병렬, US 순차(Finnhub rate limit) */
export class RefreshQuotesUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  async execute(userId: string): Promise<RefreshQuoteResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const held: StockEntity[] = [];

    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const position = computePosition(txs);
      if (position.quantity > 0) held.push(stock);
    }

    const krStocks = held.filter((s) => s.market === Market.KR);
    const usStocks = held.filter((s) => s.market === Market.US);

    const failed: RefreshQuoteResult['failed'] = [];
    const succeeded: RefreshQuoteResult['succeeded'] = [];
    let updated = 0;

    const krResults = await Promise.all(
      krStocks.map((stock) => this.refreshOne(stock, failed)),
    );
    for (const item of krResults) {
      if (!item) continue;
      succeeded.push(item);
      updated += 1;
    }

    for (const stock of usStocks) {
      const item = await this.refreshOne(stock, failed);
      if (item) {
        succeeded.push(item);
        updated += 1;
      }
      await sleep(1100);
    }

    return { updated, succeeded, failed };
  }

  private async refreshOne(
    stock: StockEntity,
    failed: RefreshQuoteResult['failed'],
  ) {
    const quote = await fetchQuoteForStock(this.marketData, stock, failed);
    if (!quote) return null;

    await this.quoteRepo.upsert({
      stockId: stock.id,
      currentPrice: quote.currentPrice,
      changePercent: quote.changePercent,
      fetchedAt: new Date(),
    });

    return { stockId: stock.id, symbol: stock.symbol, market: stock.market as Market };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
