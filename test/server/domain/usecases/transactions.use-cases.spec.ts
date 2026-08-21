import { vi, type Mock } from 'vitest';
import { ValidationError, EntityNotFoundError } from '@server/domain/errors/domain.errors';
import { AppErrorCode, Market, TransactionType, CashLedgerType } from '@sar/shared';
import { CreateTransactionUseCase } from '@server/domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from '@server/domain/usecases/transactions/delete-transaction.use-case';
import { UpdateTransactionUseCase } from '@server/domain/usecases/transactions/update-transaction.use-case';
import { ListTransactionsUseCase } from '@server/domain/usecases/transactions/list-transactions.use-case';
import {
  createMockCashRepo,
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
      createMockCashRepo(),
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
      createMockCashRepo(),
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
      createMockCashRepo(),
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

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo, createMockCashRepo());
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

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo, createMockCashRepo());
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

  it('rejects BUY when cash is insufficient', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(stock);

    const txRepo = createMockTransactionRepo();
    const cashRepo = createMockCashRepo({
      findByUser: vi.fn().mockResolvedValue([]),
    });

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo, cashRepo);
    await expect(
      useCase.execute({
        userId: 'user-1',
        stockSymbol: 'AAPL',
        market: Market.US,
        name: 'Apple Inc.',
        type: TransactionType.BUY,
        quantity: 10,
        price: 100,
        tradedAt: new Date(),
      }),
    ).rejects.toMatchObject({
      code: AppErrorCode.CASH_INSUFFICIENT,
    });
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

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo, createMockCashRepo());
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

  it('credits net KR sell proceeds after securities transaction tax', async () => {
    const stock = createMockStock({ market: Market.KR, currency: 'KRW', symbol: '005930' });
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(stock);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, type: TransactionType.BUY, price: 70_000 }),
    ]);
    txRepo.create.mockResolvedValue(createMockTransaction({ id: 'tx-sell-1' }));

    const cashCreate = vi.fn().mockResolvedValue({});
    const cashRepo = createMockCashRepo({ create: cashCreate });

    const useCase = new CreateTransactionUseCase(stockRepo, txRepo, cashRepo);
    await useCase.execute({
      userId: 'user-1',
      stockSymbol: '005930',
      market: Market.KR,
      name: '삼성전자',
      type: TransactionType.SELL,
      quantity: 10,
      price: 100_000,
      tradedAt: new Date(),
    });

    expect(cashCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CashLedgerType.SELL_SETTLE,
        amount: 998_000,
        memo: '005930 SELL|STT:2000',
      }),
    );
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

    const useCase = new DeleteTransactionUseCase(txRepo, createMockCashRepo());
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

    const useCase = new DeleteTransactionUseCase(txRepo, createMockCashRepo());

    await expect(useCase.execute('user-1', 'tx-1')).rejects.toThrow(EntityNotFoundError);
  });

  it('throws NotFound when transaction does not exist', async () => {
    const txRepo = createMockTransactionRepo();
    txRepo.findById.mockResolvedValue(null);

    const useCase = new DeleteTransactionUseCase(txRepo, createMockCashRepo());

    await expect(useCase.execute('user-1', 'missing')).rejects.toThrow(EntityNotFoundError);
  });
});

describe('UpdateTransactionUseCase', () => {
  it('updates quantity and re-settles cash', async () => {
    const stock = createMockStock({ market: Market.KR, currency: 'KRW', symbol: '005930' });
    const txRepo = createMockTransactionRepo();
    const cashRepo = createMockCashRepo();
    const existing = {
      ...createMockTransaction({ type: TransactionType.BUY, quantity: 10, price: 100 }),
      stock,
    };

    txRepo.findById
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce({ ...existing, quantity: 5, price: 100 });
    txRepo.update.mockResolvedValue({ ...existing, quantity: 5, price: 100 });
    cashRepo.findByUser.mockResolvedValue([
      {
        id: 'cash-krw',
        userId: 'user-1',
        currency: 'KRW',
        type: 'DEPOSIT',
        amount: 5000,
        occurredAt: new Date(),
        memo: null,
        refId: null,
      },
      {
        id: 'buy-settle',
        userId: 'user-1',
        currency: 'KRW',
        type: 'BUY_SETTLE',
        amount: 1000,
        occurredAt: new Date(),
        memo: null,
        refId: 'tx-1',
      },
    ]);

    const useCase = new UpdateTransactionUseCase(txRepo, cashRepo);
    const result = await useCase.execute('user-1', 'tx-1', {
      quantity: 5,
      price: 100,
      tradedAt: new Date(),
      memo: null,
    });

    expect(txRepo.update).toHaveBeenCalled();
    expect(cashRepo.deleteByRefId).toHaveBeenCalledWith('user-1', 'tx-1');
    expect(result.quantity).toBe(5);
  });

  it('throws NotFound for other user transaction', async () => {
    const txRepo = createMockTransactionRepo();
    txRepo.findById.mockResolvedValue({
      ...createMockTransaction({ userId: 'other-user' }),
      stock: createMockStock(),
    });

    const useCase = new UpdateTransactionUseCase(txRepo, createMockCashRepo());

    await expect(
      useCase.execute('user-1', 'tx-1', {
        quantity: 1,
        price: 100,
        tradedAt: new Date(),
      }),
    ).rejects.toThrow(EntityNotFoundError);
  });
});
