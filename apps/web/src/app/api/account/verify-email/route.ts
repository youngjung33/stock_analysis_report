import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:verify-email-request', 'authRegister');
    const user = requireAuth(req);
    const { requestEmailVerificationUseCase } = getServerServices();
    const result = await requestEmailVerificationUseCase.execute(user.userId);
    if (!result) {
      return jsonData({ ok: true, message: '이미 인증된 이메일입니다.' });
    }
    return jsonData({
      ok: true,
      verificationCode: result.verificationCode,
      message: '인증 코드가 발급되었습니다.',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
