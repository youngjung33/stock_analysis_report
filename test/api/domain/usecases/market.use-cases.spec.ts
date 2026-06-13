import { Market } from '@sar/shared';
import { RefreshQuotesUseCase } from '@api/domain/usecases/market/refresh-quotes.use-case';
import {
  createMockQuoteRepo,
  createMockStock,
  createMockStockRepo,
  createMockTransaction,
  createMockTransactionRepo,
} from '../../mocks/repositories.mock';

function createProvider(options: {
  supports?: (market: Market) => boolean;
  fetchQuote?: jest.Mock;
}) {
  return {
    supports: jest.fn((market: Market) => options.supports?.(market) ?? true),
    fetchQuote:
      options.fetchQuote ??
      jest.fn().mockResolvedValue({ currentPrice: 180, changePercent: 1 }),
  };
}

describe('RefreshQuotesUseCase', () => {
  // RQ-01
  it('fetches quote and upserts for held US stock', async () => {
    jest.useFakeTimers();

    const stock = createMockStock({ market: Market.US });
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    const provider = createProvider({ supports: (m) => m === Market.US });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, [provider]);
    const resultPromise = useCase.execute('user-1');
    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(provider.fetchQuote).toHaveBeenCalledWith(stock);
    expect(quoteRepo.upsert).toHaveBeenCalled();
    expect(result.updated).toBe(1);

    jest.useRealTimers();
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
    const krProvider = createProvider({ supports: (m) => m === Market.KR });
    const usProvider = createProvider({ supports: (m) => m === Market.US });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, [
      usProvider,
      krProvider,
    ]);
    const result = await useCase.execute('user-1');

    expect(krProvider.fetchQuote).toHaveBeenCalledWith(stock);
    expect(usProvider.fetchQuote).not.toHaveBeenCalled();
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
    const provider = createProvider({
      supports: () => true,
      fetchQuote: jest.fn().mockRejectedValue(new Error('API down')),
    });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, [provider]);
    const result = await useCase.execute('user-1');

    expect(result.updated).toBe(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].reason).toBe('API down');
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
    const provider = createProvider({ supports: () => false });

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, [provider]);
    const result = await useCase.execute('user-1');

    expect(result.updated).toBe(0);
    expect(result.failed[0].reason).toBe('No provider for market');
  });

  // RQ-05
  it('skips stocks with zero quantity', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findHeldByUser.mockResolvedValue([stock]);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([]);

    const quoteRepo = createMockQuoteRepo();
    const provider = createProvider({});

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, [provider]);
    const result = await useCase.execute('user-1');

    expect(provider.fetchQuote).not.toHaveBeenCalled();
    expect(result.updated).toBe(0);
  });
});
