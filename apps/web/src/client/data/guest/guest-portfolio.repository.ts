import {
  Market,
  applyCorporateActions,
  buildDashboardFromRawHoldings,
  buildHoldingWithKrw,
  buildRawDashboardHolding,
  nextQuoteRefreshState,
  normalizeDashboardSummary,
  type QuoteRefreshState,
  type RawDashboardHolding,
} from '@sar/shared';
import { Dashboard, PortfolioHolding, RefreshQuoteResult } from '../../domain/models';
import { IMarketRepository, IPortfolioRepository } from '../../domain/repositories';
import {
  getGuestQuotes,
  getGuestCashBalances,
  guestTransactionsForStock,
  listGuestCorporateActions,
  listGuestTransactions,
  saveGuestQuotes,
} from './guest-storage';

export class GuestPortfolioRepository implements IPortfolioRepository {
  constructor(private readonly marketRepo: IMarketRepository) {}

  private async fetchUsdKrwRate(): Promise<number | null> {
    try {
      const { usdKrwRate } = await this.marketRepo.getFxRate();
      return usdKrwRate;
    } catch {
      return null;
    }
  }

  async getDashboard(): Promise<Dashboard> {
    const txs = listGuestTransactions();
    const stockIds = [...new Set(txs.map((tx) => tx.stockId))];
    const quotes = getGuestQuotes();

    const rawHoldings: RawDashboardHolding[] = [];
    let quoteState: QuoteRefreshState = { lastRefreshedAt: null, hasAllQuotes: true };

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

      const quote = quotes[stockId];
      quoteState = nextQuoteRefreshState(quoteState, quote ?? null);

      const raw = buildRawDashboardHolding({
        stockId,
        symbol: sample.symbol,
        name: sample.name,
        market: sample.market as Market,
        currency: sample.currency,
        position,
        quote,
      });
      if (raw) rawHoldings.push(raw);
    }

    const cashBalances = getGuestCashBalances();
    const hasUsdHoldings = rawHoldings.some((h) => h.currency === 'USD');
    let usdKrwRate = hasUsdHoldings ? await this.fetchUsdKrwRate() : null;
    if (usdKrwRate === null && cashBalances.usd > 0) {
      usdKrwRate = await this.fetchUsdKrwRate();
    }

    const built = buildDashboardFromRawHoldings({
      rawHoldings,
      cashBalances,
      usdKrwRate,
      hasAllQuotes: quoteState.hasAllQuotes,
      lastRefreshedAt: quoteState.lastRefreshedAt,
      zeroWhenEmpty: true,
    });

    return {
      summary: normalizeDashboardSummary(built.summary),
      holdings: built.holdings,
      lastRefreshedAt:
        built.lastRefreshedAt instanceof Date
          ? built.lastRefreshedAt.toISOString()
          : built.lastRefreshedAt,
    };
  }

  async getHolding(symbol: string, market: Market): Promise<PortfolioHolding | null> {
    const txs = listGuestTransactions();
    const stockTxs = txs.filter((tx) => tx.stock?.symbol === symbol && tx.stock?.market === market);
    if (stockTxs.length === 0) return null;

    const sample = stockTxs[0].stock!;
    const stockId = stockTxs[0].stockId;
    const quote = getGuestQuotes()[stockId];

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

    const raw = buildRawDashboardHolding({
      stockId,
      symbol: sample.symbol,
      name: sample.name,
      market: sample.market as Market,
      currency: sample.currency,
      position,
      quote,
    });
    if (!raw) return null;

    const usdKrwRate = sample.currency === 'USD' ? await this.fetchUsdKrwRate() : null;
    return buildHoldingWithKrw(raw, usdKrwRate);
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

    const data = await this.marketRepo.fetchBatchQuotes([...stocks.values()]);

    saveGuestQuotes(data.quotes);
    return { updated: data.updated, succeeded: data.succeeded, failed: data.failed };
  }

  async getAnalysis(): Promise<import('../../domain/models').PortfolioAnalysisResult> {
    throw new Error('Guest mode does not support portfolio analysis');
  }
}
