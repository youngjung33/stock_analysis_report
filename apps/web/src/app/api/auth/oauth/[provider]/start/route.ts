import { NextRequest } from 'next/server';
import { isOAuthProvider } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { handleRouteError, jsonData } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

type RouteContext = { params: Promise<{ provider: string }> };

/** OAuth authorize URL 발급 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    enforceRateLimit(req, 'auth:oauth-start', 'authOAuthStart');
    const { provider } = await context.params;
    if (!isOAuthProvider(provider)) {
      throw new ValidationError('지원하지 않는 OAuth 제공자입니다.');
    }

    const redirectUri =
      req.nextUrl.searchParams.get('redirectUri') ??
      `${req.nextUrl.origin}/api/auth/oauth/${provider}/callback`;

    const { startOAuthLoginUseCase } = getServerServices();
    const result = await startOAuthLoginUseCase.execute({ provider, redirectUri });
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
