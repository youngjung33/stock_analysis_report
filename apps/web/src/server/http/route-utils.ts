import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, AppErrorCode, REFRESH_TOKEN_COOKIE } from '@sar/shared';
import { getServerServices } from '../container';
import { AccessTokenPayload } from '../domain/auth.types';
import { AuthenticationError } from '../domain/errors/domain.errors';

export { handleRouteError } from './route-error';
export type { AccessTokenPayload } from '../domain/auth.types';

export interface AuthUser {
  userId: string;
  username: string;
}

export function jsonData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function getRefreshToken(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
}

function accessTokenMaxAgeSeconds(): number {
  const raw = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 15 * 60;
  const value = Number(match[1]);
  switch (match[2]) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 15 * 60;
  }
}

function cookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };
}

export function setRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set(REFRESH_TOKEN_COOKIE, token, {
    ...cookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', { ...cookieBaseOptions(), maxAge: 0 });
}

/** httpOnly access token — XSS로 JS에서 읽을 수 없음 */
export function setAccessCookie(res: NextResponse, token: string) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, token, {
    ...cookieBaseOptions(),
    maxAge: accessTokenMaxAgeSeconds(),
  });
}

export function clearAccessCookie(res: NextResponse) {
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', { ...cookieBaseOptions(), maxAge: 0 });
}

/** httpOnly cookie 우선, 없으면 Authorization Bearer (API 클라이언트·테스트용) */
export function extractAccessToken(req: NextRequest): string | null {
  const fromCookie = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * JWT access token 검증 — userId는 payload.sub만 신뢰 (요청 body/query userId 무시)
 */
export function requireAuth(req: NextRequest): AuthUser {
  const token = extractAccessToken(req);
  if (!token) {
    throw new AuthenticationError(AppErrorCode.AUTH_UNAUTHORIZED);
  }
  const { tokenService } = getServerServices();
  const payload = tokenService.verifyAccessToken(token);
  return { userId: payload.sub, username: payload.username };
}
