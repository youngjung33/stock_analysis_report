import { vi, type Mock } from 'vitest';
import { OAuthProvider } from '@sar/shared';
import { AuthenticationError, ConflictError, ValidationError } from '@server/domain/errors/domain.errors';
import { AuthSessionService } from '@server/domain/services/auth-session.service';
import { LoginUseCase } from '@server/domain/usecases/auth/login.use-case';
import { RegisterUseCase } from '@server/domain/usecases/auth/register.use-case';
import { StartOAuthLoginUseCase } from '@server/domain/usecases/auth/start-oauth-login.use-case';
import { CompleteOAuthLoginUseCase } from '@server/domain/usecases/auth/complete-oauth-login.use-case';
import { LogoutUseCase } from '@server/domain/usecases/auth/logout.use-case';
import { RefreshTokenUseCase } from '@server/domain/usecases/auth/refresh-token.use-case';
import { IOAuthProviderPort } from '@server/domain/ports/oauth-provider.port';
import {
  createMockPasswordHasher,
  createMockRefreshTokenRepo,
  createMockTokenService,
  createMockUser,
  createMockUserRepo,
} from '../../mocks/repositories.mock';
import { IUserOAuthAccountRepository, IOAuthStateRepository } from '@server/domain/repositories';

function createAuthSession() {
  return new AuthSessionService(createMockRefreshTokenRepo(), createMockTokenService());
}

function createMockOAuthAccountRepo(
  overrides: Partial<IUserOAuthAccountRepository> = {},
): IUserOAuthAccountRepository {
  return {
    findByProviderUserId: vi.fn(),
    create: vi.fn(),
    ...overrides,
  };
}

function createMockOAuthStateRepo(
  overrides: Partial<IOAuthStateRepository> = {},
): IOAuthStateRepository {
  return {
    create: vi.fn(),
    consume: vi.fn(),
    ...overrides,
  };
}

function createMockOAuthProvider(overrides: Partial<IOAuthProviderPort> = {}): IOAuthProviderPort {
  return {
    isConfigured: vi.fn().mockReturnValue(true),
    buildAuthorizationUrl: vi.fn().mockReturnValue('https://oauth.example/authorize'),
    exchangeAuthorizationCode: vi.fn().mockResolvedValue({
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'oauth-user-1',
      email: 'user@example.com',
      displayName: 'OAuth User',
    }),
    ...overrides,
  };
}

describe('LoginUseCase', () => {
  it('throws Unauthorized for invalid password', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());
    const hasher = createMockPasswordHasher(false);

    const useCase = new LoginUseCase(userRepo, hasher, createAuthSession());

    await expect(
      useCase.execute({ username: 'admin', password: 'wrong' }),
    ).rejects.toThrow(AuthenticationError);
  });

  it('issues tokens on success', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());
    const refreshRepo = createMockRefreshTokenRepo();
    const tokenService = createMockTokenService();
    const authSession = new AuthSessionService(refreshRepo, tokenService);

    const useCase = new LoginUseCase(userRepo, createMockPasswordHasher(true), authSession);
    const result = await useCase.execute({ username: 'admin', password: 'secret' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.username).toBe('admin');
    expect(refreshRepo.create).toHaveBeenCalled();
  });

  it('throws when user not found', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(null);

    const useCase = new LoginUseCase(
      userRepo,
      createMockPasswordHasher(),
      createAuthSession(),
    );

    await expect(
      useCase.execute({ username: 'unknown', password: 'secret' }),
    ).rejects.toThrow(AuthenticationError);
  });

  it('rejects OAuth-only account for password login', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser({ passwordHash: null }));

    const useCase = new LoginUseCase(
      userRepo,
      createMockPasswordHasher(true),
      createAuthSession(),
    );

    await expect(
      useCase.execute({ username: 'admin', password: 'secret' }),
    ).rejects.toThrow(AuthenticationError);
  });
});

describe('RegisterUseCase', () => {
  it('creates user and issues session', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(createMockUser({ username: 'new_user' }));
    const hasher = createMockPasswordHasher();
    hasher.hash.mockResolvedValue('hashed');

    const useCase = new RegisterUseCase(userRepo, hasher, createAuthSession());
    const result = await useCase.execute({
      username: 'new_user',
      password: 'password1',
      passwordConfirm: 'password1',
      email: 'new@example.com',
    });

    expect(result.username).toBe('new_user');
    expect(result.isNewUser).toBe(true);
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'new_user', email: 'new@example.com' }),
    );
  });

  it('throws ConflictError for duplicate username', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(createMockUser());

    const useCase = new RegisterUseCase(userRepo, createMockPasswordHasher(), createAuthSession());

    await expect(
      useCase.execute({ username: 'admin', password: 'password1', passwordConfirm: 'password1' }),
    ).rejects.toThrow(ConflictError);
  });
});

