import { Market, applyCorporateActions, buildDashboardFromRawHoldings, computeCashBalances, cashToKrw, type RawDashboardHolding } from '@sar/shared';
import { DashboardResult } from '../../entities';
import {
  ICashLedgerRepository,
  ICorporateActionRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** 포트폴리오 대시보드 집계 use case */
export class GetDashboardUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly corpActionRepo: ICorporateActionRepository,
    private readonly marketData: IMarketDataProvider,
    private readonly cashRepo: ICashLedgerRepository,
  ) {}

  /** userId 보유 종목 집계 — summary·holdings·lastRefreshedAt 반환 */
  async execute(userId: string): Promise<DashboardResult> {
    const stocks = await this.stockRepo.findHeldByUser(userId);
    const stockIds = stocks.map((s) => s.id);
    const quotes = await this.quoteRepo.findByStockIds(stockIds);
    const quoteMap = new Map(quotes.map((q) => [q.stockId, q]));

    const rawHoldings: RawDashboardHolding[] = [];
    let hasAllQuotes = true;
    let lastRefreshedAt: Date | null = null;

    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const actions = await this.corpActionRepo.findByUserAndStock(userId, stock.id);
      const position = applyCorporateActions(
        txs.map((tx) => ({
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          tradedAt: tx.tradedAt,
        })),
        actions.map((a) => ({
          type: a.type,
          effectiveAt: a.effectiveAt,
          cashAmount: a.cashAmount,
          splitRatio: a.splitRatio,
          targetQuantity: a.targetQuantity,
          targetPrice: a.targetPrice,
        })),
      );

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

      rawHoldings.push({
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

    const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
    let usdKrwRate = hasUsdHoldings ? await this.marketData.fetchUsdKrwRate() : null;

    const cashEntries = await this.cashRepo.findByUser(userId);
    const cashBalances = computeCashBalances(cashEntries);
    if (usdKrwRate === null && (hasUsdHoldings || cashBalances.usd > 0)) {
      usdKrwRate = await this.marketData.fetchUsdKrwRate();
    }

    const built = buildDashboardFromRawHoldings({
      rawHoldings,
      cashBalances,
      usdKrwRate,
      hasAllQuotes,
      lastRefreshedAt,
    });

    return {
      summary: built.summary,
      holdings: built.holdings,
      lastRefreshedAt,
    };
  }
}
