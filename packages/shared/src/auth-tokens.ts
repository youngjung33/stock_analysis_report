/** 이메일 인증·비밀번호 재설정 토큰 종류 */
export const AuthTokenType = {
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type AuthTokenType = (typeof AuthTokenType)[keyof typeof AuthTokenType];

export const AUTH_TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};
