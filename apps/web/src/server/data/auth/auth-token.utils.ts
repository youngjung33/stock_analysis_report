import { createHash, randomBytes, randomInt } from 'crypto';
import { AuthTokenType, AUTH_TOKEN_TTL_MS } from '@sar/shared';

export function generateAuthTokenRaw(): string {
  return randomBytes(32).toString('hex');
}

/** 6자리 이메일 인증 코드 (임시: 클라이언트 toast로 전달) */
export function generateEmailVerificationCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export function isEmailVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function hashAuthToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function authTokenExpiresAt(type: AuthTokenType): Date {
  return new Date(Date.now() + AUTH_TOKEN_TTL_MS[type]);
}

export function buildAppUrl(path: string): string {
  const base = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
