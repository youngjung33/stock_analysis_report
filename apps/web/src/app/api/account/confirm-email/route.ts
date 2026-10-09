import { AppErrorCode, AppSuccessCode, apiSuccessBody } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, requireAuth, runApiRoute } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:confirm-email', 'authVerifyEmail');
    requireAuth(req);
    const body = (await req.json()) as { code?: string };
    if (!body.code?.trim()) throw new ValidationError(AppErrorCode.VALIDATION);

    const { verifyEmailUseCase } = getServerServices();
    await verifyEmailUseCase.execute(body.code);
    return jsonData(apiSuccessBody(AppSuccessCode.AUTH_EMAIL_VERIFIED));
  });
}
