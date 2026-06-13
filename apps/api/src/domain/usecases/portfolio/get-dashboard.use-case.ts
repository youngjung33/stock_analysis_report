import { Injectable } from '@nestjs/common';
import { Market } from '@sar/shared';
import { DashboardResult } from '../../entities';
import {
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';

@Injectable()
export class GetDashboardUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
  ) {}

  async execute(userId: string): Promise<DashboardResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const stockIds = stocks.map((s) => s.id);
    const quotes = await this.quoteRepo.findByStockIds(stockIds);
    const quoteMap = new Map(quotes.map((q) => [q.stockId, q]));

    const holdings = [];
    let totalCostBasis = 0;
    let totalMarketValue = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let hasAllQuotes = true;
    let lastRefreshedAt: Date | null = null;

    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const position = computePosition(txs);

      if (position.quantity <= 0) continue;

      const quote = quoteMap.get(stock.id);
      const currentPrice = quote?.currentPrice ?? null;
      const changePercent = quote?.changePercent ?? null;

      if (quote) {
        if (!lastRefreshedAt || quote.fetchedAt > lastRefreshedAt) {
          lastRefreshedAt = quote.fetchedAt;
        }
      } else {
        hasAllQuotes = false;
      }

      const marketValue = currentPrice !== null ? currentPrice * position.quantity : null;
      const unrealizedPnl =
        currentPrice !== null ? (currentPrice - position.averageCost) * position.quantity : null;
      const unrealizedPnlPercent =
        currentPrice !== null && position.averageCost > 0
          ? ((currentPrice - position.averageCost) / position.averageCost) * 100
          : null;

      totalCostBasis += position.costBasis;
      totalRealizedPnl += position.realizedPnl;
      if (marketValue !== null) totalMarketValue += marketValue;
      if (unrealizedPnl !== null) totalUnrealizedPnl += unrealizedPnl;

      holdings.push({
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market as Market,
        currency: stock.currency,
        quantity: position.quantity,
        averageCost: position.averageCost,
        currentPrice,
        changePercent,
        marketValue,
        unrealizedPnl,
        unrealizedPnlPercent,
        realizedPnl: position.realizedPnl,
        costBasis: position.costBasis,
      });
    }

    return {
      summary: {
        totalCostBasis,
        totalMarketValue: hasAllQuotes ? totalMarketValue : null,
        totalUnrealizedPnl: hasAllQuotes ? totalUnrealizedPnl : null,
        totalRealizedPnl,
        holdingsCount: holdings.length,
      },
      holdings,
      lastRefreshedAt,
    };
  }
}
