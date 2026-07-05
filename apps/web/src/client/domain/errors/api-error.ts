import {
  AppErrorCode,
  isAppErrorCode,
  resolveAppErrorMessage,
  type ApiErrorBody,
  type AppErrorCode as AppErrorCodeType,
} from '@sar/shared';
import { AxiosError } from 'axios';
import { AppError } from './app-error';

function parseApiErrorBody(data: unknown): ApiErrorBody | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as Partial<ApiErrorBody>;
  if (typeof body.code !== 'string' || typeof body.message !== 'string') return null;
  if (!isAppErrorCode(body.code)) {
    return {
      code: AppErrorCode.INTERNAL,
      message: resolveAppErrorMessage(AppErrorCode.INTERNAL, body.message),
    };
  }
  return {
    code: body.code,
    message: resolveAppErrorMessage(body.code, body.message),
  };
}

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
  }

  if (error instanceof Error && error.message) {
    return new AppError(error.message, fallbackCode);
  }

  return new AppError(resolveAppErrorMessage(fallbackCode), fallbackCode);
}
