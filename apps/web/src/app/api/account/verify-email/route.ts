import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:verify-email-request', 'authRegister');
    const user = requireAuth(req);
    const { requestEmailVerificationUseCase } = getServerServices();
    await requestEmailVerificationUseCase.execute(user.userId);
    return jsonData({ ok: true, message: '인증 메일을 발송했습니다.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
