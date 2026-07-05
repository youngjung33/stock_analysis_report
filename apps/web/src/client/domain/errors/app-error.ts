import {
  AppErrorCode,
  isAppErrorCode,
  resolveAppErrorMessage,
  type AppErrorCode as AppErrorCodeType,
} from '@sar/shared';

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
  fallback = resolveAppErrorMessage(AppErrorCode.INTERNAL),
): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export { toAppError } from './api-error';
