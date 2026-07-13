import { Market, resolveCurrency, resolveYahooSymbol, CashLedgerType } from '@sar/shared';
import { CorporateActionEntity } from '../../entities';
import { ICorporateActionRepository, ICashLedgerRepository, IStockRepository } from '../../repositories';
import { SettleCashUseCase } from '../cash/cash.use-cases';

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

/** 기업행위(배당·분할·합병 등) 등록 use case */
export class CreateCorporateActionUseCase {
  private readonly settleCash: SettleCashUseCase;

  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly corpActionRepo: ICorporateActionRepository,
    cashRepo: ICashLedgerRepository,
  ) {
    this.settleCash = new SettleCashUseCase(cashRepo);
  }

  /** 종목·대상종목 resolve 후 기업행위 레코드 생성 */
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

    const action = await this.corpActionRepo.create({
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

    if (input.type === 'DIVIDEND' && input.cashAmount && input.cashAmount > 0) {
      const currency = stock.currency === 'USD' ? 'USD' : 'KRW';
      await this.settleCash.execute({
        userId: input.userId,
        currency,
        type: CashLedgerType.DIVIDEND,
        amount: input.cashAmount,
        occurredAt: input.effectiveAt,
        refId: action.id,
        memo: `${stock.symbol} 배당`,
      });
    }

    return action;
  }
}

/** 사용자 기업행위 목록 조회 use case */
export class ListCorporateActionsUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  /** userId 기준 기업행위 목록 반환 */
  execute(userId: string) {
    return this.corpActionRepo.findByUser(userId);
  }
}

/** 기업행위 삭제 use case */
export class DeleteCorporateActionUseCase {
  constructor(private readonly corpActionRepo: ICorporateActionRepository) {}

  /** id·userId 일치 기업행위 삭제 */
  execute(id: string, userId: string) {
    return this.corpActionRepo.delete(id, userId);
  }
}
