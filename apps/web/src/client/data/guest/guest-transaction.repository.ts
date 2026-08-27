import {
  AppErrorCode,
  CashLedgerType,
  TransactionType,
  computePosition,
  computeTradeCashSettlement,
  formatTradeLedgerMemo,
  toPositionTransaction,
} from '@sar/shared';
import { AppError } from '../../domain/errors/app-error';
import { CreateTransactionInput, Transaction, UpdateTransactionInput } from '../../domain/models';
import { ITransactionRepository } from '../../domain/repositories';
import {
  createGuestStock,
  deleteGuestCashByRef,
  deleteGuestTransaction,
  getGuestCashBalances,
  guestTransactionsForStock,
  listGuestTransactions,
  saveGuestCashEntry,
  saveGuestTransaction,
  updateGuestTransaction,
} from '../guest/guest-storage';

function tradeMemoOptions(
  settlement: ReturnType<typeof computeTradeCashSettlement>,
): { securitiesTaxKrw?: number; commission?: number } {
  return {
    securitiesTaxKrw:
      settlement.securitiesTaxKrw > 0 ? settlement.securitiesTaxKrw : undefined,
    commission: settlement.commission > 0 ? settlement.commission : undefined,
  };
}

export class GuestTransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    if (!input.name?.trim()) {
      throw new AppError('', AppErrorCode.STOCK_REQUIRED);
    }

    const stock = createGuestStock(input.stockSymbol, input.market, input.name);
    const commission = input.commission ?? 0;
    if (commission < 0) {
      throw new AppError('', AppErrorCode.TRANSACTION_COMMISSION_INVALID);
    }

    const settlement = computeTradeCashSettlement({
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      market: stock.market,
      commission,
    });
    const currency = settlement.currency;

    if (input.type === TransactionType.SELL) {
      const existing = guestTransactionsForStock(stock.id);
      const held = computePosition(existing.map(toPositionTransaction)).quantity;
      if (input.quantity > held) {
        throw new AppError('', AppErrorCode.HOLDING_INSUFFICIENT);
      }
    }

    if (input.type === TransactionType.BUY) {
      const balances = getGuestCashBalances();
      const available = currency === 'KRW' ? balances.krw : balances.usd;
      if (available < settlement.settleAmount) {
        throw new AppError('', AppErrorCode.CASH_INSUFFICIENT);
      }
    }

    const tx: Transaction = {
      id: crypto.randomUUID(),
      userId: 'guest',
      stockId: stock.id,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      commission,
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
      stock,
    };

    saveGuestTransaction(tx);

    saveGuestCashEntry({
      currency,
      type:
        input.type === TransactionType.BUY ? CashLedgerType.BUY_SETTLE : CashLedgerType.SELL_SETTLE,
      amount: settlement.settleAmount,
      refId: tx.id,
      memo: formatTradeLedgerMemo(
        stock.symbol,
        input.type === TransactionType.BUY ? 'BUY' : 'SELL',
        tradeMemoOptions(settlement),
      ),
      occurredAt: input.tradedAt,
    });

    return tx;
  }

  async list(filters?: { stockId?: string; type?: string }): Promise<Transaction[]> {
    let txs = listGuestTransactions();
    if (filters?.stockId) {
      txs = txs.filter((tx) => tx.stockId === filters.stockId);
    }
    if (filters?.type) {
      txs = txs.filter((tx) => tx.type === filters.type);
    }
    return txs;
  }

  async delete(id: string): Promise<void> {
    deleteGuestCashByRef(id);
    deleteGuestTransaction(id);
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const existing = listGuestTransactions().find((tx) => tx.id === id);
    if (!existing?.stock) {
      throw new AppError('', AppErrorCode.NOT_FOUND);
    }

    const stock = existing.stock;
    const commission = input.commission ?? existing.commission ?? 0;
    if (commission < 0) {
      throw new AppError('', AppErrorCode.TRANSACTION_COMMISSION_INVALID);
    }

    const oldSettlement = computeTradeCashSettlement({
      type: existing.type,
      quantity: existing.quantity,
      price: existing.price,
      market: stock.market,
      commission: existing.commission ?? 0,
    });
    const newSettlement = computeTradeCashSettlement({
      type: existing.type,
      quantity: input.quantity,
      price: input.price,
      market: stock.market,
      commission,
    });
    const currency = newSettlement.currency;

    if (existing.type === TransactionType.SELL) {
      const siblings = guestTransactionsForStock(stock.id).filter((tx) => tx.id !== id);
      const held = computePosition(siblings.map(toPositionTransaction)).quantity;
      if (input.quantity > held) {
        throw new AppError('', AppErrorCode.HOLDING_INSUFFICIENT);
      }
    }

    if (existing.type === TransactionType.BUY) {
      const balances = getGuestCashBalances();
      const available = currency === 'KRW' ? balances.krw : balances.usd;
      if (available + oldSettlement.settleAmount < newSettlement.settleAmount) {
        throw new AppError('', AppErrorCode.CASH_INSUFFICIENT);
      }
    }

    deleteGuestCashByRef(id);

    const updated = updateGuestTransaction(id, {
      quantity: input.quantity,
      price: input.price,
      commission,
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
    });
    if (!updated) {
      throw new AppError('', AppErrorCode.NOT_FOUND);
    }

    saveGuestCashEntry({
      currency,
      type:
        existing.type === TransactionType.BUY ? CashLedgerType.BUY_SETTLE : CashLedgerType.SELL_SETTLE,
      amount: newSettlement.settleAmount,
      refId: id,
      memo: formatTradeLedgerMemo(
        stock.symbol,
        existing.type === TransactionType.BUY ? 'BUY' : 'SELL',
        tradeMemoOptions(newSettlement),
      ),
      occurredAt: input.tradedAt,
    });

    return updated;
  }
}
