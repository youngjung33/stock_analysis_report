import { vi } from 'vitest';
import { AppErrorCode, AuthTokenType } from '@sar/shared';
import { ValidationError } from '@server/domain/errors/domain.errors';
import {
  ChangePasswordUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
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
  it('marks email verified on valid token', async () => {
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
    await useCase.execute('verify-token');

    expect(userRepo.updateEmail).toHaveBeenCalledWith('user-1', 'new@example.com');
    expect(userRepo.markEmailVerified).toHaveBeenCalledWith('user-1');
  });
});
