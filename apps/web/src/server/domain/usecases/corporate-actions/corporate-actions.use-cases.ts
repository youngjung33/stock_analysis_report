import { Market, resolveCurrency, resolveYahooSymbol } from '@sar/shared';
import { CorporateActionEntity } from '../../entities';
import { ICorporateActionRepository, IStockRepository } from '../../repositories';

export interface CreateCorporateActionInput {
  userId: string;
  stockSymbol: string;
  market: Market;
  name: string;
  type: CorporateActionEntity['type'];
  effectiveAt: Date;
  cashAmount?: number;
  splitRatio?: number;
  targetSymbol?: string;
  targetMarket?: Market;
  targetName?: string;
  targetQuantity?: number;
  targetPrice?: number;
  memo?: string;
}

export class CreateCorporateActionUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly corpActionRepo: ICorporateActionRepository,
  ) {}

  async execute(input: CreateCorporateActionInput): Promise<CorporateActionEntity> {
    let stock = await this.stockRepo.findBySymbolAndMarket(input.stockSymbol, input.market);
    if (!stock) {
      stock = await this.stockRepo.create({
        symbol: input.stockSymbol,
        name: input.name,
        market: input.market,
        currency: resolveCurrency(input.market),
        yahooSymbol: resolveYahooSymbol(input.stockSymbol, input.market),
      });
    }

    let targetStockId: string | null = null;
    if (input.type === 'MERGER' && input.targetSymbol && input.targetMarket && input.targetName) {
      let target = await this.stockRepo.findBySymbolAndMarket(input.targetSymbol, input.targetMarket);
      if (!target) {
        target = await this.stockRepo.create({
          symbol: input.targetSymbol,
          name: input.targetName,
          market: input.targetMarket,
          currency: resolveCurrency(input.targetMarket),
          yahooSymbol: resolveYahooSymbol(input.targetSymbol, input.targetMarket),
        });
      }
      targetStockId = target.id;
    }

    return this.corpActionRepo.create({
      userId: input.userId,
      stockId: stock.id,
      type: input.type,
      effectiveAt: input.effectiveAt,
      cashAmount: input.cashAmount ?? null,
      splitRatio: input.splitRatio ?? null,
      targetStockId,
      targetQuantity: input.targetQuantity ?? null,
      targetPrice: input.targetPrice ?? null,
      memo: input.memo ?? null,
    });
  }
}

export class ListCorporateActionsUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  execute(userId: string) {
    return this.corpActionRepo.findByUser(userId);
  }
}

export class DeleteCorporateActionUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  execute(id: string, userId: string) {
    return this.corpActionRepo.delete(id, userId);
  }
}
