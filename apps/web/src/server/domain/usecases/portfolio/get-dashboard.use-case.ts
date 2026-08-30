import { Market, buildDashboardFromRawHoldings, buildRawHoldingsFromStockBundles, computeCashBalances, normalizeDashboardSummary } from '@sar/shared';
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

    const bundles = [];
    for (const stock of stocks) {
      const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const actions = await this.corpActionRepo.findByUserAndStock(userId, stock.id);
      bundles.push({
        stockId: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market as Market,
        currency: stock.currency,
        transactions: txs,
        corporateActions: actions.map((a) => ({
          type: a.type,
          effectiveAt: a.effectiveAt,
          cashAmount: a.cashAmount,
          splitRatio: a.splitRatio,
          targetQuantity: a.targetQuantity,
          targetPrice: a.targetPrice,
        })),
        quote: quoteMap.get(stock.id) ?? null,
      });
    }

    const { rawHoldings, quoteState } = buildRawHoldingsFromStockBundles(bundles);

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
      hasAllQuotes: quoteState.hasAllQuotes,
      lastRefreshedAt: quoteState.lastRefreshedAt,
    });

    const lastRefreshedAt =
      quoteState.lastRefreshedAt instanceof Date
        ? quoteState.lastRefreshedAt
        : quoteState.lastRefreshedAt
          ? new Date(quoteState.lastRefreshedAt)
          : null;

    return {
      summary: normalizeDashboardSummary(built.summary),
      holdings: built.holdings,
      lastRefreshedAt,
    };
  }
}
