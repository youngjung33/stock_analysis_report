import {
  AppErrorCode,
  isAppErrorCode,
  resolveAppErrorMessage,
  type ApiErrorBody,
} from '@sar/shared';

export function parseApiErrorBody(data: unknown): ApiErrorBody | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as Partial<ApiErrorBody>;
  if (typeof body.code !== 'string' || typeof body.message !== 'string') return null;

  const code = isAppErrorCode(body.code) ? body.code : AppErrorCode.INTERNAL;
  return {
    code,
    message: resolveAppErrorMessage(code, body.message),
  };
}
