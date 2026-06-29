import { vi, type Mock } from 'vitest';
import { AuthenticationError } from '@server/domain/errors/domain.errors';
import { LoginUseCase } from '@server/domain/usecases/auth/login.use-case';
import { LogoutUseCase } from '@server/domain/usecases/auth/logout.use-case';import { RefreshTokenUseCase } from '@server/domain/usecases/auth/refresh-token.use-case';
import {
  createMockPasswordHasher,
  createMockRefreshTokenRepo,
  createMockTokenService,
  createMockUser,
  createMockUserRepo,
} from '../../mocks/repositories.mock';

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
    ).rejects.toThrow(AuthenticationError);
  });

  // AU-03
  it('issues tokens and stores refresh token on success', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());
    const refreshRepo = createMockRefreshTokenRepo();
    const tokenService = createMockTokenService();

    const useCase = new LoginUseCase(
      userRepo,
      refreshRepo,
      createMockPasswordHasher(true),
      tokenService,
    );

    const result = await useCase.execute({ username: 'admin', password: 'secret' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.username).toBe('admin');
    expect(refreshRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', tokenHash: 'token-hash' }),
    );
  });

  // AU-04
  it('throws Unauthorized when user not found', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(null);

    const useCase = new LoginUseCase(
      userRepo,
      createMockRefreshTokenRepo(),
      createMockPasswordHasher(),
      createMockTokenService(),
    );

    await expect(
      useCase.execute({ username: 'unknown', password: 'secret' }),
    ).rejects.toThrow(AuthenticationError);
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

  // AU-05
  it('throws Unauthorized for invalid refresh token', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    refreshRepo.findValidByHash.mockResolvedValue(null);

    const useCase = new RefreshTokenUseCase(refreshRepo, createMockTokenService());

    await expect(useCase.execute('bad-token')).rejects.toThrow(AuthenticationError);
  });

  it('throws Unauthorized for expired refresh token', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    refreshRepo.findValidByHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      user: createMockUser(),
    });

    const useCase = new RefreshTokenUseCase(refreshRepo, createMockTokenService());

    await expect(useCase.execute('expired-token')).rejects.toThrow(AuthenticationError);
  });
});

describe('LogoutUseCase', () => {
  // LO-01
  it('revokes refresh token when valid', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    refreshRepo.findValidByHash.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      user: createMockUser(),
    });

    const useCase = new LogoutUseCase(refreshRepo, createMockTokenService());
    await useCase.execute('refresh-token');

    expect(refreshRepo.revoke).toHaveBeenCalledWith('rt-1');
  });

  // LO-02
  it('no-ops when refresh token is missing', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    const useCase = new LogoutUseCase(refreshRepo, createMockTokenService());

    await useCase.execute(undefined);

    expect(refreshRepo.findValidByHash).not.toHaveBeenCalled();
    expect(refreshRepo.revoke).not.toHaveBeenCalled();
  });
});
