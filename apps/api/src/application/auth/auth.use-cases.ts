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

  async execute(input: LoginInput): Promise<{ accessToken: string; refreshToken: string; username: string }> {
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

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; username: string }> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
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

    return { accessToken, refreshToken: newRefreshToken, username: stored.user.username };
  }
}

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (stored) {
      await this.refreshTokenRepo.revoke(stored.id);
    }
  }
}
