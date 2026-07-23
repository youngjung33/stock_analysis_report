import {
  AppErrorCode,
  CashLedgerType,
  computeCashBalances,
  type CashCurrency,
} from '@sar/shared';
import { CashLedgerEntryEntity } from '../../entities';
import { ICashLedgerRepository } from '../../repositories';
import { ValidationError } from '../../errors/domain.errors';

export class RecordCashEntryUseCase {
  constructor(private readonly cashRepo: ICashLedgerRepository) {}

  async execute(input: {
    userId: string;
    currency: CashCurrency;
    type: CashLedgerType;
    amount: number;
    occurredAt?: Date;
    memo?: string;
  }): Promise<CashLedgerEntryEntity> {
    const amount = Math.abs(input.amount);
    if (amount <= 0) throw new ValidationError(AppErrorCode.CASH_AMOUNT_INVALID);

    const signed =
      input.type === CashLedgerType.WITHDRAW || input.type === CashLedgerType.BUY_SETTLE
        ? -amount
        : amount;

    if (input.type === CashLedgerType.WITHDRAW) {
      const entries = await this.cashRepo.findByUser(input.userId);
      const balances = computeCashBalances(entries);
      const available = input.currency === 'KRW' ? balances.krw : balances.usd;
      if (available < amount) {
        throw new ValidationError(AppErrorCode.CASH_INSUFFICIENT);
      }
    }

    return this.cashRepo.create({
      userId: input.userId,
      currency: input.currency,
      type: input.type,
      amount: signed,
      occurredAt: input.occurredAt ?? new Date(),
      memo: input.memo ?? null,
      refId: null,
    });
  }
}

export class ListCashLedgerUseCase {
  constructor(private readonly cashRepo: ICashLedgerRepository) {}

  execute(userId: string) {
    return this.cashRepo.findByUser(userId);
  }
}

export class GetCashSummaryUseCase {
  constructor(private readonly cashRepo: ICashLedgerRepository) {}

  async execute(userId: string) {
    const entries = await this.cashRepo.findByUser(userId);
    return {
      balances: computeCashBalances(entries),
      entries,
    };
  }
}

/** 거래·배당 결제용 — 잔액 검증 포함 */
export class SettleCashUseCase {
  constructor(private readonly cashRepo: ICashLedgerRepository) {}

  async execute(input: {
    userId: string;
    currency: CashCurrency;
    type: CashLedgerType.BUY_SETTLE | CashLedgerType.SELL_SETTLE | CashLedgerType.DIVIDEND;
    amount: number;
    occurredAt: Date;
    refId: string;
    memo?: string;
  }) {
    const amount = Math.abs(input.amount);
    if (amount <= 0) return;

    if (input.type === CashLedgerType.BUY_SETTLE) {
      const entries = await this.cashRepo.findByUser(input.userId);
      const balances = computeCashBalances(entries);
      const available = input.currency === 'KRW' ? balances.krw : balances.usd;
      if (available < amount) {
        throw new ValidationError(AppErrorCode.CASH_INSUFFICIENT);
      }
    }

    const signed =
      input.type === CashLedgerType.BUY_SETTLE ? -amount : amount;

    await this.cashRepo.create({
      userId: input.userId,
      currency: input.currency,
      type: input.type,
      amount: signed,
      occurredAt: input.occurredAt,
      memo: input.memo ?? null,
      refId: input.refId,
    });
  }
}
