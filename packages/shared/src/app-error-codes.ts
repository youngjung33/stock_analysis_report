/** API·클라이언트 공통 에러 코드 */
export const AppErrorCode = {
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
  DB_UNAVAILABLE: 'DB_UNAVAILABLE',
  RATE_LIMIT: 'RATE_LIMIT',

  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SOCIAL_ONLY: 'AUTH_SOCIAL_ONLY',
  AUTH_INVALID_REFRESH: 'AUTH_INVALID_REFRESH',
  AUTH_INVALID_ACCESS: 'AUTH_INVALID_ACCESS',
  AUTH_LOGIN_REQUIRED: 'AUTH_LOGIN_REQUIRED',

  AUTH_USERNAME_INVALID: 'AUTH_USERNAME_INVALID',
  AUTH_USERNAME_TAKEN: 'AUTH_USERNAME_TAKEN',
  AUTH_EMAIL_INVALID: 'AUTH_EMAIL_INVALID',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_PASSWORD_INVALID: 'AUTH_PASSWORD_INVALID',
  AUTH_PASSWORD_MISMATCH: 'AUTH_PASSWORD_MISMATCH',
  AUTH_PASSWORD_CONFIRM_REQUIRED: 'AUTH_PASSWORD_CONFIRM_REQUIRED',
  AUTH_REGISTER_FIELDS_REQUIRED: 'AUTH_REGISTER_FIELDS_REQUIRED',

  AUTH_OAUTH_PROVIDER_INVALID: 'AUTH_OAUTH_PROVIDER_INVALID',
  AUTH_OAUTH_NOT_CONFIGURED: 'AUTH_OAUTH_NOT_CONFIGURED',
  AUTH_OAUTH_STATE_INVALID: 'AUTH_OAUTH_STATE_INVALID',
  AUTH_OAUTH_FAILED: 'AUTH_OAUTH_FAILED',

  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_CURRENT_PASSWORD_INVALID: 'AUTH_CURRENT_PASSWORD_INVALID',
  AUTH_OAUTH_UNLINK_FORBIDDEN: 'AUTH_OAUTH_UNLINK_FORBIDDEN',
  AUTH_EMAIL_REQUIRED: 'AUTH_EMAIL_REQUIRED',

  CASH_INSUFFICIENT: 'CASH_INSUFFICIENT',
  CASH_AMOUNT_INVALID: 'CASH_AMOUNT_INVALID',

  STOCK_REQUIRED: 'STOCK_REQUIRED',
  HOLDING_INSUFFICIENT: 'HOLDING_INSUFFICIENT',
  TRANSACTION_QUANTITY_INVALID: 'TRANSACTION_QUANTITY_INVALID',
  TRANSACTION_PRICE_INVALID: 'TRANSACTION_PRICE_INVALID',

  AUTH_OAUTH_REDIRECT_URI_REQUIRED: 'AUTH_OAUTH_REDIRECT_URI_REQUIRED',
  AUTH_OAUTH_CODE_STATE_REQUIRED: 'AUTH_OAUTH_CODE_STATE_REQUIRED',
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];

export interface ApiErrorBody {
  code: AppErrorCode;
  message: string;
}

/** 사용자에게 노출해도 되는 서버/인프라 장애 메시지 (내부 상세 숨김) */
export const USER_FACING_SERVER_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

/** 사용자에게 인프라·서버 상세를 노출하면 안 되는 코드 */
const INTERNAL_ERROR_CODES = new Set<AppErrorCode>([
  AppErrorCode.INTERNAL,
  AppErrorCode.DB_UNAVAILABLE,
]);

