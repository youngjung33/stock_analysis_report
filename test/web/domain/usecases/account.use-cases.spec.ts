import { describe, expect, it, vi } from 'vitest';
import { AppSuccessCode, OAuthProvider } from '@sar/shared';
import {
  ChangeEmailUseCase,
  ChangePasswordUseCase,
  ConfirmEmailVerificationUseCase,
  DeleteAccountUseCase,
  GetAccountUseCase,
  RequestEmailVerificationUseCase,
  UnlinkOAuthUseCase,
} from '@/client/domain/usecases/account/account.use-cases';
import { createFakeAccountRepository } from '../../mocks/fake-repositories';

describe('GetAccountUseCase (client)', () => {
  it('delegates to account repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new GetAccountUseCase(repo);
    const profile = await useCase.execute();

    expect(profile.username).toBe('admin');
    expect(repo.getProfile).toHaveBeenCalled();
  });
});

describe('ChangeEmailUseCase (client)', () => {
  it('delegates email to repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new ChangeEmailUseCase(repo);
    const result = await useCase.execute('new@example.com');

    expect(result.verificationCode).toBe('123456');
    expect(result.code).toBe(AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED);
    expect(repo.changeEmail).toHaveBeenCalledWith('new@example.com');
  });
});

describe('ChangePasswordUseCase (client)', () => {
  it('delegates password change to repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new ChangePasswordUseCase(repo);
    await useCase.execute({
      currentPassword: 'old',
      newPassword: 'NewPass1!',
      newPasswordConfirm: 'NewPass1!',
    });

    expect(repo.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old',
      newPassword: 'NewPass1!',
      newPasswordConfirm: 'NewPass1!',
    });
  });
});

describe('RequestEmailVerificationUseCase (client)', () => {
  it('delegates to repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new RequestEmailVerificationUseCase(repo);
    const result = await useCase.execute();

    expect(result.verificationCode).toBe('654321');
    expect(result.code).toBe(AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED);
    expect(repo.requestEmailVerification).toHaveBeenCalled();
  });
});

describe('ConfirmEmailVerificationUseCase (client)', () => {
  it('delegates code to repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new ConfirmEmailVerificationUseCase(repo);
    await useCase.execute('123456');

    expect(repo.confirmEmailVerification).toHaveBeenCalledWith('123456');
  });
});

describe('UnlinkOAuthUseCase (client)', () => {
  it('delegates provider to repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new UnlinkOAuthUseCase(repo);
    await useCase.execute(OAuthProvider.GOOGLE);

    expect(repo.unlinkOAuth).toHaveBeenCalledWith(OAuthProvider.GOOGLE);
  });
});

describe('DeleteAccountUseCase (client)', () => {
  it('delegates delete to repository', async () => {
    const repo = createFakeAccountRepository();
    const useCase = new DeleteAccountUseCase(repo);
    await useCase.execute({ password: 'secret' });

    expect(repo.deleteAccount).toHaveBeenCalledWith({ password: 'secret' });
  });
});
