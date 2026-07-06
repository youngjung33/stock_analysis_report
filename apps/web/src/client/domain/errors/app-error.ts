import {
  AppErrorCode,
  resolveAppErrorMessage,
  USER_FACING_SERVER_ERROR_MESSAGE,
  type AppErrorCode as AppErrorCodeType,
} from '@sar/shared';
import { AxiosError } from 'axios';
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

export function getErrorMessage(
  error: unknown,
  fallback = USER_FACING_SERVER_ERROR_MESSAGE,
): string {
  if (error instanceof AppError) {
    return resolveAppErrorMessage(error.code, error.message);
  }

  if (error instanceof AxiosError) {
    const parsed = parseApiErrorBody(error.response?.data);
    if (parsed) {
      return resolveAppErrorMessage(parsed.code, parsed.message);
    }
    if (error.response) {
      return USER_FACING_SERVER_ERROR_MESSAGE;
    }
  }

  return fallback;
}

export { toAppError } from './api-error';
