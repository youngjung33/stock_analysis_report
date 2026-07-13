import { AppErrorCode, CashLedgerType, TransactionType, computeCashBalances } from '@sar/shared';
import { TransactionEntity } from '../../entities';
import {
  CreateTransactionInput,
  ICashLedgerRepository,
  IStockRepository,
  ITransactionRepository,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';
import { resolveCurrency, resolveYahooSymbol } from '../../services/stock-symbol.resolver';
import { ValidationError } from '../../errors/domain.errors';
import { SettleCashUseCase } from '../cash/cash.use-cases';

/** 매수/매도 거래 등록 use case */
export class CreateTransactionUseCase {
  private readonly settleCash: SettleCashUseCase;

  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly cashRepo: ICashLedgerRepository,
  ) {
    this.settleCash = new SettleCashUseCase(cashRepo);
  }

  /** 종목·수량·단가 검증 후 거래 생성 — 매도 시 보유량·매수 시 현금 확인 */
  async execute(input: CreateTransactionInput): Promise<TransactionEntity> {
    if (input.quantity <= 0 || input.price <= 0) {
      throw new ValidationError('Quantity and price must be positive');
    }

    if (!input.name?.trim()) {
      throw new ValidationError('종목을 검색해서 선택해 주세요.');
    }

    const symbol = input.stockSymbol.toUpperCase();

    let stock = await this.stockRepo.findBySymbolAndMarket(symbol, input.market);

    if (!stock) {
      stock = await this.stockRepo.create({
        symbol,
        name: input.name.trim(),
        market: input.market,
        currency: resolveCurrency(input.market),
        yahooSymbol:
          input.yahooSymbol ?? resolveYahooSymbol(input.stockSymbol, input.market),
      });
    }

    if (input.type === TransactionType.SELL) {
      const existing = await this.transactionRepo.findByUserAndStock(input.userId, stock.id);
      const held = computePosition(existing).quantity;
      if (input.quantity > held) {
        throw new ValidationError(`Insufficient holdings. Current: ${held}`);
      }
    }

    const notional = input.quantity * input.price;
    const currency = stock.currency === 'USD' ? 'USD' : 'KRW';

    if (input.type === TransactionType.BUY) {
      const entries = await this.cashRepo.findByUser(input.userId);
      const balances = computeCashBalances(entries);
      const available = currency === 'KRW' ? balances.krw : balances.usd;
      if (available < notional) {
        throw new ValidationError(
          AppErrorCode.CASH_INSUFFICIENT,
          `가용 ${currency} ${available.toLocaleString()} — 필요 ${notional.toLocaleString()}`,
        );
      }
    }

    const tx = await this.transactionRepo.create({
      userId: input.userId,
      stockId: stock.id,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
    });

    await this.settleCash.execute({
      userId: input.userId,
      currency,
      type:
        input.type === TransactionType.BUY ? CashLedgerType.BUY_SETTLE : CashLedgerType.SELL_SETTLE,
      amount: notional,
      occurredAt: input.tradedAt,
      refId: tx.id,
      memo: `${symbol} ${input.type === TransactionType.BUY ? '매수' : '매도'}`,
    });

    return tx;
  }
}
