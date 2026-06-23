import { GetFeaturedQuotesUseCase } from './domain/usecases/market/get-featured-quotes.use-case';
import { GetStockQuoteUseCase } from './domain/usecases/market/get-stock-quote.use-case';
import { FetchQuotesUseCase } from './domain/usecases/market/fetch-quotes.use-case';
import { GetMarketStatusUseCase } from './domain/usecases/market/get-market-status.use-case';
import { LoginUseCase } from './domain/usecases/auth/login.use-case';
import { LogoutUseCase } from './domain/usecases/auth/logout.use-case';
import { RefreshTokenUseCase } from './domain/usecases/auth/refresh-token.use-case';
import { RefreshQuotesUseCase } from './domain/usecases/market/refresh-quotes.use-case';
import { GetDashboardUseCase } from './domain/usecases/portfolio/get-dashboard.use-case';
import { CreateTransactionUseCase } from './domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from './domain/usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from './domain/usecases/transactions/list-transactions.use-case';
import { BcryptPasswordHasher } from './data/auth/password-hasher';
import { JwtTokenService } from './data/auth/token.service';
import { KrYahooMarketProvider, UsFinnhubMarketProvider } from './data/market';
import {
  PrismaRefreshTokenRepository,
  PrismaStockQuoteRepository,
  PrismaStockRepository,
  PrismaTransactionRepository,
  PrismaUserRepository,
} from './data/persistence/prisma.repositories';

export interface ServerServices {
  loginUseCase: LoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  logoutUseCase: LogoutUseCase;
  createTransactionUseCase: CreateTransactionUseCase;
  listTransactionsUseCase: ListTransactionsUseCase;
  deleteTransactionUseCase: DeleteTransactionUseCase;
  getDashboardUseCase: GetDashboardUseCase;
  refreshQuotesUseCase: RefreshQuotesUseCase;
  fetchQuotesUseCase: FetchQuotesUseCase;
  getFeaturedQuotesUseCase: GetFeaturedQuotesUseCase;
  getStockQuoteUseCase: GetStockQuoteUseCase;
  getMarketStatusUseCase: GetMarketStatusUseCase;
}

let cached: ServerServices | null = null;

export function getServerServices(): ServerServices {
  if (cached) return cached;

  const userRepo = new PrismaUserRepository();
  const refreshRepo = new PrismaRefreshTokenRepository();
  const stockRepo = new PrismaStockRepository();
  const txRepo = new PrismaTransactionRepository();
  const quoteRepo = new PrismaStockQuoteRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const marketProviders = [new UsFinnhubMarketProvider(), new KrYahooMarketProvider()];
  const fetchQuotesUseCase = new FetchQuotesUseCase(marketProviders);

  cached = {
    loginUseCase: new LoginUseCase(userRepo, refreshRepo, passwordHasher, tokenService),
    fetchQuotesUseCase,
    getFeaturedQuotesUseCase: new GetFeaturedQuotesUseCase(fetchQuotesUseCase),
    getStockQuoteUseCase: new GetStockQuoteUseCase(),
    refreshTokenUseCase: new RefreshTokenUseCase(refreshRepo, tokenService),
    logoutUseCase: new LogoutUseCase(refreshRepo, tokenService),
    createTransactionUseCase: new CreateTransactionUseCase(stockRepo, txRepo),
    listTransactionsUseCase: new ListTransactionsUseCase(txRepo),
    deleteTransactionUseCase: new DeleteTransactionUseCase(txRepo),
    getDashboardUseCase: new GetDashboardUseCase(stockRepo, txRepo, quoteRepo),
    refreshQuotesUseCase: new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketProviders),
    getMarketStatusUseCase: new GetMarketStatusUseCase(marketProviders),
  };

  return cached;
}
