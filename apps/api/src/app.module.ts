import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
} from './application/auth/auth.use-cases';
import { RefreshQuotesUseCase } from './application/market/refresh-quotes.use-case';
import { GetDashboardUseCase } from './application/portfolio/get-dashboard.use-case';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  ListTransactionsUseCase,
} from './application/transactions/transaction.use-cases';
import {
  MARKET_DATA_PROVIDERS,
  PASSWORD_HASHER,
  REFRESH_TOKEN_REPOSITORY,
  STOCK_QUOTE_REPOSITORY,
  STOCK_REPOSITORY,
  TOKEN_SERVICE,
  TRANSACTION_REPOSITORY,
  USER_REPOSITORY,
} from './domain/repositories';
import { BcryptPasswordHasher } from './infrastructure/auth/password-hasher';
import { NestTokenService } from './infrastructure/auth/token.service';
import { FinnhubProvider } from './infrastructure/market/finnhub.provider';
import { YahooFinanceProvider } from './infrastructure/market/yahoo-finance.provider';
import {
  PrismaRefreshTokenRepository,
  PrismaStockQuoteRepository,
  PrismaStockRepository,
  PrismaTransactionRepository,
  PrismaUserRepository,
} from './infrastructure/persistence/prisma.repositories';
import { PrismaService } from './infrastructure/persistence/prisma.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { MarketController, PortfolioController } from './presentation/controllers/portfolio.controller';
import { TransactionsController } from './presentation/controllers/transactions.controller';
import { JwtStrategy } from './presentation/guards/jwt-auth.guard';

const repositoryProviders = [
  { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
  { provide: STOCK_REPOSITORY, useClass: PrismaStockRepository },
  { provide: TRANSACTION_REPOSITORY, useClass: PrismaTransactionRepository },
  { provide: STOCK_QUOTE_REPOSITORY, useClass: PrismaStockQuoteRepository },
  { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  { provide: TOKEN_SERVICE, useClass: NestTokenService },
  {
    provide: MARKET_DATA_PROVIDERS,
    useFactory: (finnhub: FinnhubProvider, yahoo: YahooFinanceProvider) => [finnhub, yahoo],
    inject: [FinnhubProvider, YahooFinanceProvider],
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController, TransactionsController, PortfolioController, MarketController],
  providers: [
    PrismaService,
    JwtStrategy,
    FinnhubProvider,
    YahooFinanceProvider,
    ...repositoryProviders,
    {
      provide: LoginUseCase,
      useFactory: (
        userRepo: PrismaUserRepository,
        refreshRepo: PrismaRefreshTokenRepository,
        hasher: BcryptPasswordHasher,
        tokenService: NestTokenService,
      ) => new LoginUseCase(userRepo, refreshRepo, hasher, tokenService),
      inject: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (refreshRepo: PrismaRefreshTokenRepository, tokenService: NestTokenService) =>
        new RefreshTokenUseCase(refreshRepo, tokenService),
      inject: [REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: LogoutUseCase,
      useFactory: (refreshRepo: PrismaRefreshTokenRepository, tokenService: NestTokenService) =>
        new LogoutUseCase(refreshRepo, tokenService),
      inject: [REFRESH_TOKEN_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: CreateTransactionUseCase,
      useFactory: (stockRepo: PrismaStockRepository, txRepo: PrismaTransactionRepository) =>
        new CreateTransactionUseCase(stockRepo, txRepo),
      inject: [STOCK_REPOSITORY, TRANSACTION_REPOSITORY],
    },
    {
      provide: ListTransactionsUseCase,
      useFactory: (txRepo: PrismaTransactionRepository) => new ListTransactionsUseCase(txRepo),
      inject: [TRANSACTION_REPOSITORY],
    },
    {
      provide: DeleteTransactionUseCase,
      useFactory: (txRepo: PrismaTransactionRepository) => new DeleteTransactionUseCase(txRepo),
      inject: [TRANSACTION_REPOSITORY],
    },
    {
      provide: GetDashboardUseCase,
      useFactory: (
        stockRepo: PrismaStockRepository,
        txRepo: PrismaTransactionRepository,
        quoteRepo: PrismaStockQuoteRepository,
      ) => new GetDashboardUseCase(stockRepo, txRepo, quoteRepo),
      inject: [STOCK_REPOSITORY, TRANSACTION_REPOSITORY, STOCK_QUOTE_REPOSITORY],
    },
    {
      provide: RefreshQuotesUseCase,
      useFactory: (
        stockRepo: PrismaStockRepository,
        txRepo: PrismaTransactionRepository,
        quoteRepo: PrismaStockQuoteRepository,
        providers: (FinnhubProvider | YahooFinanceProvider)[],
      ) => new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, providers),
      inject: [STOCK_REPOSITORY, TRANSACTION_REPOSITORY, STOCK_QUOTE_REPOSITORY, MARKET_DATA_PROVIDERS],
    },
  ],
})
export class AppModule {}
