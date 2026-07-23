import { NextRequest, NextResponse } from 'next/server';
import { AppErrorCode, isOAuthProvider } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { logApiError } from '@/server/http/route-error';
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
  let provider = 'unknown';

  try {
    const params = await context.params;
    provider = params.provider;

    if (!isOAuthProvider(provider)) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_PROVIDER_INVALID);
    }

    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const oauthError = req.nextUrl.searchParams.get('error');

    if (oauthError) {
      logApiError(new Error(`OAuth provider returned error: ${oauthError}`), {
        route: 'oauth/callback',
        provider,
        oauthError,
      });
      return NextResponse.redirect(new URL(`/login?oauthError=${oauthError}`, req.url));
    }

    if (!code || !state) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_CODE_STATE_REQUIRED);
    }

    const { completeOAuthLoginUseCase } = getServerServices();
    const result = await completeOAuthLoginUseCase.execute({ provider, code, state });

    const redirectTo = result.isNewUser ? '/?welcome=1' : '/';
    const res = NextResponse.redirect(new URL(redirectTo, req.url));
    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    return res;
  } catch (error) {
    logApiError(error, { route: 'oauth/callback', provider });
    const res = NextResponse.redirect(new URL('/login?oauthError=auth_failed', req.url));
    clearAccessCookie(res);
    clearRefreshCookie(res);
    return res;
  }
}
