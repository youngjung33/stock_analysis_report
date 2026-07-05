import { NextRequest, NextResponse } from 'next/server';
import { isOAuthProvider } from '@sar/shared';
import { getServerServices } from '@/server/container';
import {
  clearAccessCookie,
  clearRefreshCookie,
  setAccessCookie,
  setRefreshCookie,
} from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

type RouteContext = { params: Promise<{ provider: string }> };

/** OAuth callback — 세션 쿠키 발급 후 앱으로 redirect */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!isOAuthProvider(provider)) {
      throw new ValidationError('지원하지 않는 OAuth 제공자입니다.');
    }

    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const oauthError = req.nextUrl.searchParams.get('error');

    if (oauthError) {
      const res = NextResponse.redirect(new URL(`/login?oauthError=${oauthError}`, req.url));
      return res;
    }

    if (!code || !state) {
      throw new ValidationError('OAuth code와 state가 필요합니다.');
    }

    const { completeOAuthLoginUseCase } = getServerServices();
    const result = await completeOAuthLoginUseCase.execute({ provider, code, state });

    const redirectTo = result.isNewUser ? '/?welcome=1' : '/';
    const res = NextResponse.redirect(new URL(redirectTo, req.url));
    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    return res;
  } catch (error) {
    const res = NextResponse.redirect(new URL('/login?oauthError=auth_failed', req.url));
    clearAccessCookie(res);
    clearRefreshCookie(res);
    return res;
  }
}
