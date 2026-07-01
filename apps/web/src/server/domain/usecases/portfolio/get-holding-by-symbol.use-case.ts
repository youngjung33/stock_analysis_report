import { Market, applyCorporateActions, enrichHoldingKrw } from '@sar/shared';
import { HoldingResult } from '../../entities';
import {
  ICorporateActionRepository,
  IStockQuoteRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { IMarketDataProvider } from '../../ports/market-data.port';

/** symbol+market 기준 단일 보유 조회 use case */
export class GetHoldingBySymbolUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly quoteRepo: IStockQuoteRepository,
    private readonly corpActionRepo: ICorporateActionRepository,
    private readonly marketData: IMarketDataProvider,
  ) {}

  /** symbol·market 기준 단일 보유 HoldingResult — 없으면 null */
  async execute(userId: string, symbol: string, market: Market): Promise<HoldingResult | null> {
    const stock = await this.stockRepo.findBySymbolAndMarket(symbol, market);
    if (!stock) return null;

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

    const usdKrwRate =
      stock.currency === 'USD' ? await this.marketData.fetchUsdKrwRate() : null;
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
