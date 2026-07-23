import { AppErrorCode, AppSuccessCode, apiSuccessBody } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:change-email', 'authRegister');
    const user = requireAuth(req);
    const body = (await req.json()) as { email?: string };
    if (!body.email?.trim()) throw new ValidationError(AppErrorCode.AUTH_EMAIL_REQUIRED);

    const { changeEmailUseCase } = getServerServices();
    const result = await changeEmailUseCase.execute({ userId: user.userId, email: body.email });
    return jsonData(
      apiSuccessBody(AppSuccessCode.AUTH_EMAIL_VERIFICATION_ISSUED, {
        verificationCode: result.verificationCode,
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
