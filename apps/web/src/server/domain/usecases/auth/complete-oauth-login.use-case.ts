import { AppErrorCode, isOAuthProvider } from '@sar/shared';
import { AuthenticationError, ValidationError } from '../../errors/domain.errors';
import { IOAuthProviderPort } from '../../ports/oauth-provider.port';
import {
  IOAuthStateRepository,
  IUserOAuthAccountRepository,
  IUserRepository,
} from '../../repositories';
import { AuthSessionService, AuthSessionResult } from '../../services/auth-session.service';
import { resolveUniqueUsername } from './register.use-case';

export interface CompleteOAuthLoginInput {
  provider: string;
  code: string;
  state: string;
}

export interface CompleteOAuthLoginResult extends AuthSessionResult {
  isNewUser: boolean;
}

/**
 * OAuth callback — 기존 SSO 계정 로그인 / 이메일 연동 / 신규 가입
 * refresh·logout·JWT sub(userId) 흐름은 credentials 로그인과 동일
 */
export class CompleteOAuthLoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly oauthAccountRepo: IUserOAuthAccountRepository,
    private readonly oauthStateRepo: IOAuthStateRepository,
    private readonly oauthProvider: IOAuthProviderPort,
    private readonly authSession: AuthSessionService,
  ) {}

  async execute(input: CompleteOAuthLoginInput): Promise<CompleteOAuthLoginResult> {
    if (!isOAuthProvider(input.provider)) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_PROVIDER_INVALID);
    }

    const provider = input.provider;
    const code = input.code.trim();
    const state = input.state.trim();

    if (!code || !state) {
      throw new ValidationError(AppErrorCode.AUTH_OAUTH_CODE_STATE_REQUIRED);
    }

    const storedState = await this.oauthStateRepo.consume(state, provider);
    if (!storedState) {
      throw new AuthenticationError(AppErrorCode.AUTH_OAUTH_STATE_INVALID);
    }

    const profile = await this.oauthProvider.exchangeAuthorizationCode({
      provider,
      code,
      redirectUri: storedState.redirectUri,
    });

    const existingAccount = await this.oauthAccountRepo.findByProviderUserId(
      provider,
      profile.providerUserId,
    );
    if (existingAccount) {
      const user = await this.userRepo.findById(existingAccount.userId);
      if (!user) {
        throw new AuthenticationError(AppErrorCode.NOT_FOUND);
      }
      const session = await this.authSession.issueForUser(user);
      return { ...session, isNewUser: false };
    }

    if (profile.email) {
      const linkedUser = await this.userRepo.findByEmail(profile.email);
      if (linkedUser) {
        await this.oauthAccountRepo.create({
          userId: linkedUser.id,
          provider,
          providerUserId: profile.providerUserId,
          email: profile.email,
        });
        const session = await this.authSession.issueForUser(linkedUser);
        return { ...session, isNewUser: false };
      }
    }

    const username = await resolveUniqueUsername(this.userRepo, profile);
    const user = await this.userRepo.create({
      username,
      email: profile.email,
      passwordHash: null,
    });

    await this.oauthAccountRepo.create({
      userId: user.id,
      provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
    });

    const session = await this.authSession.issueForUser(user);
    return { ...session, isNewUser: true };
  }
}
