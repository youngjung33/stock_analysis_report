import {
  AppErrorCode,
  CashLedgerType,
  TransactionType,
  computeKrSellNetProceeds,
  computePosition,
  formatTradeLedgerMemo,
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

    const sellSettlement =
      input.type === TransactionType.SELL
        ? computeKrSellNetProceeds(notional, stock.market)
        : null;
    const settleAmount =
      input.type === TransactionType.SELL && sellSettlement ? sellSettlement.netKrw : notional;

    saveGuestCashEntry({
      currency,
      type:
        input.type === TransactionType.BUY ? CashLedgerType.BUY_SETTLE : CashLedgerType.SELL_SETTLE,
      amount: settleAmount,
      refId: tx.id,
      memo: formatTradeLedgerMemo(
        stock.symbol,
        input.type === TransactionType.BUY ? 'BUY' : 'SELL',
        sellSettlement && sellSettlement.securitiesTaxKrw > 0
          ? { securitiesTaxKrw: sellSettlement.securitiesTaxKrw }
          : undefined,
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
    const oldNotional = existing.quantity * existing.price;
    const newNotional = input.quantity * input.price;
    const currency = stock.currency === 'USD' ? 'USD' : 'KRW';

    if (existing.type === TransactionType.SELL) {
      const siblings = guestTransactionsForStock(stock.id).filter((tx) => tx.id !== id);
      const held = computePosition(
        siblings.map((tx) => ({
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

    if (existing.type === TransactionType.BUY) {
      const balances = getGuestCashBalances();
      const available = currency === 'KRW' ? balances.krw : balances.usd;
      if (available + oldNotional < newNotional) {
        throw new AppError('', AppErrorCode.CASH_INSUFFICIENT);
      }
    }

    deleteGuestCashByRef(id);

    const updated = updateGuestTransaction(id, {
      quantity: input.quantity,
      price: input.price,
      tradedAt: input.tradedAt,
      memo: input.memo ?? null,
    });
    if (!updated) {
      throw new AppError('', AppErrorCode.NOT_FOUND);
    }

    const sellSettlement =
      existing.type === TransactionType.SELL
        ? computeKrSellNetProceeds(newNotional, stock.market)
        : null;
    const settleAmount =
      existing.type === TransactionType.SELL && sellSettlement ? sellSettlement.netKrw : newNotional;

    saveGuestCashEntry({
      currency,
      type:
        existing.type === TransactionType.BUY ? CashLedgerType.BUY_SETTLE : CashLedgerType.SELL_SETTLE,
      amount: settleAmount,
      refId: id,
      memo: formatTradeLedgerMemo(
        stock.symbol,
        existing.type === TransactionType.BUY ? 'BUY' : 'SELL',
        sellSettlement && sellSettlement.securitiesTaxKrw > 0
          ? { securitiesTaxKrw: sellSettlement.securitiesTaxKrw }
          : undefined,
      ),
      occurredAt: input.tradedAt,
    });

    return updated;
  }
}
