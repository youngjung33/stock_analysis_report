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
      throw new ValidationError('token, password, passwordConfirm are required');
    }

    const { resetPasswordUseCase } = getServerServices();
    await resetPasswordUseCase.execute({
      token: body.token,
      password: body.password,
      passwordConfirm: body.passwordConfirm,
    });
    return jsonData({ ok: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
