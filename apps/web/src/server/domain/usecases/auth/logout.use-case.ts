import { IRefreshTokenRepository, ITokenService } from '../../repositories';

/** refresh 토큰 폐기로 세션 종료 use case */
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  /** refreshToken이 있으면 DB에서 revoke */
  async execute(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (stored) {
      await this.refreshTokenRepo.revoke(stored.id);
    }
  }
}
