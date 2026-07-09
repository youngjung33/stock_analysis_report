import { OAuthProviderId } from '@sar/shared';
import { AppErrorCode } from '@sar/shared';
import { apiClient } from '../api/client';
import { toAppError } from '../../domain/errors/api-error';
import { AccountProfile, IAccountRepository } from '../../domain/repositories/account.repository';

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

  async changeEmail(email: string) {
    try {
      await apiClient.post('/account/email', { email });
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async requestEmailVerification() {
    try {
      await apiClient.post('/account/verify-email');
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
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
}

export const accountRepository = new ApiAccountRepository();
