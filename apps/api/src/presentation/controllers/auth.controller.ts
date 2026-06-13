import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { REFRESH_TOKEN_COOKIE } from '@sar/shared';
import type { Request, Response } from 'express';
import { LoginUseCase } from '../../domain/usecases/auth/login.use-case';
import { LogoutUseCase } from '../../domain/usecases/auth/logout.use-case';
import { RefreshTokenUseCase } from '../../domain/usecases/auth/refresh-token.use-case';
import { LoginDto } from '../dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginUseCase.execute(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, username: result.username };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.refreshUseCase.execute(refreshToken);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, username: result.username };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    await this.logoutUseCase.execute(refreshToken);
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
    return { success: true };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_TOKEN_COOKIE, token, this.cookieOptions());
  }

  private cookieOptions() {
    const isProd = this.config.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }
}
