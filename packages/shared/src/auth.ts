/** SSO OAuth 제공자 (4종) */
import { AppErrorCode, APP_ERROR_MESSAGES, type ApiErrorBody } from './app-error-codes';

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  NAVER = 'NAVER',
  KAKAO = 'KAKAO',
}

export const OAUTH_PROVIDERS = [
  OAuthProvider.GOOGLE,
  OAuthProvider.APPLE,
  OAuthProvider.NAVER,
  OAuthProvider.KAKAO,
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number];

export interface OAuthProviderMeta {
  id: OAuthProviderId;
  label: string;
  signInButtonSrc: string;
  /** @deprecated UI uses auth.oauth.signIn.{id} locale key */
  signInButtonAlt: string;
}

export const OAUTH_PROVIDER_META: Record<OAuthProviderId, OAuthProviderMeta> = {
  [OAuthProvider.GOOGLE]: {
    id: OAuthProvider.GOOGLE,
    label: 'Google',
    signInButtonSrc:
      'https://developers.google.com/static/identity/images/branding_guideline_sample_dk_rd_lg.svg',
    signInButtonAlt: 'Google로 로그인',
  },
  [OAuthProvider.APPLE]: {
    id: OAuthProvider.APPLE,
    label: 'Apple',
    signInButtonSrc:
      'https://appleid.cdn-apple.com/appleid/button/sign-in-with-apple-logo.svg',
    signInButtonAlt: 'Apple로 로그인',
  },
  [OAuthProvider.NAVER]: {
    id: OAuthProvider.NAVER,
    label: 'Naver',
    signInButtonSrc: 'https://static.nid.naver.com/oauth/small/btnG_완성형.png',
    signInButtonAlt: '네이버로 로그인',
  },
  [OAuthProvider.KAKAO]: {
    id: OAuthProvider.KAKAO,
    label: 'Kakao',
    signInButtonSrc:
      'https://developers.kakao.com/tool/resource/static/img/button/ko/kakao_login_medium_narrow.png',
    signInButtonAlt: '카카오로 로그인',
  },
};

export interface RegisterInput {
  username: string;
  password: string;
  passwordConfirm: string;
  email?: string | null;
}

export interface OAuthUserProfile {
  provider: OAuthProviderId;
  providerUserId: string;
  email: string | null;
  displayName: string | null;
}

export type RegisterField = 'username' | 'password' | 'passwordConfirm' | 'email';

export type RegisterFieldErrors = Partial<Record<RegisterField, AppErrorCode>>;

/** UI 안내 문구 */
export const AUTH_USERNAME_HINT = '3~32자, 영문·숫자·밑줄(_)';
export const AUTH_PASSWORD_HINT = '8~64자, 영문과 숫자 각 1자 이상';

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9!@#$%^&*()_+\-=]{8,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isOAuthProvider(value: string): value is OAuthProviderId {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export function validateUsernameFormat(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) return '아이디를 입력해 주세요.';
  if (!USERNAME_PATTERN.test(trimmed)) {
    return `아이디는 ${AUTH_USERNAME_HINT}만 사용할 수 있습니다.`;
  }
  return null;
}

/** 아이디 형식 검증 — API 응답 code용 */
export function validateUsernameFormatCode(username: string): AppErrorCode | null {
  const trimmed = username.trim();
  if (!trimmed) return AppErrorCode.AUTH_USERNAME_INVALID;
  if (!USERNAME_PATTERN.test(trimmed)) return AppErrorCode.AUTH_USERNAME_INVALID;
  return null;
}

export function validatePasswordFormat(password: string): string | null {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (password.length < 8) {
    return `비밀번호는 ${AUTH_PASSWORD_HINT}이어야 합니다.`;
  }
  if (password.length > 64) {
    return '비밀번호는 64자 이하여야 합니다.';
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return `비밀번호는 ${AUTH_PASSWORD_HINT}이어야 합니다.`;
  }
  return null;
}

export function validatePasswordFormatCode(password: string): AppErrorCode | null {
  if (!password) return AppErrorCode.AUTH_PASSWORD_INVALID;
  if (password.length < 8 || password.length > 64) return AppErrorCode.AUTH_PASSWORD_INVALID;
  if (!PASSWORD_PATTERN.test(password)) return AppErrorCode.AUTH_PASSWORD_INVALID;
  return null;
}

export function validateRegisterFields(input: RegisterInput): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const username = input.username.trim();
  const email = input.email?.trim() ?? '';

  const usernameError = validateUsernameFormatCode(username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePasswordFormatCode(input.password);
  if (passwordError) errors.password = passwordError;

  if (!input.passwordConfirm) {
    errors.passwordConfirm = AppErrorCode.AUTH_PASSWORD_CONFIRM_REQUIRED;
  } else if (input.passwordConfirm !== input.password) {
    errors.passwordConfirm = AppErrorCode.AUTH_PASSWORD_MISMATCH;
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = AppErrorCode.AUTH_EMAIL_INVALID;
  }

  return errors;
}

export function validateRegisterInput(input: RegisterInput): AppErrorCode | null {
  const errors = validateRegisterFields(input);
  return Object.values(errors)[0] ?? null;
}

export function validateLoginInput(username: string, password: string): AppErrorCode | null {
  if (!username.trim() || !password.trim()) {
    return AppErrorCode.AUTH_LOGIN_REQUIRED;
  }
  return null;
}

export function proposeUsernameFromOAuthProfile(profile: OAuthUserProfile): string {
  const fromDisplay = sanitizeUsername(profile.displayName);
  if (fromDisplay) return fromDisplay;

  if (profile.email) {
    const local = sanitizeUsername(profile.email.split('@')[0] ?? '');
    if (local) return local;
  }

  const prefix = profile.provider.toLowerCase();
  const suffix = profile.providerUserId.replace(/\W/g, '').slice(0, 8) || 'user';
  return `${prefix}_${suffix}`.slice(0, 32);
}

function sanitizeUsername(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32);
  if (cleaned.length < 3) return null;
  return cleaned;
}

export function withUsernameSuffix(base: string, attempt: number): string {
  const suffix = `_${attempt}`;
  const maxBase = 32 - suffix.length;
  return `${base.slice(0, maxBase)}${suffix}`;
}

/** 회원가입 필드 검증 → API 에러 코드 */
export function getRegisterValidationError(input: RegisterInput): ApiErrorBody | null {
  const fields = validateRegisterFields(input);
  if (fields.username) {
    return { code: fields.username, message: APP_ERROR_MESSAGES[fields.username] };
  }
  if (fields.password) {
    return { code: fields.password, message: APP_ERROR_MESSAGES[fields.password] };
  }
  if (fields.passwordConfirm) {
    return { code: fields.passwordConfirm, message: APP_ERROR_MESSAGES[fields.passwordConfirm] };
  }
  if (fields.email) {
    return { code: fields.email, message: APP_ERROR_MESSAGES[fields.email] };
  }
  return null;
}
