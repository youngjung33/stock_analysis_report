import { vi } from 'vitest';
import { AppErrorCode, AuthTokenType, OAuthProvider } from '@sar/shared';
import { AuthenticationError, ConflictError, ValidationError } from '@server/domain/errors/domain.errors';
import {
  ChangePasswordUseCase,
  ChangeEmailUseCase,
  DeleteAccountUseCase,
  GetAccountUseCase,
  RequestEmailVerificationUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  UnlinkOAuthAccountUseCase,
  VerifyEmailUseCase,
} from '@server/domain/usecases/account/account.use-cases';
import { hashAuthToken } from '@server/data/auth/auth-token.utils';
import {
  createMockAuthTokenRepo,
  createMockEmailSender,
} from '../../mocks/account.mock';
import {
  createMockPasswordHasher,
  createMockUser,
  createMockUserRepo,
} from '../../mocks/repositories.mock';
import { IUserOAuthAccountRepository } from '@server/domain/repositories';

function createMockOAuthAccountRepo(
  overrides: Partial<IUserOAuthAccountRepository> = {},
): IUserOAuthAccountRepository {
  return {
    findByProviderUserId: vi.fn(),
    findByUserId: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    deleteByUserAndProvider: vi.fn(),
    ...overrides,
  };
}

describe('GetAccountUseCase', () => {
  it('returns profile with oauth accounts', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(
      createMockUser({ email: 'user@example.com', emailVerifiedAt: new Date() }),
    );
    const oauthAccountRepo = createMockOAuthAccountRepo();
    oauthAccountRepo.findByUserId.mockResolvedValue([
      {
        id: 'oauth-1',
        userId: 'user-1',
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-1',
        email: 'user@gmail.com',
        createdAt: new Date('2024-06-01'),
      },
    ]);

    const useCase = new GetAccountUseCase(userRepo, oauthAccountRepo);
    const profile = await useCase.execute('user-1');

    expect(profile.username).toBe('admin');
    expect(profile.email).toBe('user@example.com');
    expect(profile.emailVerified).toBe(true);
    expect(profile.hasPassword).toBe(true);
    expect(profile.oauthAccounts).toHaveLength(1);
    expect(profile.oauthAccounts[0].provider).toBe(OAuthProvider.GOOGLE);
  });

  it('throws when user missing', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(null);

    const useCase = new GetAccountUseCase(userRepo, createMockOAuthAccountRepo());
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(AuthenticationError);
  });
});

