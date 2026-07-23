import { AppErrorCode, isAppErrorCode, isInternalAppErrorCode, resolveAppErrorMessage, type AppErrorCode as AppErrorCodeType } from '@sar/shared';
import { AxiosError } from 'axios';
import i18n from '@/i18n/config';
import { parseApiErrorBody } from './api-error-parse';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: AppErrorCodeType = AppErrorCode.INTERNAL,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function translateErrorCode(code: AppErrorCodeType | string | undefined, serverMessage?: string): string {
  if (code && isAppErrorCode(code)) {
    const key = `errors.${code}`;
    const translated = i18n.t(key);
    if (translated !== key) return translated;
    return resolveAppErrorMessage(code, serverMessage);
  }
  return i18n.t('errors.serverError');
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  const defaultFallback = fallback ?? i18n.t('errors.serverError');

  if (error instanceof AppError) {
    return translateErrorCode(error.code, error.message);
  }

  if (error instanceof AxiosError) {
    const parsed = parseApiErrorBody(error.response?.data);
    if (parsed) {
      if (parsed.code && isAppErrorCode(parsed.code) && isInternalAppErrorCode(parsed.code)) {
        return i18n.t('errors.serverError');
      }
      return translateErrorCode(parsed.code, parsed.message);
    }
    if (error.response) {
      return i18n.t('errors.serverError');
    }
  }

  return defaultFallback;
}

export {
  formatApiSuccessMessage,
  getSuccessMessage,
  parseApiSuccessResult,
  translateResponseCode,
  translateUsernameCheckResult,
} from './api-success';
export type { UsernameCheckResult } from './api-success';

export { toAppError } from './api-error';
