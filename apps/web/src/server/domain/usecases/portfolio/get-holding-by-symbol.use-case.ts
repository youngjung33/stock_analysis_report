import { Market, enrichHoldingKrw } from '@sar/shared';
import { HoldingResult } from '../../entities';
import {
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { fetchUsdKrwRate } from '../../../data/market/usd-krw.client';
import { computePosition } from '../../services/position-calculator';

export class GetHoldingBySymbolUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
  ) {}

  async execute(userId: string, symbol: string, market: Market): Promise<HoldingResult | null> {
    const stock = await this.stockRepo.findBySymbolAndMarket(symbol, market);
    if (!stock) return null;

    const txs = await this.transactionRepo.findByUserAndStock(userId, stock.id);
    const position = computePosition(txs);
    if (position.quantity <= 0) return null;

    const quotes = await this.quoteRepo.findByStockIds([stock.id]);
    const quote = quotes[0];
    const currentPrice = quote?.currentPrice ?? null;
    const changePercent = quote?.changePercent ?? null;

    const marketValue = currentPrice !== null ? currentPrice * position.quantity : null;
    const unrealizedPnl =
      currentPrice !== null ? (currentPrice - position.averageCost) * position.quantity : null;
    const unrealizedPnlPercent =
      currentPrice !== null && position.averageCost > 0
        ? ((currentPrice - position.averageCost) / position.averageCost) * 100
        : null;

    const usdKrwRate = stock.currency === 'USD' ? await fetchUsdKrwRate() : null;
    const base = {
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
    };

    return {
      ...base,
      ...enrichHoldingKrw(base, usdKrwRate),
      weightPercent: null,
      usdKrwRate,
    };
  }
}
