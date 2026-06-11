import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetDashboardUseCase } from '../../application/portfolio/get-dashboard.use-case';
import { RefreshQuotesUseCase } from '../../application/market/refresh-quotes.use-case';
import { AuthUser, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly getDashboardUseCase: GetDashboardUseCase) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.getDashboardUseCase.execute(user.userId);
  }
}

@Controller('market')
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private readonly refreshQuotesUseCase: RefreshQuotesUseCase) {}

  @Post('refresh')
  refresh(@CurrentUser() user: AuthUser) {
    return this.refreshQuotesUseCase.execute(user.userId);
  }
}
