import { OAUTH_PROVIDER_META, OAUTH_PROVIDERS } from '@sar/shared';
import { getServerServices } from '@/server/container';
import { handleRouteError, jsonData } from '@/server/http/route-utils';

/** 설정된 OAuth 제공자 + 공식 버튼 메타 */
export async function GET() {
  try {
    const { oauthProvider } = getServerServices();
    const providers = OAUTH_PROVIDERS.filter((id) => oauthProvider.isConfigured(id)).map(
      (id) => OAUTH_PROVIDER_META[id],
    );
    return jsonData({ providers });
  } catch (error) {
    return handleRouteError(error);
  }
}
