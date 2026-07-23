import { ApiSuccessResult, OAuthProviderId } from '@sar/shared';

export type EmailVerificationSuccess = ApiSuccessResult & {
  verificationCode?: string;
};

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
  }): Promise<ApiSuccessResult>;
  changeEmail(email: string): Promise<EmailVerificationSuccess>;
  requestEmailVerification(): Promise<EmailVerificationSuccess>;
  confirmEmailVerification(code: string): Promise<ApiSuccessResult>;
  unlinkOAuth(provider: OAuthProviderId): Promise<ApiSuccessResult>;
  requestPasswordReset(email: string): Promise<ApiSuccessResult>;
  resetPassword(input: { token: string; password: string; passwordConfirm: string }): Promise<ApiSuccessResult>;
  deleteAccount(input: { password?: string }): Promise<ApiSuccessResult>;
}
