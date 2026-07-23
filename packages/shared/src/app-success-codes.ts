/** API·클라이언트 공통 성공 응답 코드 */
export const AppSuccessCode = {
  AUTH_USERNAME_AVAILABLE: 'AUTH_USERNAME_AVAILABLE',
  AUTH_EMAIL_ALREADY_VERIFIED: 'AUTH_EMAIL_ALREADY_VERIFIED',
  AUTH_EMAIL_VERIFICATION_ISSUED: 'AUTH_EMAIL_VERIFICATION_ISSUED',
  AUTH_EMAIL_VERIFIED: 'AUTH_EMAIL_VERIFIED',
  AUTH_PASSWORD_RESET_REQUESTED: 'AUTH_PASSWORD_RESET_REQUESTED',
  AUTH_PASSWORD_CHANGED: 'AUTH_PASSWORD_CHANGED',
  AUTH_PASSWORD_RESET_COMPLETE: 'AUTH_PASSWORD_RESET_COMPLETE',
  ACCOUNT_PASSWORD_CHANGED: 'ACCOUNT_PASSWORD_CHANGED',
  ACCOUNT_OAUTH_UNLINKED: 'ACCOUNT_OAUTH_UNLINKED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
} as const;

export type AppSuccessCode = (typeof AppSuccessCode)[keyof typeof AppSuccessCode];

export interface ApiSuccessBody {
  ok: true;
  code: AppSuccessCode;
}

/** 클라이언트·repository 공통 성공 결과 */
export interface ApiSuccessResult {
  code: AppSuccessCode;
}

/** 코드별 한국어 fallback (i18n 미적용·테스트용) */
export const APP_SUCCESS_MESSAGES: Record<AppSuccessCode, string> = {
  [AppSuccessCode.AUTH_USERNAME_AVAILABLE]: '사용 가능한 아이디입니다.',
  [AppSuccessCode.AUTH_EMAIL_ALREADY_VERIFIED]: '이미 인증된 이메일입니다.',
  [AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED]: '인증 코드가 발급되었습니다.',
  [AppSuccessCode.AUTH_EMAIL_VERIFIED]: '이메일 인증이 완료되었습니다.',
  [AppSuccessCode.AUTH_PASSWORD_RESET_REQUESTED]:
    '등록된 이메일이 있으면 비밀번호 재설정 링크를 보냈습니다.',
  [AppSuccessCode.AUTH_PASSWORD_CHANGED]: '비밀번호가 변경되었습니다.',
  [AppSuccessCode.AUTH_PASSWORD_RESET_COMPLETE]: '비밀번호가 변경되었습니다. 로그인해 주세요.',
  [AppSuccessCode.ACCOUNT_PASSWORD_CHANGED]: '비밀번호가 변경되었습니다.',
  [AppSuccessCode.ACCOUNT_OAUTH_UNLINKED]: '소셜 계정 연동을 해제했습니다.',
  [AppSuccessCode.ACCOUNT_DELETED]: '회원탈퇴가 완료되었습니다.',
};

const SUCCESS_CODE_SET = new Set<string>(Object.values(AppSuccessCode));

export function isAppSuccessCode(value: string): value is AppSuccessCode {
  return SUCCESS_CODE_SET.has(value);
}

export function resolveAppSuccessMessage(code: AppSuccessCode | string | undefined): string {
  if (!code || !isAppSuccessCode(code)) {
    return APP_SUCCESS_MESSAGES[AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED];
  }
  return APP_SUCCESS_MESSAGES[code];
}

export function apiSuccessBody(
  code: AppSuccessCode,
  extra?: Record<string, unknown>,
): ApiSuccessBody & Record<string, unknown> {
  return { ok: true, code, ...extra };
}
