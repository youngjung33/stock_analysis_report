import { vi, type Mock } from 'vitest';
import { Market, TransactionType } from '@sar/shared';
import { GetDashboardUseCase } from '@server/domain/usecases/portfolio/get-dashboard.use-case';
import {
  createMockQuoteRepo,
  createMockCorpActionRepo,
  createMockCashRepo,
  createMockMarketData,
  createMockStock,
  createMockStockRepo,
  createMockTransaction,
  createMockTransactionRepo,
} from '../../mocks/repositories.mock';

describe('GetDashboardUseCase', () => {
  // DA-01
  it('aggregates holdings with quote', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, price: 100 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([
      {
        stockId: stock.id,
        currentPrice: 150,
        changePercent: 5,
        fetchedAt: new Date(),
      },
    ]);

    const corpActionRepo = createMockCorpActionRepo();
    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      createMockCashRepo(),
    );
    const result = await useCase.execute('user-1');

    expect(result.holdings).toHaveLength(1);
    expect(result.summary.totalMarketValue).toBe(1500);
    expect(result.holdings[0].unrealizedPnl).toBe(500);
    expect(result.summary.todayPnl).toBeCloseTo(71.43, 1);
    expect(result.summary.todayPnlPercent).toBeCloseTo(5, 1);
  });

  // DA-02
  it('returns null market value when quote missing', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, price: 100 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([]);

    const corpActionRepo = createMockCorpActionRepo();
    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      createMockCashRepo(),
    );
    const result = await useCase.execute('user-1');

    expect(result.holdings[0].currentPrice).toBeNull();
    expect(result.summary.totalMarketValue).toBeNull();
    expect(result.summary.todayPnl).toBeNull();
  });

  // DA-03
  it('excludes fully sold holdings', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, price: 100, type: TransactionType.BUY }),
      createMockTransaction({ quantity: 10, price: 120, type: TransactionType.SELL }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([]);

    const corpActionRepo = createMockCorpActionRepo();
    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      createMockCashRepo(),
    );
    const result = await useCase.execute('user-1');

    expect(result.holdings).toHaveLength(0);
    expect(result.summary.holdingsCount).toBe(0);
  });

  // DA-04
  it('aggregates multiple stocks', async () => {
    const usStock = createMockStock({ id: 'stock-us', symbol: 'AAPL', market: Market.US });
    const krStock = createMockStock({
      id: 'stock-kr',
      symbol: '005930',
      market: Market.KR,
      currency: 'KRW',
    });

    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([usStock, krStock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockImplementation(async (_userId, stockId) => {
      if (stockId === 'stock-us') {
        return [createMockTransaction({ stockId, quantity: 10, price: 100 })];
      }
      return [createMockTransaction({ stockId, quantity: 5, price: 200 })];
    });

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([
      { stockId: 'stock-us', currentPrice: 150, changePercent: 1, fetchedAt: new Date() },
      { stockId: 'stock-kr', currentPrice: 250, changePercent: 2, fetchedAt: new Date() },
    ]);

    const corpActionRepo = createMockCorpActionRepo();
    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      createMockCashRepo(),
    );
    const result = await useCase.execute('user-1');

    expect(result.holdings).toHaveLength(2);
    expect(result.summary.totalMarketValue).toBe(10 * 150 + 5 * 250);
    expect(result.summary.holdingsCount).toBe(2);
  });

  // DA-06
  it('computes KRW summary for mixed KR and US holdings', async () => {
    const usStock = createMockStock({ id: 'stock-us', symbol: 'AAPL', market: Market.US });
    const krStock = createMockStock({
      id: 'stock-kr',
      symbol: '005930',
      market: Market.KR,
      currency: 'KRW',
    });

    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([usStock, krStock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockImplementation(async (_userId, stockId) => {
      if (stockId === 'stock-us') {
        return [createMockTransaction({ stockId, quantity: 10, price: 100 })];
      }
      return [createMockTransaction({ stockId, quantity: 5, price: 200_000 })];
    });

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([
      { stockId: 'stock-us', currentPrice: 150, changePercent: 1, fetchedAt: new Date() },
      { stockId: 'stock-kr', currentPrice: 250_000, changePercent: 2, fetchedAt: new Date() },
    ]);

    const corpActionRepo = createMockCorpActionRepo();
    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      createMockCashRepo(),
    );
    const result = await useCase.execute('user-1');

    expect(result.summary.hasUsdHoldings).toBe(true);
    expect(result.summary.usdKrwRate).toBe(1300);
    expect(result.summary.totalMarketValueKrw).toBe(10 * 150 * 1300 + 5 * 250_000);
    expect(result.holdings[0].marketValueKrw).toBe(10 * 150 * 1300);
    expect(result.holdings[1].marketValueKrw).toBe(5 * 250_000);
  });

  // DA-05
  it('returns null total market value when any quote is missing', async () => {
    const usStock = createMockStock({ id: 'stock-us' });
    const krStock = createMockStock({ id: 'stock-kr', symbol: '005930', market: Market.KR });

    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([usStock, krStock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, price: 100 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([
      { stockId: 'stock-us', currentPrice: 150, changePercent: 1, fetchedAt: new Date() },
    ]);

    const corpActionRepo = createMockCorpActionRepo();
    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      createMockCashRepo(),
    );
    const result = await useCase.execute('user-1');

    expect(result.holdings).toHaveLength(2);
    expect(result.summary.totalMarketValue).toBeNull();
  });

  it('includes cash-only balance in totalAssetsKrw', async () => {
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([]);

    const txRepo = createMockTransactionRepo();
    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([]);
    const corpActionRepo = createMockCorpActionRepo();
    const cashRepo = createMockCashRepo({
      findByUser: vi.fn().mockResolvedValue([
        {
          id: 'cash-krw',
          userId: 'user-1',
          currency: 'KRW',
          type: 'INITIAL',
          amount: 10_000_000,
          occurredAt: new Date(),
          memo: null,
          refId: null,
          createdAt: new Date(),
        },
      ]),
    });

    const useCase = new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      createMockMarketData(),
      cashRepo,
    );
    const result = await useCase.execute('user-1');

    expect(result.summary.holdingsCount).toBe(0);
    expect(result.summary.cashKrw).toBe(10_000_000);
    expect(result.summary.totalAssetsKrw).toBe(10_000_000);
    expect(result.summary.cashPercent).toBe(100);
  });
});
