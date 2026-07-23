import { AppErrorCode, AppSuccessCode, apiSuccessBody } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:reset-password', 'authRegister');
    const body = (await req.json()) as {
      token?: string;
      password?: string;
      passwordConfirm?: string;
    };

    if (!body.token || !body.password || body.passwordConfirm === undefined) {
      throw new ValidationError(AppErrorCode.AUTH_REGISTER_FIELDS_REQUIRED);
    }

    const { resetPasswordUseCase } = getServerServices();
    await resetPasswordUseCase.execute({
      token: body.token,
      password: body.password,
      passwordConfirm: body.passwordConfirm,
    });
    return jsonData(apiSuccessBody(AppSuccessCode.AUTH_PASSWORD_RESET_COMPLETE));
  } catch (error) {
    return handleRouteError(error);
  }
}
