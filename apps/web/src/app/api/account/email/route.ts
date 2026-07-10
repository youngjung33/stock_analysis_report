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
    if (!body.email?.trim()) throw new ValidationError('email is required');

    const { changeEmailUseCase } = getServerServices();
    const result = await changeEmailUseCase.execute({ userId: user.userId, email: body.email });
    return jsonData({
      ok: true,
      verificationCode: result.verificationCode,
      message: '인증 코드가 발급되었습니다.',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
