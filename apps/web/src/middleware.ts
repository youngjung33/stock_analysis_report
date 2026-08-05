import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  GUEST_SESSION_COOKIE,
  LOCALE_COOKIE_KEY,
  REFRESH_TOKEN_COOKIE,
  isPublicPagePath,
  type SupportedLocale,
} from '@sar/shared';

function localeFromAcceptLanguage(header: string | null): SupportedLocale {
  if (!header) return DEFAULT_LOCALE;
  const lower = header.toLowerCase();
  if (lower.includes('ko')) return 'ko';
  if (lower.includes('en')) return 'en';
  return DEFAULT_LOCALE;
}

function hasAppSession(request: NextRequest): boolean {
  if (request.cookies.get(REFRESH_TOKEN_COOKIE)?.value) return true;
  return request.cookies.get(GUEST_SESSION_COOKIE)?.value === '1';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isPublicPagePath(pathname) && !hasAppSession(request)) {
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
