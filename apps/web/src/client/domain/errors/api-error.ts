import {
  AppErrorCode,
  resolveAppErrorMessage,
  USER_FACING_SERVER_ERROR_MESSAGE,
  type AppErrorCode as AppErrorCodeType,
} from '@sar/shared';
import { AxiosError } from 'axios';
import { parseApiErrorBody } from './api-error-parse';
import { AppError } from './app-error';

export function toAppError(
  error: unknown,
  fallbackCode: AppErrorCodeType = AppErrorCode.INTERNAL,
): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof AxiosError) {
    const parsed = parseApiErrorBody(error.response?.data);
    if (parsed) {
      return new AppError(parsed.message, parsed.code);
    }
    if (error.response) {
      return new AppError(USER_FACING_SERVER_ERROR_MESSAGE, AppErrorCode.INTERNAL);
    }
  }

  return new AppError(resolveAppErrorMessage(fallbackCode), fallbackCode);
}
