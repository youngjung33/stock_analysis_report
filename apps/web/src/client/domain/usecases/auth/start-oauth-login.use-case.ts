import { AppErrorCode, OAuthProviderId } from '@sar/shared';
import { AppError } from '../../errors/app-error';
import { IAuthRepository } from '../../repositories';

/** OAuth authorize URL 요청 후 브라우저 redirect */
export class StartOAuthLoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(provider: OAuthProviderId, redirectUri: string) {
    if (!redirectUri.trim()) {
      throw new AppError('', AppErrorCode.AUTH_OAUTH_REDIRECT_URI_REQUIRED);
    }
    return this.authRepo.startOAuthLogin(provider, redirectUri);
  }
}
