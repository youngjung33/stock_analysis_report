import { IRefreshTokenRepository, ITokenService } from '../../repositories';
import { AuthenticationError } from '../../errors/domain.errors';

/** refresh 토큰으로 access/refresh 토큰 재발급 use case */
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  /** 유효한 refreshToken이면 새 accessToken·refreshToken·username 반환 */
  async execute(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; username: string }> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid refresh token');
    }

    await this.refreshTokenRepo.revoke(stored.id);

    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newHash = this.tokenService.hashRefreshToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.create({
      userId: stored.userId,
      tokenHash: newHash,
      expiresAt,
    });

    const accessToken = this.tokenService.generateAccessToken({
      sub: stored.user.id,
      username: stored.user.username,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      username: stored.user.username,
    };
  }
}