describe('ChangeEmailUseCase', () => {
  it('rejects invalid email', async () => {
    const useCase = new ChangeEmailUseCase(createMockUserRepo(), createMockAuthTokenRepo());
    await expect(
      useCase.execute({ userId: 'user-1', email: 'not-an-email' }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects email taken by another user', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByEmail.mockResolvedValue(createMockUser({ id: 'other-user' }));

    const useCase = new ChangeEmailUseCase(userRepo, createMockAuthTokenRepo());
    await expect(
      useCase.execute({ userId: 'user-1', email: 'taken@example.com' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates email and returns verification code', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByEmail.mockResolvedValue(null);
    const authTokenRepo = createMockAuthTokenRepo();

    const useCase = new ChangeEmailUseCase(userRepo, authTokenRepo);
    const result = await useCase.execute({ userId: 'user-1', email: 'New@Example.com' });

    expect(userRepo.updateEmail).toHaveBeenCalledWith('user-1', 'new@example.com');
    expect(result.verificationCode).toMatch(/^\d{6}$/);
    expect(authTokenRepo.create).toHaveBeenCalled();
  });
});

describe('UnlinkOAuthAccountUseCase', () => {
  it('rejects invalid provider', async () => {
    const useCase = new UnlinkOAuthAccountUseCase(createMockUserRepo(), createMockOAuthAccountRepo());
    await expect(useCase.execute('user-1', 'invalid')).rejects.toThrow(ValidationError);
  });

  it('forbids unlink when no password and last oauth', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser({ passwordHash: null }));
    const oauthAccountRepo = createMockOAuthAccountRepo();
    oauthAccountRepo.findByUserId.mockResolvedValue([
      {
        id: 'oauth-1',
        userId: 'user-1',
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'g-1',
        email: null,
        createdAt: new Date(),
      },
    ]);

    const useCase = new UnlinkOAuthAccountUseCase(userRepo, oauthAccountRepo);
    await expect(useCase.execute('user-1', OAuthProvider.GOOGLE)).rejects.toMatchObject({
      code: AppErrorCode.AUTH_OAUTH_UNLINK_FORBIDDEN,
    });
  });

  it('deletes oauth link when password exists', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser());
    const oauthAccountRepo = createMockOAuthAccountRepo();
    oauthAccountRepo.findByUserId.mockResolvedValue([
      {
        id: 'oauth-1',
        userId: 'user-1',
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'g-1',
        email: null,
        createdAt: new Date(),
      },
    ]);

    const useCase = new UnlinkOAuthAccountUseCase(userRepo, oauthAccountRepo);
    await useCase.execute('user-1', OAuthProvider.GOOGLE);

    expect(oauthAccountRepo.deleteByUserAndProvider).toHaveBeenCalledWith(
      'user-1',
      OAuthProvider.GOOGLE,
    );
  });
});

describe('ChangePasswordUseCase', () => {
  it('rejects wrong current password', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser());
    const useCase = new ChangePasswordUseCase(userRepo, createMockPasswordHasher(false));

    await expect(
      useCase.execute({
        userId: 'user-1',
        currentPassword: 'wrong',
        newPassword: 'NewPass1!',
        newPasswordConfirm: 'NewPass1!',
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.AUTH_CURRENT_PASSWORD_INVALID });
  });

  it('updates password hash on success', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser());
    const hasher = createMockPasswordHasher(true);
    hasher.hash.mockResolvedValue('new-hash');

    const useCase = new ChangePasswordUseCase(userRepo, hasher);
    await useCase.execute({
      userId: 'user-1',
      currentPassword: 'old',
      newPassword: 'NewPass1!',
      newPasswordConfirm: 'NewPass1!',
    });

    expect(userRepo.updatePasswordHash).toHaveBeenCalledWith('user-1', 'new-hash');
  });
});

describe('RequestPasswordResetUseCase', () => {
  it('does not send email when user missing', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findByEmail.mockResolvedValue(null);
    const emailSender = createMockEmailSender();
    const authTokenRepo = createMockAuthTokenRepo();

    const useCase = new RequestPasswordResetUseCase(userRepo, authTokenRepo, emailSender);
    await useCase.execute('missing@example.com');

    expect(emailSender.send).not.toHaveBeenCalled();
    expect(authTokenRepo.create).not.toHaveBeenCalled();
  });

  it('creates token and sends email for existing user', async () => {
    const user = createMockUser({ email: 'user@example.com' });
    const userRepo = createMockUserRepo();
    userRepo.findByEmail.mockResolvedValue(user);
    const emailSender = createMockEmailSender();
    const authTokenRepo = createMockAuthTokenRepo();

    const useCase = new RequestPasswordResetUseCase(userRepo, authTokenRepo, emailSender);
    await useCase.execute('user@example.com');

    expect(authTokenRepo.invalidateUserTokens).toHaveBeenCalledWith(
      user.id,
      AuthTokenType.PASSWORD_RESET,
    );
    expect(authTokenRepo.create).toHaveBeenCalled();
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' }),
    );
  });
});

