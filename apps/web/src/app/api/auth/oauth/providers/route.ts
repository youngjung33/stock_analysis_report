import { NextRequest } from 'next/server';
import { OAUTH_PROVIDER_META, OAUTH_PROVIDERS } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { enforceRateLimit } from '@/server/http/rate-limit';
import { jsonData, runApiRoute } from '@/server/http/route-utils';

/** 설정된 OAuth 제공자 + 공식 버튼 메타 */
export async function GET(req: NextRequest) {
  return runApiRoute(async () => {
    await enforceRateLimit(req, 'auth:oauth-providers', 'authOAuthProviders');
    const { oauthProvider } = getServerServices();
    const providers = OAUTH_PROVIDERS.filter((id) => oauthProvider.isConfigured(id)).map(
      (id) => OAUTH_PROVIDER_META[id],
    );
    return jsonData({ providers });
  });
}
