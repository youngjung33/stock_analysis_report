import { OAuthProviderId } from '@sar/shared';

export interface EmailVerificationIssued {
  verificationCode: string;
}

export interface AccountProfile {
  username: string;
  email: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  oauthAccounts: { provider: OAuthProviderId; email: string | null; linkedAt: string }[];
}

export interface IAccountRepository {
  getProfile(): Promise<AccountProfile>;
  changePassword(input: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }): Promise<void>;
  changeEmail(email: string): Promise<EmailVerificationIssued>;
  requestEmailVerification(): Promise<EmailVerificationIssued | null>;
  confirmEmailVerification(code: string): Promise<void>;
  unlinkOAuth(provider: OAuthProviderId): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: { token: string; password: string; passwordConfirm: string }): Promise<void>;
  deleteAccount(input: { password?: string }): Promise<void>;
}
