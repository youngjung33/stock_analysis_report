import { OAuthProviderId } from '@sar/shared';

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
  changeEmail(email: string): Promise<void>;
  requestEmailVerification(): Promise<void>;
  unlinkOAuth(provider: OAuthProviderId): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(input: { token: string; password: string; passwordConfirm: string }): Promise<void>;
}
