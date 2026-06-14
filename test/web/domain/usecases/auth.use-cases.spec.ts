import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@web/domain/errors/app-error';
import { LoginUseCase } from '@web/domain/usecases/auth/login.use-case';
import { LogoutUseCase } from '@web/domain/usecases/auth/logout.use-case';
import { RefreshSessionUseCase } from '@web/domain/usecases/auth/refresh-session.use-case';
import { createFakeAuthRepository } from '../../mocks/fake-repositories';

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