describe('StartOAuthLoginUseCase', () => {
  it('returns authorization URL and stores state', async () => {
    const oauthProvider = createMockOAuthProvider();
    const oauthStateRepo = createMockOAuthStateRepo();

    const useCase = new StartOAuthLoginUseCase(oauthProvider, oauthStateRepo);
    const result = await useCase.execute({
      provider: OAuthProvider.GOOGLE,
      redirectUri: 'http://localhost/callback',
    });

    expect(result.authorizationUrl).toContain('oauth.example');
    expect(oauthStateRepo.create).toHaveBeenCalled();
  });

  it('throws when provider is not configured', async () => {
    const oauthProvider = createMockOAuthProvider({
      isConfigured: vi.fn().mockReturnValue(false),
    });

    const useCase = new StartOAuthLoginUseCase(oauthProvider, createMockOAuthStateRepo());

    await expect(
      useCase.execute({ provider: OAuthProvider.KAKAO, redirectUri: 'http://localhost/callback' }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('CompleteOAuthLoginUseCase', () => {
  it('logs in existing OAuth account', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser());
    const oauthAccountRepo = createMockOAuthAccountRepo();
    oauthAccountRepo.findByProviderUserId.mockResolvedValue({
      id: 'oa-1',
      userId: 'user-1',
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'oauth-user-1',
      email: 'user@example.com',
      createdAt: new Date(),
    });
    const oauthStateRepo = createMockOAuthStateRepo();
    oauthStateRepo.consume.mockResolvedValue({
      id: 'st-1',
      state: 'state-1',
      provider: OAuthProvider.GOOGLE,
      redirectUri: 'http://localhost/callback',
      expiresAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
    });

    const useCase = new CompleteOAuthLoginUseCase(
      userRepo,
      oauthAccountRepo,
      oauthStateRepo,
      createMockOAuthProvider(),
      createAuthSession(),
    );

    const result = await useCase.execute({
      provider: OAuthProvider.GOOGLE,
      code: 'code-1',
      state: 'state-1',
    });

    expect(result.username).toBe('admin');
    expect(result.isNewUser).toBe(false);
  });

  it('signs up new OAuth user', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByUsername.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(createMockUser({ username: 'oauth_user', passwordHash: null }));
    const oauthAccountRepo = createMockOAuthAccountRepo();
    oauthAccountRepo.findByProviderUserId.mockResolvedValue(null);
    const oauthStateRepo = createMockOAuthStateRepo();
    oauthStateRepo.consume.mockResolvedValue({
      id: 'st-1',
      state: 'state-1',
      provider: OAuthProvider.GOOGLE,
      redirectUri: 'http://localhost/callback',
      expiresAt: new Date(Date.now() + 60000),
      createdAt: new Date(),
    });

    const useCase = new CompleteOAuthLoginUseCase(
      userRepo,
      oauthAccountRepo,
      oauthStateRepo,
      createMockOAuthProvider(),
      createAuthSession(),
    );

    const result = await useCase.execute({
      provider: OAuthProvider.GOOGLE,
      code: 'code-1',
      state: 'state-1',
    });

    expect(result.isNewUser).toBe(true);
    expect(oauthAccountRepo.create).toHaveBeenCalled();
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: null }),
    );
  });
});

describe('RefreshTokenUseCase', () => {
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

  it('throws Unauthorized for invalid refresh token', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    refreshRepo.findValidByHash.mockResolvedValue(null);

    const useCase = new RefreshTokenUseCase(refreshRepo, createMockTokenService());

    await expect(useCase.execute('bad-token')).rejects.toThrow(AuthenticationError);
  });
});

describe('LogoutUseCase', () => {
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

  it('no-ops when refresh token is missing', async () => {
    const refreshRepo = createMockRefreshTokenRepo();
    const useCase = new LogoutUseCase(refreshRepo, createMockTokenService());

    await useCase.execute(undefined);

    expect(refreshRepo.findValidByHash).not.toHaveBeenCalled();
    expect(refreshRepo.revoke).not.toHaveBeenCalled();
  });
});
