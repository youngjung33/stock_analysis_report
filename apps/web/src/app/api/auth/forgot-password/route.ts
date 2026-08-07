import { AppErrorCode, AppSuccessCode, apiSuccessBody } from '@sar/shared';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getServerServices } from '@/server/container';
import { getServerLocale } from '@/i18n/server-metadata';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, 'auth:forgot-password', 'authRegister');
    const body = (await req.json()) as { email?: string };
    if (!body.email?.trim()) throw new ValidationError(AppErrorCode.AUTH_EMAIL_REQUIRED);

    const cookieStore = await cookies();
    const locale = getServerLocale(cookieStore);

    const { requestPasswordResetUseCase } = getServerServices();
    await requestPasswordResetUseCase.execute(body.email, locale);
    return jsonData(
      apiSuccessBody(AppSuccessCode.AUTH_PASSWORD_RESET_REQUESTED),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