/** 코드별 사용자 노출 메시지 (한국어) */
export const APP_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [AppErrorCode.VALIDATION]: '입력값을 확인해 주세요.',
  [AppErrorCode.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [AppErrorCode.CONFLICT]: '요청을 처리할 수 없습니다. 이미 존재하는 데이터입니다.',
  [AppErrorCode.INTERNAL]: USER_FACING_SERVER_ERROR_MESSAGE,
  [AppErrorCode.DB_UNAVAILABLE]: USER_FACING_SERVER_ERROR_MESSAGE,
  [AppErrorCode.RATE_LIMIT]: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',

  [AppErrorCode.AUTH_UNAUTHORIZED]: '로그인이 필요합니다.',
  [AppErrorCode.AUTH_INVALID_CREDENTIALS]: '아이디 또는 비밀번호가 올바르지 않습니다.',
  [AppErrorCode.AUTH_SOCIAL_ONLY]: '소셜 로그인으로 가입한 계정입니다. 소셜 로그인을 이용해 주세요.',
  [AppErrorCode.AUTH_INVALID_REFRESH]: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  [AppErrorCode.AUTH_INVALID_ACCESS]: '인증 정보가 유효하지 않습니다.',
  [AppErrorCode.AUTH_LOGIN_REQUIRED]: '아이디와 비밀번호를 입력해 주세요.',

  [AppErrorCode.AUTH_USERNAME_INVALID]: '아이디 형식이 올바르지 않습니다.',
  [AppErrorCode.AUTH_USERNAME_TAKEN]: '이미 사용 중인 아이디입니다.',
  [AppErrorCode.AUTH_EMAIL_INVALID]: '올바른 이메일 형식이 아닙니다.',
  [AppErrorCode.AUTH_EMAIL_TAKEN]: '이미 사용 중인 이메일입니다.',
  [AppErrorCode.AUTH_PASSWORD_INVALID]: '비밀번호 형식이 올바르지 않습니다.',
  [AppErrorCode.AUTH_PASSWORD_MISMATCH]: '비밀번호 확인이 일치하지 않습니다.',
  [AppErrorCode.AUTH_PASSWORD_CONFIRM_REQUIRED]: '비밀번호 확인을 입력해 주세요.',
  [AppErrorCode.AUTH_REGISTER_FIELDS_REQUIRED]: '회원가입 필수 항목을 모두 입력해 주세요.',

  [AppErrorCode.AUTH_OAUTH_PROVIDER_INVALID]: '지원하지 않는 소셜 로그인입니다.',
  [AppErrorCode.AUTH_OAUTH_NOT_CONFIGURED]: '소셜 로그인이 아직 설정되지 않았습니다.',
  [AppErrorCode.AUTH_OAUTH_STATE_INVALID]: '소셜 로그인 인증이 만료되었습니다. 다시 시도해 주세요.',
  [AppErrorCode.AUTH_OAUTH_FAILED]: '소셜 로그인에 실패했습니다. 다시 시도해 주세요.',

  [AppErrorCode.AUTH_TOKEN_INVALID]: '링크가 유효하지 않거나 만료되었습니다.',
  [AppErrorCode.AUTH_CURRENT_PASSWORD_INVALID]: '현재 비밀번호가 올바르지 않습니다.',
  [AppErrorCode.AUTH_OAUTH_UNLINK_FORBIDDEN]: '다른 로그인 수단을 먼저 설정해 주세요.',
  [AppErrorCode.AUTH_EMAIL_REQUIRED]: '이메일이 필요합니다.',

  [AppErrorCode.CASH_INSUFFICIENT]: '가용 현금이 부족합니다.',
  [AppErrorCode.CASH_AMOUNT_INVALID]: '금액을 확인해 주세요.',

  [AppErrorCode.STOCK_REQUIRED]: '종목을 검색해서 선택해 주세요.',
  [AppErrorCode.HOLDING_INSUFFICIENT]: '보유 수량이 부족합니다.',
  [AppErrorCode.TRANSACTION_QUANTITY_INVALID]: '수량은 0보다 커야 합니다.',
  [AppErrorCode.TRANSACTION_PRICE_INVALID]: '단가는 0보다 커야 합니다.',

  [AppErrorCode.AUTH_OAUTH_REDIRECT_URI_REQUIRED]: 'OAuth redirect URI가 필요합니다.',
  [AppErrorCode.AUTH_OAUTH_CODE_STATE_REQUIRED]: 'OAuth code와 state가 필요합니다.',
};

const CODE_SET = new Set<string>(Object.values(AppErrorCode));

export function isAppErrorCode(value: string): value is AppErrorCode {
  return CODE_SET.has(value);
}

export function isInternalAppErrorCode(code: AppErrorCode): boolean {
  return INTERNAL_ERROR_CODES.has(code);
}

/**
 * 사용자에게 보여줄 메시지.
 * INTERNAL·DB_UNAVAILABLE 등은 서버 message를 무시하고 일반 안내만 반환.
 */
export function resolveAppErrorMessage(
  code: AppErrorCode | string | undefined,
  serverMessage?: string,
): string {
  if (!code || !isAppErrorCode(code)) {
    return USER_FACING_SERVER_ERROR_MESSAGE;
  }

  if (isInternalAppErrorCode(code)) {
    return USER_FACING_SERVER_ERROR_MESSAGE;
  }

  if (serverMessage?.trim()) return serverMessage.trim();
  return APP_ERROR_MESSAGES[code];
}

export function apiErrorBody(
  code: AppErrorCode,
  message?: string,
): ApiErrorBody {
  return { code, message: resolveAppErrorMessage(code, message) };
}
