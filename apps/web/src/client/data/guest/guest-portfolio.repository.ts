import { Market, computePosition } from '@sar/shared';
import { Dashboard, RefreshQuoteResult } from '../../domain/models';
import { IPortfolioRepository } from '../../domain/repositories';
import { apiClient } from '../api/client';
import {
  getGuestQuotes,
  guestTransactionsForStock,
  listGuestTransactions,
  saveGuestQuotes,
} from './guest-storage';

export class GuestPortfolioRepository implements IPortfolioRepository {
  async getDashboard(): Promise<Dashboard> {
    const txs = listGuestTransactions();
    const stockIds = [...new Set(txs.map((tx) => tx.stockId))];
    const quotes = getGuestQuotes();

    const holdings = [];
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

      const position = computePosition(
        stockTxs.map((tx) => ({
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          tradedAt: tx.tradedAt,
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

      holdings.push({
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

    const hasHoldings = holdings.length > 0;

    return {
      summary: {
        totalCostBasis,
        totalMarketValue: !hasHoldings ? 0 : hasAllQuotes ? totalMarketValue : null,
        totalUnrealizedPnl: !hasHoldings ? 0 : hasAllQuotes ? totalUnrealizedPnl : null,
        totalRealizedPnl,
        holdingsCount: holdings.length,
      },
      holdings,
      lastRefreshedAt,
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
}
