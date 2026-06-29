import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@sar/shared';
import { getServerServices } from '../container';
import {
  AuthenticationError,
  DomainError,
  EntityNotFoundError,
  ValidationError,
} from '../domain/errors/domain.errors';
import { HttpError } from './errors';

export interface AuthUser {
  userId: string;
  username: string;
}

export function jsonData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** DomainError → HTTP status 매핑 */
export function handleRouteError(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (error instanceof EntityNotFoundError) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
  if (error instanceof DomainError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.statusCode });
  }
  console.error(error);
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}

export function getRefreshToken(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
}

export function setRefreshCookie(res: NextResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/** Bearer JWT 검증 — composition root의 ITokenService 사용 */
export function requireAuth(req: NextRequest): AuthUser {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Unauthorized');
  }
  const token = header.slice(7);
  const { tokenService } = getServerServices();
  const payload = tokenService.verifyAccessToken(token);
  return { userId: payload.sub, username: payload.username };
}
