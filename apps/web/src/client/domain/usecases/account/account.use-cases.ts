import { IAccountRepository } from '../../repositories/account.repository';

export class GetAccountUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute() {
    return this.repo.getProfile();
  }
}

export class ChangePasswordUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute(input: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) {
    return this.repo.changePassword(input);
  }
}

export class ChangeEmailUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute(email: string) {
    return this.repo.changeEmail(email);
  }
}

export class RequestEmailVerificationUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute() {
    return this.repo.requestEmailVerification();
  }
}

export class ConfirmEmailVerificationUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute(code: string) {
    return this.repo.confirmEmailVerification(code);
  }
}

export class UnlinkOAuthUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute(provider: import('@sar/shared').OAuthProviderId) {
    return this.repo.unlinkOAuth(provider);
  }
}

export class RequestPasswordResetUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute(email: string) {
    return this.repo.requestPasswordReset(email);
  }
}

export class ResetPasswordUseCase {
  constructor(private readonly repo: IAccountRepository) {}
  execute(input: { token: string; password: string; passwordConfirm: string }) {
    return this.repo.resetPassword(input);
  }
}
