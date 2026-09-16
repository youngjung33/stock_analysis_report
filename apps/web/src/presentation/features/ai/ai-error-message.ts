import { AppErrorCode } from '@sar/shared';
import { AppError, getErrorMessage } from '@/client/domain/errors/app-error';
import type { TFunction } from 'i18next';

export function resolveAiFetchErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case AppErrorCode.AI_QUOTA_EXCEEDED:
        return t('ai.quotaExceeded');
      case AppErrorCode.AI_MEMBERS_ONLY:
        return t('ai.membersOnly');
      case AppErrorCode.AI_DISABLED:
        return t('ai.disabled');
      case AppErrorCode.AI_PROVIDER_ERROR:
        return t('ai.providerFailed');
      case AppErrorCode.RATE_LIMIT:
        return t('ai.rateLimited');
      default:
        return getErrorMessage(error, t('ai.loadFailed'));
    }
  }
  return t('ai.loadFailed');
}
