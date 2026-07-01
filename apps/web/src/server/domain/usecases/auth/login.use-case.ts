import {
  IPasswordHasher,
  IRefreshTokenRepository,
  ITokenService,
  IUserRepository,
} from '../../repositories';
import { AuthenticationError } from '../../errors/domain.errors';

export interface LoginInput {
  username: string;
  password: string;
}

/** 사용자 인증 후 access/refresh 토큰 발급 use case */
export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  /** 유효한 자격증명이면 accessToken·refreshToken·username 반환 */
  async execute(
    input: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string; username: string }> {
    const user = await this.userRepo.findByUsername(input.username);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError('Invalid credentials');
    }

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
