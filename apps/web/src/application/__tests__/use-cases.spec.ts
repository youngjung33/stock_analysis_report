import { describe, expect, it } from 'vitest';
import { AppError } from '../../domain/errors/app-error';
import { LoginUseCase } from '../auth/auth.use-cases';
import { CreateTransactionUseCase } from '../portfolio/portfolio.use-cases';
import {
  createFakeAuthRepository,
  createFakeTransactionRepository,
  sampleTransactionInput,
} from '../../infrastructure/testing/fake-repositories';

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
});
