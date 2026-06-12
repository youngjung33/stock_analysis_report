import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IPasswordHasher,
  IRefreshTokenRepository,
  ITokenService,
  IUserRepository,
} from '../../domain/repositories';

export interface LoginInput {
  username: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(
    input: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string; username: string }> {
    const user = await this.userRepo.findByUsername(input.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
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
