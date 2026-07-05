import {
  OAuthProvider,
  OAuthProviderId,
  OAuthUserProfile,
} from '@sar/shared';
import { ValidationError } from '../../domain/errors/domain.errors';
import { IOAuthProviderPort } from '../../domain/ports/oauth-provider.port';

type ProviderConfig = {
  clientId: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  profileUrl?: string;
  extraAuthParams?: Record<string, string>;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function providerConfig(provider: OAuthProviderId): ProviderConfig | null {
  switch (provider) {
    case OAuthProvider.GOOGLE: {
      const clientId = env('GOOGLE_CLIENT_ID');
      const clientSecret = env('GOOGLE_CLIENT_SECRET');
      if (!clientId || !clientSecret) return null;
      return {
        clientId,
        clientSecret,
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'openid email profile',
        profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        extraAuthParams: { access_type: 'online', prompt: 'select_account' },
      };
    }
    case OAuthProvider.APPLE: {
      const clientId = env('APPLE_CLIENT_ID');
      if (!clientId) return null;
      return {
        clientId,
        authorizeUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        scope: 'name email',
        extraAuthParams: { response_mode: 'query' },
      };
    }
    case OAuthProvider.NAVER: {
      const clientId = env('NAVER_CLIENT_ID');
      const clientSecret = env('NAVER_CLIENT_SECRET');
      if (!clientId || !clientSecret) return null;
      return {
        clientId,
        clientSecret,
        authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
        tokenUrl: 'https://nid.naver.com/oauth2.0/token',
        scope: 'email name',
        profileUrl: 'https://openapi.naver.com/v1/nid/me',
      };
    }
    case OAuthProvider.KAKAO: {
      const clientId = env('KAKAO_REST_API_KEY');
      const clientSecret = env('KAKAO_CLIENT_SECRET');
      if (!clientId) return null;
      return {
        clientId,
        clientSecret,
        authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
        tokenUrl: 'https://kauth.kakao.com/oauth/token',
        scope: 'profile_nickname account_email',
        profileUrl: 'https://kapi.kakao.com/v2/user/me',
      };
    }
    default:
      return null;
  }
}

/** env 기반 OAuth2 provider — authorize URL / code 교환 */
export class EnvOAuthProviderService implements IOAuthProviderPort {
  isConfigured(provider: OAuthProviderId): boolean {
    return providerConfig(provider) !== null;
  }

  buildAuthorizationUrl(input: {
    provider: OAuthProviderId;
    redirectUri: string;
    state: string;
  }): string {
    const config = providerConfig(input.provider);
    if (!config) {
      throw new ValidationError(`${input.provider} OAuth가 설정되지 않았습니다.`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: input.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: input.state,
      ...config.extraAuthParams,
    });

    return `${config.authorizeUrl}?${params.toString()}`;
  }

  async exchangeAuthorizationCode(input: {
    provider: OAuthProviderId;
    code: string;
    redirectUri: string;
  }): Promise<OAuthUserProfile> {
    const config = providerConfig(input.provider);
    if (!config) {
      throw new ValidationError(`${input.provider} OAuth가 설정되지 않았습니다.`);
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: config.clientId,
    });
    if (config.clientSecret) {
      body.set('client_secret', config.clientSecret);
    }

    const tokenRes = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!tokenRes.ok) {
      throw new ValidationError(`${input.provider} OAuth token 교환에 실패했습니다.`);
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    return this.fetchProfile(input.provider, tokenJson.access_token, tokenJson.id_token);
  }

  private async fetchProfile(
    provider: OAuthProviderId,
    accessToken?: string,
    idToken?: string,
  ): Promise<OAuthUserProfile> {
    switch (provider) {
      case OAuthProvider.GOOGLE:
        return this.fetchGoogleProfile(accessToken);
      case OAuthProvider.APPLE:
        return this.parseAppleIdToken(idToken);
      case OAuthProvider.NAVER:
        return this.fetchNaverProfile(accessToken);
      case OAuthProvider.KAKAO:
        return this.fetchKakaoProfile(accessToken);
      default:
        throw new ValidationError('지원하지 않는 OAuth 제공자입니다.');
    }
  }

  private async fetchGoogleProfile(accessToken?: string): Promise<OAuthUserProfile> {
    if (!accessToken) throw new ValidationError('Google access token이 없습니다.');
    const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new ValidationError('Google 프로필 조회에 실패했습니다.');
    const json = (await res.json()) as { sub?: string; email?: string; name?: string };
    if (!json.sub) throw new ValidationError('Google 사용자 ID를 확인할 수 없습니다.');
    return {
      provider: OAuthProvider.GOOGLE,
      providerUserId: json.sub,
      email: json.email ?? null,
      displayName: json.name ?? null,
    };
  }

  private parseAppleIdToken(idToken?: string): Promise<OAuthUserProfile> {
    if (!idToken) throw new ValidationError('Apple id_token이 없습니다.');
    const payloadPart = idToken.split('.')[1];
    if (!payloadPart) throw new ValidationError('Apple id_token 형식이 올바르지 않습니다.');
    const json = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as {
      sub?: string;
      email?: string;
    };
    if (!json.sub) throw new ValidationError('Apple 사용자 ID를 확인할 수 없습니다.');
    return Promise.resolve({
      provider: OAuthProvider.APPLE,
      providerUserId: json.sub,
      email: json.email ?? null,
      displayName: null,
    });
  }

  private async fetchNaverProfile(accessToken?: string): Promise<OAuthUserProfile> {
    if (!accessToken) throw new ValidationError('Naver access token이 없습니다.');
    const res = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new ValidationError('Naver 프로필 조회에 실패했습니다.');
    const json = (await res.json()) as {
      response?: { id?: string; email?: string; name?: string; nickname?: string };
    };
    const profile = json.response;
    if (!profile?.id) throw new ValidationError('Naver 사용자 ID를 확인할 수 없습니다.');
    return {
      provider: OAuthProvider.NAVER,
      providerUserId: profile.id,
      email: profile.email ?? null,
      displayName: profile.name ?? profile.nickname ?? null,
    };
  }

  private async fetchKakaoProfile(accessToken?: string): Promise<OAuthUserProfile> {
    if (!accessToken) throw new ValidationError('Kakao access token이 없습니다.');
    const res = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new ValidationError('Kakao 프로필 조회에 실패했습니다.');
    const json = (await res.json()) as {
      id?: number;
      kakao_account?: { email?: string; profile?: { nickname?: string } };
    };
    if (!json.id) throw new ValidationError('Kakao 사용자 ID를 확인할 수 없습니다.');
    return {
      provider: OAuthProvider.KAKAO,
      providerUserId: String(json.id),
      email: json.kakao_account?.email ?? null,
      displayName: json.kakao_account?.profile?.nickname ?? null,
    };
  }
}
