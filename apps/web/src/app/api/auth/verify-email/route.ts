import { NextRequest, NextResponse } from 'next/server';
import { handleRouteError } from '@/server/http/route-utils';

/**
 * TODO: EmailSender 연동 후 링크 기반 인증 복구.
 * 현재는 6자리 인증 코드 + POST /api/account/confirm-email 사용.
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.redirect(new URL('/settings?verifyError=1', req.url));
  } catch (error) {
    return handleRouteError(error);
  }
}
