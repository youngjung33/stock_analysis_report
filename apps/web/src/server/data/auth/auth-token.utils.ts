import { createHash, randomBytes } from 'crypto';
import { AuthTokenType, AUTH_TOKEN_TTL_MS } from '@sar/shared';

export function generateAuthTokenRaw(): string {
  return randomBytes(32).toString('hex');
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
