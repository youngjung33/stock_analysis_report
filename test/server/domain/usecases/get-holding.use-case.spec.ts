import { Market, TransactionType } from '@sar/shared';
import { GetHoldingBySymbolUseCase } from '@server/domain/usecases/portfolio/get-holding-by-symbol.use-case';
import {
  createMockCorpActionRepo,
  createMockMarketData,
  createMockQuoteRepo,
  createMockStock,
  createMockStockRepo,
  createMockTransaction,
  createMockTransactionRepo,
} from '../../mocks/repositories.mock';

describe('GetHoldingBySymbolUseCase', () => {
  it('returns holding for symbol with open position', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(stock);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, price: 100 }),
    ]);

    const quoteRepo = createMockQuoteRepo();
    quoteRepo.findByStockIds.mockResolvedValue([
      { stockId: stock.id, currentPrice: 150, changePercent: 2, fetchedAt: new Date() },
    ]);

    const useCase = new GetHoldingBySymbolUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      createMockCorpActionRepo(),
      createMockMarketData(),
    );
    const result = await useCase.execute('user-1', stock.symbol, Market.US);

    expect(result).not.toBeNull();
    expect(result!.quantity).toBe(10);
    expect(result!.marketValue).toBe(1500);
    expect(result!.marketValueKrw).toBe(1500 * 1300);
  });

  it('returns null when no stock found', async () => {
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(null);

    const useCase = new GetHoldingBySymbolUseCase(
      stockRepo,
      createMockTransactionRepo(),
      createMockQuoteRepo(),
      createMockCorpActionRepo(),
      createMockMarketData(),
    );
    const result = await useCase.execute('user-1', 'UNKNOWN', Market.US);
    expect(result).toBeNull();
  });

  it('returns null when fully sold', async () => {
    const stock = createMockStock();
    const stockRepo = createMockStockRepo();
    stockRepo.findBySymbolAndMarket.mockResolvedValue(stock);

    const txRepo = createMockTransactionRepo();
    txRepo.findByUserAndStock.mockResolvedValue([
      createMockTransaction({ quantity: 10, price: 100, type: TransactionType.BUY }),
      createMockTransaction({ quantity: 10, price: 120, type: TransactionType.SELL }),
    ]);

    const useCase = new GetHoldingBySymbolUseCase(
      stockRepo,
      txRepo,
      createMockQuoteRepo(),
      createMockCorpActionRepo(),
      createMockMarketData(),
    );
    const result = await useCase.execute('user-1', stock.symbol, Market.US);
    expect(result).toBeNull();
  });
});
