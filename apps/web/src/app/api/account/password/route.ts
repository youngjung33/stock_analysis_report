import { AppErrorCode, AppSuccessCode, apiSuccessBody } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:change-password', 'authLogin');
    const user = requireAuth(req);
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
      newPasswordConfirm?: string;
    };

    if (!body.currentPassword || !body.newPassword || body.newPasswordConfirm === undefined) {
      throw new ValidationError(AppErrorCode.AUTH_REGISTER_FIELDS_REQUIRED);
    }

    const { changePasswordUseCase } = getServerServices();
    await changePasswordUseCase.execute({
      userId: user.userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      newPasswordConfirm: body.newPasswordConfirm,
    });
    return jsonData(apiSuccessBody(AppSuccessCode.ACCOUNT_PASSWORD_CHANGED));
  } catch (error) {
    return handleRouteError(error);
  }
}
