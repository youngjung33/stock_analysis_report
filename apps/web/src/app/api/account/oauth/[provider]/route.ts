import { AppErrorCode, AppSuccessCode, apiSuccessBody, isOAuthProvider } from '@sar/shared';
import { NextRequest } from 'next/server';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData, requireAuth } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

type RouteContext = { params: Promise<{ provider: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = requireAuth(req);
    const { provider } = await context.params;
    if (!isOAuthProvider(provider)) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_PROVIDER_INVALID);
    }

    const { unlinkOAuthAccountUseCase } = getServerServices();
    await unlinkOAuthAccountUseCase.execute(user.userId, provider);
    return jsonData(apiSuccessBody(AppSuccessCode.ACCOUNT_OAUTH_UNLINKED));
  } catch (error) {
    return handleRouteError(error);
  }
}
