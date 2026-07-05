import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/client/domain/errors/app-error';
import { RegisterUseCase } from '@/client/domain/usecases/auth/register.use-case';
import { AppErrorCode } from '@sar/shared';
import { StartOAuthLoginUseCase } from '@/client/domain/usecases/auth/start-oauth-login.use-case';
import { ListOAuthProvidersUseCase } from '@/client/domain/usecases/auth/list-oauth-providers.use-case';
import { OAuthProvider } from '@sar/shared';
import { createFakeAuthRepository } from '../../mocks/fake-repositories';

describe('RegisterUseCase', () => {
  it('throws AppError for invalid input', () => {
    const useCase = new RegisterUseCase(createFakeAuthRepository());
    expect(() =>
      useCase.execute({ username: 'ab', password: 'password1', passwordConfirm: 'password1' }),
    ).toThrow(AppError);
  });

  it('delegates to auth repository', async () => {
    const authRepo = createFakeAuthRepository();
    const useCase = new RegisterUseCase(authRepo);
    const result = await useCase.execute({
      username: 'valid_user',
      password: 'password1',
      passwordConfirm: 'password1',
    });
    expect(result.isNewUser).toBe(true);
    expect(authRepo.register).toHaveBeenCalled();
  });
});

describe('StartOAuthLoginUseCase', () => {
  it('delegates to auth repository', async () => {
    const authRepo = createFakeAuthRepository();
    const useCase = new StartOAuthLoginUseCase(authRepo);
    const result = await useCase.execute(
      OAuthProvider.GOOGLE,
      'http://localhost/api/auth/oauth/GOOGLE/callback',
    );
    expect(result.authorizationUrl).toContain('oauth.example');
    expect(authRepo.startOAuthLogin).toHaveBeenCalled();
  });
});

describe('ListOAuthProvidersUseCase', () => {
  it('returns configured providers', async () => {
    const authRepo = createFakeAuthRepository();
    const useCase = new ListOAuthProvidersUseCase(authRepo);
    const providers = await useCase.execute();
    expect(providers.length).toBeGreaterThan(0);
  });
});
