import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Market, TransactionType } from '@sar/shared';
import { LoginUseCase } from '../auth/login.use-case';
import { RefreshTokenUseCase } from '../auth/refresh-token.use-case';
import { CreateTransactionUseCase } from '../transactions/create-transaction.use-case';
import { GetDashboardUseCase } from '../portfolio/get-dashboard.use-case';
import { RefreshQuotesUseCase } from '../market/refresh-quotes.use-case';
import {
  createMockPasswordHasher,
  createMockQuoteRepo,
  createMockRefreshTokenRepo,
  createMockStock,
  createMockStockRepo,
  createMockTokenService,
  createMockTransaction,
  createMockTransactionRepo,
  createMockUser,
  createMockUserRepo,
} from './mocks/repositories.mock';

describe('LoginUseCase', () => {
  // AU-01
  it('throws Unauthorized for invalid password', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());
    const hasher = createMockPasswordHasher(false);

    const useCase = new LoginUseCase(
      userRepo,
      createMockRefreshTokenRepo(),
      hasher,
      createMockTokenService(),
    );

    await expect(
      useCase.execute({ username: 'admin', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe('RefreshTokenUseCase', () => {
  // AU-02
  it('rotates refresh token on valid input', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    refreshRepo.findValidByHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      user: createMockUser(),
    });
    const tokenService = createMockTokenService();

    const useCase = new RefreshTokenUseCase(refreshRepo, tokenService);
    await useCase.execute('old-refresh');

    expect(refreshRepo.revoke).toHaveBeenCalledWith('rt-1');
    expect(refreshRepo.create).toHaveBeenCalled();
    expect(tokenService.generateAccessToken).toHaveBeenCalled();
  });
});

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
    ).rejects.toThrow(BadRequestException);
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
      type: TransactionType.BUY,
      quantity: 10,
      price: 100,
      tradedAt: new Date(),
    });

    expect(stockRepo.create).toHaveBeenCalled();
    expect(txRepo.create).toHaveBeenCalled();
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
        type: TransactionType.SELL,
        quantity: 10,
        price: 100,
        tradedAt: new Date(),
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

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

    const useCase = new GetDashboardUseCase(stockRepo, txRepo, quoteRepo);
    const result = await useCase.execute('user-1');

    expect(result.holdings).toHaveLength(1);
    expect(result.summary.totalMarketValue).toBe(1500);
    expect(result.holdings[0].unrealizedPnl).toBe(500);
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

    const useCase = new GetDashboardUseCase(stockRepo, txRepo, quoteRepo);
    const result = await useCase.execute('user-1');

    expect(result.holdings[0].currentPrice).toBeNull();
    expect(result.summary.totalMarketValue).toBeNull();
  });
});

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
    const provider = {
      supports: jest.fn().mockReturnValue(true),
      fetchQuote: jest.fn().mockResolvedValue({ currentPrice: 180, changePercent: 1 }),
    };

    const useCase = new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, [provider]);
    const resultPromise = useCase.execute('user-1');
    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(provider.fetchQuote).toHaveBeenCalledWith(stock);
    expect(quoteRepo.upsert).toHaveBeenCalled();
    expect(result.updated).toBe(1);

    jest.useRealTimers();
  });
});
