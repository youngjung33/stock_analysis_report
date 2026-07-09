import { vi, type Mock } from 'vitest';
import { Market } from '@sar/shared';
import { RefreshQuotesUseCase } from '@server/domain/usecases/market/refresh-quotes.use-case';
import {
  createMockMarketData,
  createMockQuoteRepo,
  createMockStock,
  createMockStockRepo,
  createMockTransaction,
  createMockTransactionRepo,
} from '../../mocks/repositories.mock';

describe('RefreshQuotesUseCase', () => {
  // RQ-01
  it('fetches quote and upserts for held US stock', async () => {
    vi.useFakeTimers();

    const stock = createMockStock({ market: Market.US });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const marketData = createMockMarketData({
      supports: vi.fn((m) => m === Market.US),
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const resultPromise = useCase.execute('user-1');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(marketData.fetchStockQuote).toHaveBeenCalledWith(stock);
    expect(quoteRepo.upsert).toHaveBeenCalled();
    expect(result.updated).toBe(1);
    expect(result.succeeded).toHaveLength(1);
    expect(result.succeeded[0].symbol).toBe(stock.symbol);

    vi.useRealTimers();
  });

  // RQ-02
  it('fetches quote for KR stock', async () => {
    const stock = createMockStock({
      id: 'stock-kr',
      symbol: '005930',
      market: Market.KR,
      currency: 'KRW',
      yahooSymbol: '005930.KS',
    });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ stockId: stock.id, quantity: 10 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const marketData = createMockMarketData({
      supports: vi.fn((m) => m === Market.KR || m === Market.US),
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const result = await useCase.execute('user-1');

    expect(marketData.fetchStockQuote).toHaveBeenCalledWith(stock);
    expect(result.updated).toBe(1);
  });

  // RQ-03
  it('records failed quote when provider throws', async () => {
    const stock = createMockStock({ market: Market.KR, symbol: '005930' });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const marketData = createMockMarketData({
      fetchStockQuote: vi.fn().mockRejectedValue(new Error('API down')),
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const result = await useCase.execute('user-1');

    expect(result.updated).toBe(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].reason).toBe('API down');
    expect(result.failed[0].reasonCode).toBe('fetch_error');
  });

  // RQ-04
  it('records failure when no provider supports market', async () => {
    const stock = createMockStock({ market: Market.KR });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const marketData = createMockMarketData({
      supports: vi.fn(() => false),
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const result = await useCase.execute('user-1');

    expect(result.updated).toBe(0);
    expect(result.failed[0].reasonCode).toBe('no_provider');
  });

  // RQ-05
  it('skips stocks with zero quantity', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([]);

    const quoteRepo = createMockQuoteRepo();
    const marketData = createMockMarketData({});

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const result = await useCase.execute('user-1');

    expect(marketData.fetchStockQuote).not.toHaveBeenCalled();
    expect(result.updated).toBe(0);
  });

  // RQ-06
  it('records failure when provider is not configured (no API key)', async () => {
    const stock = createMockStock({ market: Market.US, symbol: 'AAPL' });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const marketData = createMockMarketData({
      supports: vi.fn((m) => m === Market.US),
      isAvailable: vi.fn((m) => m !== Market.US),
      unavailableReason: vi.fn(() => 'FINNHUB_API_KEY가 설정되지 않았습니다.'),
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const result = await useCase.execute('user-1');

    expect(marketData.fetchStockQuote).not.toHaveBeenCalled();
    expect(result.updated).toBe(0);
    expect(result.failed[0].reason).toBe('FINNHUB_API_KEY가 설정되지 않았습니다.');
    expect(result.failed[0].reasonCode).toBe('not_configured');
  });

  // RQ-07
  it('fetches KR stocks in parallel', async () => {
    const kr1 = createMockStock({ id: 'kr-1', symbol: '005930', market: Market.KR });
    const kr2 = createMockStock({ id: 'kr-2', symbol: '000660', market: Market.KR });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([kr1, kr2]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockImplementation(async (_userId, stockId) => [
      createMockTransaction({ stockId, quantity: 5 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const fetchStockQuote = vi.fn().mockResolvedValue({
      currentPrice: 100,
      changePercent: 1,
    });
    const marketData = createMockMarketData({
      supports: vi.fn((m) => m === Market.KR),
      fetchStockQuote,
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData);
    const result = await useCase.execute('user-1');

    expect(fetchStockQuote).toHaveBeenCalledTimes(2);
    expect(result.updated).toBe(2);
  });
});
