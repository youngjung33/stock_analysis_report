import { AppErrorCode, AppSuccessCode, apiSuccessBody } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:forgot-password', 'authRegister');
    const body = (await req.json()) as { email?: string };
    if (!body.email?.trim()) throw new ValidationError(AppErrorCode.AUTH_EMAIL_REQUIRED);

    const { requestPasswordResetUseCase } = getServerServices();
    await requestPasswordResetUseCase.execute(body.email);
    return jsonData(
      apiSuccessBody(AppSuccessCode.AUTH_PASSWORD_RESET_REQUESTED),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
