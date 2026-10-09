import { NextRequest } from 'next/server';
import { AppErrorCode, isOAuthProvider } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';
import { ValidationError } from '@/server/domain/errors/domain.errors';

type RouteContext = { params: Promise<{ provider: string }> };

/** OAuth authorize URL 발급 */
export async function GET(req: NextRequest, context: RouteContext) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:oauth-start', 'authOAuthStart');
    const { provider } = await context.params;
    if (!isOAuthProvider(provider)) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_PROVIDER_INVALID);
    }

    const redirectUri =
      req.nextUrl.searchParams.get('redirectUri') ??
      `${req.nextUrl.origin}/api/auth/oauth/${provider}/callback`;

    const { startOAuthLoginUseCase } = getServerServices();
    const result = await startOAuthLoginUseCase.execute({
      provider,
      redirectUri,
      allowedOrigin: req.nextUrl.origin,
    });
    return jsonData(result);
  });
}