describe('ResetPasswordUseCase', () => {
  it('rejects invalid token', async () => {
    const authTokenRepo = createMockAuthTokenRepo();
    authTokenRepo.consumeValid.mockResolvedValue(null);

    const useCase = new ResetPasswordUseCase(
      createMockUserRepo(),
      authTokenRepo,
      createMockPasswordHasher(true),
    );

    await expect(
      useCase.execute({ token: 'bad', password: 'NewPass1!', passwordConfirm: 'NewPass1!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('updates password when token valid', async () => {
    const authTokenRepo = createMockAuthTokenRepo();
    authTokenRepo.consumeValid.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      type: AuthTokenType.PASSWORD_RESET,
      tokenHash: 'hash',
      email: 'user@example.com',
      expiresAt: new Date(),
      createdAt: new Date(),
    });
    const userRepo = createMockUserRepo();
    const hasher = createMockPasswordHasher(true);
    hasher.hash.mockResolvedValue('reset-hash');

    const useCase = new ResetPasswordUseCase(userRepo, authTokenRepo, hasher);
    await useCase.execute({
      token: 'raw-token',
      password: 'NewPass1!',
      passwordConfirm: 'NewPass1!',
    });

    expect(authTokenRepo.consumeValid).toHaveBeenCalledWith(
      hashAuthToken('raw-token'),
      AuthTokenType.PASSWORD_RESET,
    );
    expect(userRepo.updatePasswordHash).toHaveBeenCalledWith('user-1', 'reset-hash');
  });
});

describe('VerifyEmailUseCase', () => {
  it('rejects non-numeric code', async () => {
    const useCase = new VerifyEmailUseCase(createMockUserRepo(), createMockAuthTokenRepo());
    await expect(useCase.execute('abcdef')).rejects.toThrow(ValidationError);
  });

  it('marks email verified on valid code', async () => {
    const authTokenRepo = createMockAuthTokenRepo();
    authTokenRepo.consumeValid.mockResolvedValue({
      id: 'tok-1',
      userId: 'user-1',
      type: AuthTokenType.EMAIL_VERIFY,
      tokenHash: 'hash',
      email: 'new@example.com',
      expiresAt: new Date(),
      createdAt: new Date(),
    });
    const userRepo = createMockUserRepo();
    userRepo.findByEmail.mockResolvedValue(null);

    const useCase = new VerifyEmailUseCase(userRepo, authTokenRepo);
    await useCase.execute('123456');

    expect(authTokenRepo.consumeValid).toHaveBeenCalledWith(
      hashAuthToken('123456'),
      AuthTokenType.EMAIL_VERIFY,
    );
    expect(userRepo.updateEmail).toHaveBeenCalledWith('user-1', 'new@example.com');
    expect(userRepo.markEmailVerified).toHaveBeenCalledWith('user-1');
  });
});

describe('RequestEmailVerificationUseCase', () => {
  it('returns verification code for unverified user', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(
      createMockUser({ email: 'user@example.com', emailVerifiedAt: null }),
    );
    const authTokenRepo = createMockAuthTokenRepo();

    const useCase = new RequestEmailVerificationUseCase(userRepo, authTokenRepo);
    const result = await useCase.execute('user-1');

    expect(result?.verificationCode).toMatch(/^\d{6}$/);
    expect(authTokenRepo.create).toHaveBeenCalled();
  });

  it('returns null when already verified', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(
      createMockUser({ email: 'user@example.com', emailVerifiedAt: new Date() }),
    );

    const useCase = new RequestEmailVerificationUseCase(userRepo, createMockAuthTokenRepo());
    const result = await useCase.execute('user-1');

    expect(result).toBeNull();
  });
});

describe('DeleteAccountUseCase', () => {
  it('requires password for password-based accounts', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser());

    const useCase = new DeleteAccountUseCase(userRepo, createMockPasswordHasher(true));
    await expect(useCase.execute({ userId: 'user-1' })).rejects.toMatchObject({
      code: AppErrorCode.AUTH_LOGIN_REQUIRED,
    });
    expect(userRepo.delete).not.toHaveBeenCalled();
  });

  it('deletes user when password valid', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser());

    const useCase = new DeleteAccountUseCase(userRepo, createMockPasswordHasher(true));
    await useCase.execute({ userId: 'user-1', password: 'secret' });

    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
  });

  it('deletes social-only user without password', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(createMockUser({ passwordHash: null }));

    const useCase = new DeleteAccountUseCase(userRepo, createMockPasswordHasher(true));
    await useCase.execute({ userId: 'user-1' });

    expect(userRepo.delete).toHaveBeenCalledWith('user-1');
  });
});
