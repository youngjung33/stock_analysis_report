import {
  AppErrorCode,
  CashLedgerType,
  TransactionType,
  computeCashBalances,
  computeKrSellNetProceeds,
  formatTradeLedgerMemo,
} from '@sar/shared';
import { TransactionEntity } from '../../entities';
import {
  ICashLedgerRepository,
  ITransactionRepository,
  UpdateTransactionInput,
} from '../../repositories';
import { computePosition } from '../../services/position-calculator';
import { ValidationError, EntityNotFoundError } from '../../errors/domain.errors';
import { SettleCashUseCase } from '../cash/cash.use-cases';

/** 거래 수정 — quantity/price/tradedAt/memo; 현금 원장 재결제 */
export class UpdateTransactionUseCase {
  private readonly settleCash: SettleCashUseCase;

  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly cashRepo: ICashLedgerRepository,
  ) {
    this.settleCash = new SettleCashUseCase(cashRepo);
  }

  async execute(
    userId: string,
    txId: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionEntity & { stock: import('../../entities').StockEntity }> {
    if (input.quantity <= 0) {
      throw new ValidationError(AppErrorCode.TRANSACTION_QUANTITY_INVALID);
    }
    if (input.price <= 0) {
      throw new ValidationError(AppErrorCode.TRANSACTION_PRICE_INVALID);
    }

    const existing = await this.transactionRepo.findById(txId);
    if (!existing || existing.userId !== userId) {
      throw new EntityNotFoundError('Transaction not found');
    }

    const { stock } = existing;
    const currency = stock.currency === 'USD' ? 'USD' : 'KRW';
    const oldNotional = existing.quantity * existing.price;
    const newNotional = input.quantity * input.price;

    if (existing.type === TransactionType.SELL) {
      const siblings = await this.transactionRepo.findByUserAndStock(userId, stock.id);
      const held = computePosition(
        siblings.filter((tx) => tx.id !== txId),
      ).quantity;
      if (input.quantity > held) {
        throw new ValidationError(AppErrorCode.HOLDING_INSUFFICIENT);
      }
    }

    if (existing.type === TransactionType.BUY) {
      const entries = await this.cashRepo.findByUser(userId);
      const balances = computeCashBalances(entries);
      const available = currency === 'KRW' ? balances.krw : balances.usd;
      const effectiveAvailable = available + oldNotional;
      if (effectiveAvailable < newNotional) {
        throw new ValidationError(AppErrorCode.CASH_INSUFFICIENT);
      }
    }

    await this.cashRepo.deleteByRefId(userId, txId);

    const updated = await this.transactionRepo.update(txId, {
      quantity: input.quantity,
      price: input.price,
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
    });

    const sellSettlement =
      existing.type === TransactionType.SELL
        ? computeKrSellNetProceeds(newNotional, stock.market)
        : null;
    const settleAmount =
      existing.type === TransactionType.SELL && sellSettlement
        ? sellSettlement.netKrw
        : newNotional;

    await this.settleCash.execute({
      userId,
      currency,
      type:
        existing.type === TransactionType.BUY
          ? CashLedgerType.BUY_SETTLE
          : CashLedgerType.SELL_SETTLE,
      amount: settleAmount,
      occurredAt: input.tradedAt,
      refId: txId,
      memo: formatTradeLedgerMemo(
        stock.symbol,
        existing.type === TransactionType.BUY ? 'BUY' : 'SELL',
        sellSettlement && sellSettlement.securitiesTaxKrw > 0
          ? { securitiesTaxKrw: sellSettlement.securitiesTaxKrw }
          : undefined,
      ),
    });

    const withStock = await this.transactionRepo.findById(txId);
    if (!withStock) {
      throw new EntityNotFoundError('Transaction not found');
    }
    return withStock;
  }
}
