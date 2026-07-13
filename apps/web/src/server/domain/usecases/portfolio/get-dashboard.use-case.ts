import { Market, aggregatePortfolioTodayPnl, aggregateKrwSummary, applyCorporateActions, computeAllocation, enrichHoldingKrw, computeCashBalances, cashToKrw } from '@sar/shared';
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

    const rawHoldings = [];
    let totalCostBasis = 0;
    let totalMarketValue = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
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

      totalCostBasis += position.costBasis;
      totalRealizedPnl += position.realizedPnl;
      if (marketValue !== null) totalMarketValue += marketValue;
      if (unrealizedPnl !== null) totalUnrealizedPnl += unrealizedPnl;

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

    const hasHoldings = rawHoldings.length > 0;
    const today =
      hasHoldings && hasAllQuotes
        ? aggregatePortfolioTodayPnl(rawHoldings)
        : { todayPnl: null, todayPnlPercent: null };

    const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
    const usdKrwRate = hasUsdHoldings ? await this.marketData.fetchUsdKrwRate() : null;

    const krwSummary = aggregateKrwSummary(rawHoldings, usdKrwRate, hasAllQuotes);
    const allocation = computeAllocation(
      rawHoldings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        market: h.market,
        marketValueKrw: enrichHoldingKrw(h, usdKrwRate).marketValueKrw,
      })),
    );
    const weightMap = new Map(allocation.items.map((i) => [`${i.symbol}:${i.market}`, i.weightPercent]));

    const holdings = rawHoldings.map((h) => ({
      ...h,
      ...enrichHoldingKrw(h, usdKrwRate),
      weightPercent: weightMap.get(`${h.symbol}:${h.market}`) ?? null,
    }));

    const cashEntries = await this.cashRepo.findByUser(userId);
    const cashBalances = computeCashBalances(cashEntries);
    let fxRate = usdKrwRate;
    if (fxRate === null && (hasUsdHoldings || cashBalances.usd > 0)) {
      fxRate = await this.marketData.fetchUsdKrwRate();
    }
    const cashTotalKrwFinal = cashToKrw(cashBalances, fxRate);
    const investedKrw = krwSummary.totalMarketValueKrw ?? 0;
    const totalAssetsKrw =
      krwSummary.totalMarketValueKrw !== null ? investedKrw + cashTotalKrwFinal : null;

    return {
      summary: {
        totalCostBasis,
        totalMarketValue: hasAllQuotes ? totalMarketValue : null,
        totalUnrealizedPnl: hasAllQuotes ? totalUnrealizedPnl : null,
        totalRealizedPnl,
        holdingsCount: holdings.length,
        todayPnl: today.todayPnl,
        todayPnlPercent: today.todayPnlPercent,
        totalCostBasisKrw: krwSummary.totalCostBasisKrw,
        totalMarketValueKrw: krwSummary.totalMarketValueKrw,
        totalUnrealizedPnlKrw: krwSummary.totalUnrealizedPnlKrw,
        totalRealizedPnlKrw: krwSummary.totalRealizedPnlKrw,
        todayPnlKrw: krwSummary.todayPnlKrw,
        todayPnlPercentKrw: krwSummary.todayPnlPercentKrw,
        usdKrwRate: krwSummary.usdKrwRate ?? fxRate,
        hasUsdHoldings: krwSummary.hasUsdHoldings || cashBalances.usd > 0,
        allocationByMarket: allocation.allocationByMarket,
        cashKrw: cashBalances.krw,
        cashUsd: cashBalances.usd,
        cashTotalKrw: cashTotalKrwFinal,
        totalAssetsKrw,
        cashPercent:
          totalAssetsKrw && totalAssetsKrw > 0 ? (cashTotalKrwFinal / totalAssetsKrw) * 100 : null,
        investedPercent:
          totalAssetsKrw && totalAssetsKrw > 0 && krwSummary.totalMarketValueKrw !== null
            ? (krwSummary.totalMarketValueKrw / totalAssetsKrw) * 100
            : null,
      },
      holdings,
      lastRefreshedAt,
    };
  }
}
