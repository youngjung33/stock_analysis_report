import { describe, expect, it } from 'vitest';
import { TransactionType } from '@sar/shared';
import { AppError } from '@web/domain/errors/app-error';
import { CreateTransactionUseCase } from '@web/domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from '@web/domain/usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from '@web/domain/usecases/transactions/list-transactions.use-case';
import {
  createFakeTransactionRepository,
  sampleTransactionInput,
} from '../../mocks/fake-repositories';

describe('CreateTransactionUseCase', () => {
  // WT-01
  it('throws AppError for zero quantity', () => {
    const useCase = new CreateTransactionUseCase(createFakeTransactionRepository());
    expect(() => useCase.execute({ ...sampleTransactionInput, quantity: 0 })).toThrow(AppError);
  });

  // WT-02
  it('delegates to transaction repository', async () => {
    const repo = createFakeTransactionRepository();
    const useCase = new CreateTransactionUseCase(repo);
    await useCase.execute(sampleTransactionInput);
    expect(repo.create).toHaveBeenCalledWith(sampleTransactionInput);
  });

  // WT-03
  it('throws AppError for non-positive price', () => {
    const useCase = new CreateTransactionUseCase(createFakeTransactionRepository());
    expect(() => useCase.execute({ ...sampleTransactionInput, price: 0 })).toThrow(AppError);
    expect(() => useCase.execute({ ...sampleTransactionInput, price: -1 })).toThrow(AppError);
  });

  // WT-04
  it('throws AppError for empty stock symbol', () => {
    const useCase = new CreateTransactionUseCase(createFakeTransactionRepository());
    expect(() => useCase.execute({ ...sampleTransactionInput, stockSymbol: '' })).toThrow(
      AppError,
    );
    expect(() => useCase.execute({ ...sampleTransactionInput, stockSymbol: '   ' })).toThrow(
      AppError,
    );
  });
});

describe('ListTransactionsUseCase', () => {
  // WT-05
  it('passes filters to transaction repository', async () => {
    const repo = createFakeTransactionRepository();
    const useCase = new ListTransactionsUseCase(repo);
    const filters = { stockId: 'stock-1', type: TransactionType.BUY };
    await useCase.execute(filters);
    expect(repo.list).toHaveBeenCalledWith(filters);
  });
});

describe('DeleteTransactionUseCase', () => {
  // WT-06
  it('passes id to transaction repository delete', async () => {
    const repo = createFakeTransactionRepository();
    const useCase = new DeleteTransactionUseCase(repo);
    await useCase.execute('tx-99');
    expect(repo.delete).toHaveBeenCalledWith('tx-99');
  });
});
