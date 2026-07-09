import { NextRequest } from 'next/server';
import { isOAuthProvider } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

type RouteContext = { params: Promise<{ provider: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = requireAuth(req);
    const { provider } = await context.params;
    if (!isOAuthProvider(provider)) {
      throw new ValidationError('지원하지 않는 OAuth 제공자입니다.');
    }

    const { unlinkOAuthAccountUseCase } = getServerServices();
    await unlinkOAuthAccountUseCase.execute(user.userId, provider);
    return jsonData({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
