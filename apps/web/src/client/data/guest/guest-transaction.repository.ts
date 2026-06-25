import { TransactionType, computePosition } from '@sar/shared';
import { AppError } from '../../domain/errors/app-error';
import { CreateTransactionInput, Transaction } from '../../domain/models';
import { ITransactionRepository } from '../../domain/repositories';
import {
  createGuestStock,
  deleteGuestTransaction,
  guestTransactionsForStock,
  listGuestTransactions,
  saveGuestTransaction,
} from '../guest/guest-storage';

export class GuestTransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    if (!input.name?.trim()) {
      throw new AppError('종목을 검색해서 선택해 주세요.');
    }

    const stock = createGuestStock(input.stockSymbol, input.market, input.name);

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
        throw new AppError(`보유 수량이 부족합니다. 현재: ${held}`);
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
    deleteGuestTransaction(id);
  }
}
