import { describe, expect, it, vi } from 'vitest';
import { TransactionType } from '@sar/shared';
import { AppError } from '@web/domain/errors/app-error';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
} from '@web/domain/usecases/auth/auth.use-cases';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  GetDashboardUseCase,
  ListTransactionsUseCase,
  RefreshQuotesUseCase,
} from '@web/domain/usecases/portfolio/portfolio.use-cases';
import {
  createFakeAuthRepository,
  createFakePortfolioRepository,
  createFakeTransactionRepository,
  sampleTransactionInput,
} from '../../mocks/fake-repositories';

describe('LoginUseCase', () => {
  // WL-01
  it('throws AppError for empty credentials', () => {
    const useCase = new LoginUseCase(createFakeAuthRepository());
    expect(() => useCase.execute('', 'password')).toThrow(AppError);
    expect(() => useCase.execute('admin', '')).toThrow(AppError);
  });

  // WL-02
  it('returns login result from repository', async () => {
    const authRepo = createFakeAuthRepository();
    const useCase = new LoginUseCase(authRepo);
    const result = await useCase.execute('admin', 'password');
    expect(result.accessToken).toBe('token');
    expect(authRepo.login).toHaveBeenCalledWith('admin', 'password');
  });

  // WL-03
  it('throws AppError for whitespace-only credentials', () => {
    const useCase = new LoginUseCase(createFakeAuthRepository());
    expect(() => useCase.execute('   ', 'password')).toThrow(AppError);
    expect(() => useCase.execute('admin', '   ')).toThrow(AppError);
  });
});

describe('RefreshSessionUseCase', () => {
  // WS-01
  it('delegates to auth repository refresh', async () => {
    const authRepo = createFakeAuthRepository({
      refresh: vi.fn().mockResolvedValue({ accessToken: 'new-token', username: 'admin' }),
    });
    const useCase = new RefreshSessionUseCase(authRepo);
    const result = await useCase.execute();
    expect(result.accessToken).toBe('new-token');
    expect(authRepo.refresh).toHaveBeenCalled();
  });
});

describe('LogoutUseCase', () => {
  // WS-02
  it('delegates to auth repository logout', async () => {
    const authRepo = createFakeAuthRepository();
    const useCase = new LogoutUseCase(authRepo);
    await useCase.execute();
    expect(authRepo.logout).toHaveBeenCalled();
  });
});

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

describe('GetDashboardUseCase', () => {
  // WP-01
  it('delegates to portfolio repository getDashboard', async () => {
    const repo = createFakePortfolioRepository();
    const useCase = new GetDashboardUseCase(repo);
    await useCase.execute();
    expect(repo.getDashboard).toHaveBeenCalled();
  });
});

describe('RefreshQuotesUseCase', () => {
  // WP-02
  it('delegates to portfolio repository refreshQuotes', async () => {
    const repo = createFakePortfolioRepository();
    const useCase = new RefreshQuotesUseCase(repo);
    await useCase.execute();
    expect(repo.refreshQuotes).toHaveBeenCalled();
  });
});
