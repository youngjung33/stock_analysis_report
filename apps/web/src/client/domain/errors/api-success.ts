import {
  AppSuccessCode,
  isAppErrorCode,
  isAppSuccessCode,
  resolveAppErrorMessage,
  resolveAppSuccessMessage,
  type ApiSuccessResult,
  type AppErrorCode as AppErrorCodeType,
  type AppSuccessCode as AppSuccessCodeType,
} from '@sar/shared';
import i18n from '@/i18n/config';

export interface ApiSuccessBody {
  ok: true;
  code: AppSuccessCodeType;
}

export function parseApiSuccessBody(data: unknown): ApiSuccessBody | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as Partial<ApiSuccessBody>;
  if (body.ok !== true || typeof body.code !== 'string' || !isAppSuccessCode(body.code)) {
    return null;
  }
  return { ok: true, code: body.code };
}

export function parseApiSuccessResult(data: unknown): ApiSuccessResult | null {
  const body = parseApiSuccessBody(data);
  if (!body) return null;
  return { code: body.code };
}

export function getSuccessMessage(
  code: AppSuccessCodeType | string,
  params?: Record<string, string | number>,
  fallback?: string,
): string {
  if (isAppSuccessCode(code)) {
    const key = `success.${code}`;
    const translated = i18n.t(key, params ?? {});
    if (translated !== key) return translated;
    return fallback ?? resolveAppSuccessMessage(code);
  }
  return fallback ?? resolveAppSuccessMessage(AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED);
}

/** API 성공 code + 부가 필드(verificationCode 등) → toast 문구 */
export function formatApiSuccessMessage(
  result: ApiSuccessResult & { verificationCode?: string },
): string {
  const { code } = result;
  if (result.verificationCode !== undefined && result.verificationCode !== null) {
    const toastKey = `success.${code}_toast`;
    const toast = i18n.t(toastKey, { code: String(result.verificationCode) });
    if (toast !== toastKey) return toast;
  }
  return getSuccessMessage(code);
}

/** API 응답 code(성공·에러) → 현재 locale 메시지 */
export function translateResponseCode(code: string, fallback?: string): string {
  if (isAppSuccessCode(code)) {
    return getSuccessMessage(code, undefined, fallback);
  }
  if (isAppErrorCode(code)) {
    const key = `errors.${code}`;
    const translated = i18n.t(key);
    if (translated !== key) return translated;
    return fallback ?? resolveAppErrorMessage(code);
  }
  return fallback ?? i18n.t('errors.serverError');
}

export interface UsernameCheckResult {
  available: boolean;
  code: AppSuccessCodeType | AppErrorCodeType;
}

export function translateUsernameCheckResult(result: UsernameCheckResult): string {
  return translateResponseCode(result.code);
}
