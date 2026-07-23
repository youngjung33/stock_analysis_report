import { AppErrorCode, type ApiSuccessResult } from '@sar/shared';
import { AppError } from '../../domain/errors/app-error';
import { parseApiSuccessResult } from '../../domain/errors/api-success';
import { apiClient } from '../api/client';
import { toAppError } from '../../domain/errors/api-error';
import {
  AccountProfile,
  EmailVerificationSuccess,
  IAccountRepository,
} from '../../domain/repositories/account.repository';

function requireSuccessResult(data: unknown): ApiSuccessResult {
  const result = parseApiSuccessResult(data);
  if (!result) {
    throw new AppError('Invalid API success response', AppErrorCode.INTERNAL);
  }
  return result;
}

function toEmailVerificationSuccess(data: unknown): EmailVerificationSuccess {
  const base = requireSuccessResult(data);
  const verificationCode =
    data && typeof data === 'object' && 'verificationCode' in data
      ? (data as { verificationCode?: string }).verificationCode
      : undefined;
  return { ...base, verificationCode };
}

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
      const { data } = await apiClient.post('/account/password', input);
      return requireSuccessResult(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async changeEmail(email: string): Promise<EmailVerificationSuccess> {
    try {
      const { data } = await apiClient.post('/account/email', { email });
      return toEmailVerificationSuccess(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async requestEmailVerification(): Promise<EmailVerificationSuccess> {
    try {
      const { data } = await apiClient.post('/account/verify-email');
      return toEmailVerificationSuccess(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async confirmEmailVerification(code: string) {
    try {
      const { data } = await apiClient.post('/account/confirm-email', { code });
      return requireSuccessResult(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.AUTH_TOKEN_INVALID);
    }
  }

  async unlinkOAuth(provider: import('@sar/shared').OAuthProviderId) {
    try {
      const { data } = await apiClient.delete(`/account/oauth/${provider}`);
      return requireSuccessResult(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const { data } = await apiClient.post('/auth/forgot-password', { email });
      return requireSuccessResult(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }

  async resetPassword(input: { token: string; password: string; passwordConfirm: string }) {
    try {
      const { data } = await apiClient.post('/auth/reset-password', input);
      return requireSuccessResult(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.AUTH_TOKEN_INVALID);
    }
  }

  async deleteAccount(input: { password?: string }) {
    try {
      const { data } = await apiClient.delete('/account', { data: input });
      return requireSuccessResult(data);
    } catch (error) {
      throw toAppError(error, AppErrorCode.INTERNAL);
    }
  }
}

export const accountRepository = new ApiAccountRepository();
