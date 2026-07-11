import { OAuthProviderId } from '@sar/shared';
import { AppErrorCode } from '@sar/shared';
import { apiClient } from '../api/client';
import { toAppError } from '../../domain/errors/api-error';
import { AccountProfile, EmailVerificationIssued, IAccountRepository } from '../../domain/repositories/account.repository';

export class ApiAccountRepository implements IAccountRepository {
  async getProfile(): Promise<AccountProfile> {
    try {
      const { data } = await apiClient.get<AccountProfile>('/account');
      return data;
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }) {
    try {
      await apiClient.post('/account/password', input);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async changeEmail(email: string): Promise<EmailVerificationIssued> {
    try {
      const { data } = await apiClient.post<EmailVerificationIssued & { ok: boolean; message: string }>(
        '/account/email',
        { email },
      );
      return { verificationCode: data.verificationCode };
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async requestEmailVerification(): Promise<EmailVerificationIssued | null> {
    try {
      const { data } = await apiClient.post<EmailVerificationIssued & { ok: boolean; message: string }>(
        '/account/verify-email',
      );
      if (!data.verificationCode) return null;
      return { verificationCode: data.verificationCode };
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async confirmEmailVerification(code: string) {
    try {
      await apiClient.post('/account/confirm-email', { code });
    } catch (error) {
      throw toAppError(error, AppErrorCode.AUTH_TOKEN_INVALID);
    }
  }

  async unlinkOAuth(provider: OAuthProviderId) {
    try {
      await apiClient.delete(`/account/oauth/${provider}`);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async requestPasswordReset(email: string) {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async resetPassword(input: { token: string; password: string; passwordConfirm: string }) {
    try {
      await apiClient.post('/auth/reset-password', input);
    } catch (error) {
      throw toAppError(error, AppErrorCode.AUTH_TOKEN_INVALID);
    }
  }

  async deleteAccount(input: { password?: string }) {
    try {
      await apiClient.delete('/account', { data: input });
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }
}

export const accountRepository = new ApiAccountRepository();
