import { Market } from '@sar/shared';
import { RefreshQuoteResult } from '../../entities';
import { IMarketDataProvider } from '../../ports/market-data.port';
import {
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';
import { fetchQuoteForStock } from './quote-fetch.helpers';

/** 보유 종목 시세 DB 갱신 use case */
export class RefreshQuotesUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  /** userId 보유 종목 순회 — 시세 fetch 후 quoteRepo upsert */
  async execute(userId: string): Promise<RefreshQuoteResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const failed: RefreshQuoteResult['failed'] = [];
    const succeeded: RefreshQuoteResult['succeeded'] = [];
    let updated = 0;

    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const position = computePosition(txs);
      if (position.quantity <= 0) continue;

      const quote = await fetchQuoteForStock(this.marketData, stock, failed);
      if (!quote) continue;

      await this.quoteRepo.upsert({
        stockId: stock.id,
        currentPrice: quote.currentPrice,
        changePercent: quote.changePercent,
        fetchedAt: new Date(),
      });
      succeeded.push({ stockId: stock.id, symbol: stock.symbol, market: stock.market as Market });
      updated += 1;

      if (stock.market === 'US') {
        await sleep(1100);
      }
    }

    return { updated, succeeded, failed };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
