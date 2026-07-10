import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

export async function POST(req: NextRequest) {
  try {
    enforceRateLimit(req, 'auth:confirm-email', 'authRegister');
    requireAuth(req);
    const body = (await req.json()) as { code?: string };
    if (!body.code?.trim()) throw new ValidationError('code is required');

    const { verifyEmailUseCase } = getServerServices();
    await verifyEmailUseCase.execute(body.code);
    return jsonData({ ok: true, message: '이메일 인증이 완료되었습니다.' });
  } catch (error) {
    return handleRouteError(error);
  }
}
