import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:forgot-password', 'authRegister');
    const body = (await req.json()) as { email?: string };
    if (!body.email?.trim()) throw new ValidationError('email is required');

    const { requestPasswordResetUseCase } = getServerServices();
    await requestPasswordResetUseCase.execute(body.email);
    return jsonData({
      ok: true,
      message: '등록된 이메일이 있으면 비밀번호 재설정 링크를 보냈습니다.',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
