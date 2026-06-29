import { Market, aggregatePortfolioTodayPnl, aggregateKrwSummary, applyCorporateActions, computeAllocation, enrichHoldingKrw } from '@sar/shared';
import { Dashboard, PortfolioHolding, RefreshQuoteResult } from '../../domain/models';
import { IPortfolioRepository } from '../../domain/repositories';
import { apiClient } from '../api/client';
import {
  getGuestQuotes,
  guestTransactionsForStock,
  listGuestCorporateActions,
  listGuestTransactions,
  saveGuestQuotes,
} from './guest-storage';

async function fetchGuestUsdKrwRate(): Promise<number | null> {
  try {
    const { data } = await apiClient.get<{ usdKrwRate: number | null }>('/market/fx');
    return data.usdKrwRate;
  } catch {
    return null;
  }
}

export class GuestPortfolioRepository implements IPortfolioRepository {
  async getDashboard(): Promise<Dashboard> {
    const txs = listGuestTransactions();
    const stockIds = [...new Set(txs.map((tx) => tx.stockId))];
    const quotes = getGuestQuotes();

    const rawHoldings = [];
    let totalCostBasis = 0;
    let totalMarketValue = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let hasAllQuotes = true;
    let lastRefreshedAt: string | null = null;

    for (const stockId of stockIds) {
      const stockTxs = guestTransactionsForStock(stockId);
      const sample = stockTxs[0]?.stock;
      if (!sample) continue;

      const corpActions = listGuestCorporateActions().filter((a) => a.stockId === stockId);
      const position = applyCorporateActions(
        stockTxs.map((tx) => ({
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          tradedAt: tx.tradedAt,
        })),
        corpActions.map((a) => ({
          type: a.type,
          effectiveAt: a.effectiveAt,
          cashAmount: a.cashAmount,
          splitRatio: a.splitRatio,
          targetQuantity: a.targetQuantity,
          targetPrice: a.targetPrice,
        })),
      );

      if (position.quantity <= 0) continue;

      const quote = quotes[stockId];
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
        stockId,
        symbol: sample.symbol,
        name: sample.name,
        market: sample.market as Market,
        currency: sample.currency,
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
    const usdKrwRate = hasUsdHoldings ? await fetchGuestUsdKrwRate() : null;
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

    return {
      summary: {
        totalCostBasis,
        totalMarketValue: !hasHoldings ? 0 : hasAllQuotes ? totalMarketValue : null,
        totalUnrealizedPnl: !hasHoldings ? 0 : hasAllQuotes ? totalUnrealizedPnl : null,
        totalRealizedPnl,
        holdingsCount: holdings.length,
        todayPnl: !hasHoldings ? 0 : today.todayPnl,
        todayPnlPercent: !hasHoldings ? 0 : today.todayPnlPercent,
        totalCostBasisKrw: krwSummary.totalCostBasisKrw,
        totalMarketValueKrw: krwSummary.totalMarketValueKrw,
        totalUnrealizedPnlKrw: krwSummary.totalUnrealizedPnlKrw,
        totalRealizedPnlKrw: krwSummary.totalRealizedPnlKrw,
        todayPnlKrw: krwSummary.todayPnlKrw,
        todayPnlPercentKrw: krwSummary.todayPnlPercentKrw,
        usdKrwRate: krwSummary.usdKrwRate,
        hasUsdHoldings: krwSummary.hasUsdHoldings,
        allocationByMarket: allocation.allocationByMarket,
      },
      holdings,
      lastRefreshedAt,
    };
  }

  async getHolding(symbol: string, market: Market): Promise<PortfolioHolding | null> {
    const txs = listGuestTransactions();
    const stockTxs = txs.filter((tx) => tx.stock?.symbol === symbol && tx.stock?.market === market);
    if (stockTxs.length === 0) return null;

    const sample = stockTxs[0].stock!;
    const stockId = stockTxs[0].stockId;
    const quotes = getGuestQuotes();
    const quote = quotes[stockId];

    const corpActions = listGuestCorporateActions().filter((a) => a.stockId === stockId);
    const position = applyCorporateActions(
      stockTxs.map((tx) => ({
        type: tx.type,
        quantity: tx.quantity,
        price: tx.price,
        tradedAt: tx.tradedAt,
      })),
      corpActions.map((a) => ({
        type: a.type,
        effectiveAt: a.effectiveAt,
        cashAmount: a.cashAmount,
        splitRatio: a.splitRatio,
        targetQuantity: a.targetQuantity,
        targetPrice: a.targetPrice,
      })),
    );
    if (position.quantity <= 0) return null;

    const currentPrice = quote?.currentPrice ?? null;
    const changePercent = quote?.changePercent ?? null;
    const marketValue = currentPrice !== null ? currentPrice * position.quantity : null;
    const unrealizedPnl =
      currentPrice !== null ? (currentPrice - position.averageCost) * position.quantity : null;
    const unrealizedPnlPercent =
      currentPrice !== null && position.averageCost > 0
        ? ((currentPrice - position.averageCost) / position.averageCost) * 100
        : null;

    const usdKrwRate = sample.currency === 'USD' ? await fetchGuestUsdKrwRate() : null;
    const base = {
      stockId,
      symbol: sample.symbol,
      name: sample.name,
      market: sample.market as Market,
      currency: sample.currency,
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice,
      changePercent,
      marketValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      realizedPnl: position.realizedPnl,
      costBasis: position.costBasis,
    };

    return {
      ...base,
      ...enrichHoldingKrw(base, usdKrwRate),
      weightPercent: null,
      usdKrwRate,
    };
  }

  async refreshQuotes(): Promise<RefreshQuoteResult> {
    const txs = listGuestTransactions();
    const stocks = new Map<string, { stockId: string; symbol: string; market: Market }>();

    for (const tx of txs) {
      if (!tx.stock) continue;
      stocks.set(tx.stockId, {
        stockId: tx.stockId,
        symbol: tx.stock.symbol,
        market: tx.stock.market,
      });
    }

    if (stocks.size === 0) {
      return { updated: 0, succeeded: [], failed: [] };
    }

    const { data } = await apiClient.post<{
      updated: number;
      quotes: { stockId: string; currentPrice: number; changePercent: number | null; fetchedAt: string }[];
      succeeded: RefreshQuoteResult['succeeded'];
      failed: RefreshQuoteResult['failed'];
    }>('/market/quotes', { stocks: [...stocks.values()] });

    saveGuestQuotes(data.quotes);
    return { updated: data.updated, succeeded: data.succeeded, failed: data.failed };
  }

  async getAnalysis(): Promise<import('../../domain/models').PortfolioAnalysisResult> {
    throw new Error('Guest mode does not support portfolio analysis');
  }
}
