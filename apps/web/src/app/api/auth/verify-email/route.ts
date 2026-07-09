import { NextRequest, NextResponse } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

/** 이메일 인증 링크 — 성공 시 설정 페이지로 redirect */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) throw new ValidationError('token query is required');

    const { verifyEmailUseCase } = getServerServices();
    await verifyEmailUseCase.execute(token);

    return NextResponse.redirect(new URL('/settings?verified=1', req.url));
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.redirect(new URL('/settings?verifyError=1', req.url));
    }
    return handleRouteError(error);
  }
}
