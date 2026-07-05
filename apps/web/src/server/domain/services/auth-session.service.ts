import { IRefreshTokenRepository, ITokenService } from '../repositories';
import { UserEntity } from '../entities';

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  username: string;
}

/** access/refresh 토큰 발급 — credentials·OAuth·회원가입 공통 */
export class AuthSessionService {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async issueForUser(user: Pick<UserEntity, 'id' | 'username'>): Promise<AuthSessionResult> {
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      username: user.username,
    });
    const refreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    return { accessToken, refreshToken, username: user.username };
  }
}
