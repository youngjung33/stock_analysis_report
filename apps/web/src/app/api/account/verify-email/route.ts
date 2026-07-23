import { AppSuccessCode, apiSuccessBody } from '@sar/shared';
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
      return jsonData(apiSuccessBody(AppSuccessCode.AUTH_EMAIL_ALREADY_VERIFIED));
    }
    return jsonData(
      apiSuccessBody(AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED, {
        verificationCode: result.verificationCode,
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
