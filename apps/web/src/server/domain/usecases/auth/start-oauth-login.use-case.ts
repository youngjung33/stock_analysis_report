import { randomBytes } from 'crypto';
import { OAuthProviderId, isOAuthProvider } from '@sar/shared';
import { ValidationError } from '../../errors/domain.errors';
import { IOAuthProviderPort } from '../../ports/oauth-provider.port';
import { IOAuthStateRepository } from '../../repositories';

export interface StartOAuthLoginInput {
  provider: string;
  redirectUri: string;
}

export interface StartOAuthLoginResult {
  authorizationUrl: string;
  state: string;
}

const STATE_TTL_MS = 10 * 60 * 1000;

/** OAuth authorize URL + CSRF state 발급 */
export class StartOAuthLoginUseCase {
  constructor(
    private readonly oauthProvider: IOAuthProviderPort,
    private readonly oauthStateRepo: IOAuthStateRepository,
  ) {}

  async execute(input: StartOAuthLoginInput): Promise<StartOAuthLoginResult> {
    if (!isOAuthProvider(input.provider)) {
      throw new ValidationError('지원하지 않는 OAuth 제공자입니다.');
    }

    const provider = input.provider as OAuthProviderId;
    if (!this.oauthProvider.isConfigured(provider)) {
      throw new ValidationError(`${provider} OAuth가 설정되지 않았습니다.`);
    }

    const redirectUri = input.redirectUri.trim();
    if (!redirectUri) {
      throw new ValidationError('redirectUri가 필요합니다.');
    }

    const state = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + STATE_TTL_MS);

    await this.oauthStateRepo.create({ state, provider, redirectUri, expiresAt });

    const authorizationUrl = this.oauthProvider.buildAuthorizationUrl({
      provider,
      redirectUri,
      state,
    });

    return { authorizationUrl, state };
  }
}
