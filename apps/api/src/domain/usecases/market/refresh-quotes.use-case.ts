import { Injectable } from '@nestjs/common';
import { RefreshQuoteResult } from '../../entities';
import {
  IMarketDataProvider,
  IStockQuoteRepository,
  IStockRepository,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';
import { ITransactionRepository } from '../../repositories';

@Injectable()
export class RefreshQuotesUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly marketProviders: IMarketDataProvider[],
  ) {}

  async execute(userId: string): Promise<RefreshQuoteResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const failed: RefreshQuoteResult['failed'] = [];
    let updated = 0;

    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const position = computePosition(txs);
      if (position.quantity <= 0) continue;

      const provider = this.marketProviders.find((p) => p.supports(stock.market));
      if (!provider) {
        failed.push({ stockId: stock.id, symbol: stock.symbol, reason: 'No provider for market' });
        continue;
      }

      try {
        const quote = await provider.fetchQuote(stock);
        await this.quoteRepo.upsert({
          stockId: stock.id,
          currentPrice: quote.currentPrice,
          changePercent: quote.changePercent,
          fetchedAt: new Date(),
        });
        updated += 1;

        if (stock.market === 'US') {
          await sleep(1100);
        }
      } catch (err) {
        failed.push({
          stockId: stock.id,
          symbol: stock.symbol,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return { updated, failed };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
