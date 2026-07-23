import { AppErrorCode, CashLedgerType, TransactionType, computePosition, formatTradeLedgerMemo } from '@sar/shared';
import { AppError } from '../../domain/errors/app-error';
import { CreateTransactionInput, Transaction } from '../../domain/models';
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
} from '../guest/guest-storage';

export class GuestTransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    if (!input.name?.trim()) {
      throw new AppError('', AppErrorCode.STOCK_REQUIRED);
    }

    const stock = createGuestStock(input.stockSymbol, input.market, input.name);
    const notional = input.quantity * input.price;
    const currency = stock.currency === 'USD' ? 'USD' : 'KRW';

    if (input.type === TransactionType.SELL) {
      const existing = guestTransactionsForStock(stock.id);
      const held = computePosition(
        existing.map((tx) => ({
          type: tx.type,
          quantity: tx.quantity,
          price: tx.price,
          tradedAt: tx.tradedAt,
        })),
      ).quantity;
      if (input.quantity > held) {
        throw new AppError('', AppErrorCode.HOLDING_INSUFFICIENT);
      }
    }

    if (input.type === TransactionType.BUY) {
      const balances = getGuestCashBalances();
      const available = currency === 'KRW' ? balances.krw : balances.usd;
      if (available < notional) {
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
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
      stock,
    };

    saveGuestTransaction(tx);

    saveGuestCashEntry({
      currency,
      type:
        input.type === TransactionType.BUY ? CashLedgerType.BUY_SETTLE : CashLedgerType.SELL_SETTLE,
      amount: notional,
      refId: tx.id,
      memo: formatTradeLedgerMemo(
        stock.symbol,
        input.type === TransactionType.BUY ? 'BUY' : 'SELL',
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
}
