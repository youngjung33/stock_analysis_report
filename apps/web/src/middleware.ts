import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  DEFAULT_LOCALE,
  GUEST_SESSION_COOKIE,
  LOCALE_COOKIE_KEY,
  REFRESH_TOKEN_COOKIE,
  isJwtNotExpired,
  isPlausibleRefreshToken,
  isPublicPagePath,
  verifyGuestSessionToken,
  type SupportedLocale,
} from '@sar/shared';

function localeFromAcceptLanguage(header: string | null): SupportedLocale {
  if (!header) return DEFAULT_LOCALE;
  const lower = header.toLowerCase();
  if (lower.includes('ko')) return 'ko';
  if (lower.includes('en')) return 'en';
  return DEFAULT_LOCALE;
}

function guestSessionSecret(): string | null {
  const dedicated = process.env.GUEST_SESSION_SECRET?.trim();
  if (dedicated) return dedicated;
  return process.env.JWT_ACCESS_SECRET?.trim() ?? null;
}

async function hasAppSession(request: NextRequest): Promise<boolean> {
  const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (isPlausibleRefreshToken(refresh)) return true;

  const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (isJwtNotExpired(access)) return true;

  const guestToken = request.cookies.get(GUEST_SESSION_COOKIE)?.value;
  const secret = guestSessionSecret();
  if (guestToken && secret) {
    return verifyGuestSessionToken(guestToken, secret);
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isPublicPagePath(pathname) && !(await hasAppSession(request))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  const existing = request.cookies.get(LOCALE_COOKIE_KEY)?.value;

  if (!existing) {
    const locale = localeFromAcceptLanguage(request.headers.get('accept-language'));
    response.cookies.set(LOCALE_COOKIE_KEY, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
