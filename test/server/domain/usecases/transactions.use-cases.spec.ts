import { vi, type Mock } from 'vitest';
import { ValidationError, EntityNotFoundError } from '@server/domain/errors/domain.errors';
import { Market, TransactionType } from '@sar/shared';
import { CreateTransactionUseCase } from '@server/domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from '@server/domain/usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from '@server/domain/usecases/transactions/list-transactions.use-case';
import {
  createMockStock,
  createMockStockRepo,
  createMockTransaction,
  createMockTransactionRepo,
} from '../../mocks/repositories.mock';

describe('CreateTransactionUseCase', () => {
  // CT-03
  it('rejects non-positive quantity', async () => {
    const useCase = new CreateTransactionUseCase(
      createMockStockRepo(),
      createMockTransactionRepo(),
    );
    await expect(
      useCase.execute({
        userId: 'user-1',
        stockSymbol: 'AAPL',
        market: Market.US,
        type: TransactionType.BUY,
        quantity: 0,
        price: 100,
        tradedAt: new Date(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  // CT-04
  it('rejects non-positive price', async () => {
    const useCase = new CreateTransactionUseCase(
      createMockStockRepo(),
      createMockTransactionRepo(),
    );
    await expect(
      useCase.execute({
        userId: 'user-1',
        stockSymbol: 'AAPL',
        market: Market.US,
        type: TransactionType.BUY,
        quantity: 10,
        price: 0,
        tradedAt: new Date(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects missing stock name for new stock', async () => {
    const useCase = new CreateTransactionUseCase(
      createMockStockRepo(),
      createMockTransactionRepo(),
    );
    await expect(
      useCase.execute({
        userId: 'user-1',
        stockSymbol: 'AAPL',
        market: Market.US,
        name: '',
        type: TransactionType.BUY,
        quantity: 10,
        price: 100,
        tradedAt: new Date(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  // CT-01
  it('creates stock and transaction for new BUY', async () => {
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(null);
    stockRepo.create.mockResolvedValue(createMockStock());

    const txRepo = createMockTransactionRepo();
    txRepo.create.mockResolvedValue(createMockTransaction());

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo);
    await useCase.execute({
      userId: 'user-1',
      stockSymbol: 'AAPL',
      market: Market.US,
      name: 'Apple Inc.',
      type: TransactionType.BUY,
      quantity: 10,
      price: 100,
      tradedAt: new Date(),
    });

    expect(stockRepo.create).toHaveBeenCalled();
    expect(txRepo.create).toHaveBeenCalled();
  });

  // CT-05
  it('does not create stock when symbol already exists', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(stock);

    const txRepo = createMockTransactionRepo();
    txRepo.create.mockResolvedValue(createMockTransaction());

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo);
    await useCase.execute({
      userId: 'user-1',
      stockSymbol: 'AAPL',
      market: Market.US,
      name: 'Apple Inc.',
      type: TransactionType.BUY,
      quantity: 5,
      price: 100,
      tradedAt: new Date(),
    });

    expect(stockRepo.create).not.toHaveBeenCalled();
    expect(txRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockId: stock.id }),
    );
  });

  // CT-02
  it('rejects SELL exceeding holdings', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(stock);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 5, type: TransactionType.BUY }),
    ]);

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo);
    await expect(
      useCase.execute({
        userId: 'user-1',
        stockSymbol: 'AAPL',
        market: Market.US,
        name: 'Apple Inc.',
        type: TransactionType.SELL,
        quantity: 10,
        price: 100,
        tradedAt: new Date(),
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('ListTransactionsUseCase', () => {
  // LT-01
  it('passes filters to repository', async () => {
    const txRepo = createMockTransactionRepo();
    txRepo.findByUser.mockResolvedValue([]);

    const useCase = new ListTransactionsUseCase(txRepo);
    await useCase.execute('user-1', { stockId: 'stock-1', type: TransactionType.BUY });

    expect(txRepo.findByUser).toHaveBeenCalledWith('user-1', {
      stockId: 'stock-1',
      type: TransactionType.BUY,
    });
  });
});

describe('DeleteTransactionUseCase', () => {
  // DT-01
  it('deletes own transaction', async () => {
    const txRepo = createMockTransactionRepo();
    txRepo.findById.mockResolvedValue({
      ...createMockTransaction(),
      stock: createMockStock(),
    });

    const useCase = new DeleteTransactionUseCase(txRepo);
    await useCase.execute('user-1', 'tx-1');

    expect(txRepo.delete).toHaveBeenCalledWith('tx-1');
  });

  // DT-02
  it('throws NotFound for other user transaction', async () => {
    const txRepo = createMockTransactionRepo();
    txRepo.findById.mockResolvedValue({
      ...createMockTransaction({ userId: 'other-user' }),
      stock: createMockStock(),
    });

    const useCase = new DeleteTransactionUseCase(txRepo);

    await expect(useCase.execute('user-1', 'tx-1')).rejects.toThrow(EntityNotFoundError);
  });

  it('throws NotFound when transaction does not exist', async () => {
    const txRepo = createMockTransactionRepo();
    txRepo.findById.mockResolvedValue(null);

    const useCase = new DeleteTransactionUseCase(txRepo);

    await expect(useCase.execute('user-1', 'missing')).rejects.toThrow(EntityNotFoundError);
  });
});
