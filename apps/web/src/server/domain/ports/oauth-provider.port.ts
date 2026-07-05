import { OAuthProviderId, OAuthUserProfile } from '@sar/shared';

/** OAuth authorization code 교환 및 authorize URL 생성 port */
export interface IOAuthProviderPort {
  isConfigured(provider: OAuthProviderId): boolean;
  buildAuthorizationUrl(input: {
    provider: OAuthProviderId;
    redirectUri: string;
    state: string;
  }): string;
  exchangeAuthorizationCode(input: {
    provider: OAuthProviderId;
    code: string;
    redirectUri: string;
  }): Promise<OAuthUserProfile>;
}
