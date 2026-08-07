import { NextRequest, NextResponse } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError } from '@/server/http/route-utils';

/** 링크 기반 이메일 인증 — 6자리 code 쿼리 또는 설정 화면 POST confirm-email */
export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'auth:verify-email-link', 'authVerifyEmail');
    const code = req.nextUrl.searchParams.get('code')?.trim();
    if (!code) {
      return NextResponse.redirect(new URL('/settings?verifyError=1', req.url));
    }

    const { verifyEmailUseCase } = getServerServices();
    await verifyEmailUseCase.execute(code);
    return NextResponse.redirect(new URL('/settings?verified=1', req.url));
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.redirect(new URL('/settings?verifyError=1', req.url));
    }
    return handleRouteError(error);
  }
}
