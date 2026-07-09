import { GetFeaturedQuotesUseCase } from './domain/usecases/market/get-featured-quotes.use-case';
import { GetFxRateUseCase } from './domain/usecases/market/get-fx-rate.use-case';
import { GetMarketAnalysisUseCase } from './domain/usecases/market/get-market-analysis.use-case';
import { GetStockQuoteUseCase } from './domain/usecases/market/get-stock-quote.use-case';
import { FetchQuotesUseCase } from './domain/usecases/market/fetch-quotes.use-case';
import { GetMarketStatusUseCase } from './domain/usecases/market/get-market-status.use-case';
import { SearchStocksUseCase } from './domain/usecases/market/search-stocks.use-case';
import { LoginUseCase } from './domain/usecases/auth/login.use-case';
import { RegisterUseCase } from './domain/usecases/auth/register.use-case';
import { CheckUsernameAvailabilityUseCase } from './domain/usecases/auth/check-username-availability.use-case';
import { StartOAuthLoginUseCase } from './domain/usecases/auth/start-oauth-login.use-case';
import { CompleteOAuthLoginUseCase } from './domain/usecases/auth/complete-oauth-login.use-case';
import { LogoutUseCase } from './domain/usecases/auth/logout.use-case';
import { RefreshTokenUseCase } from './domain/usecases/auth/refresh-token.use-case';
import { AuthSessionService } from './domain/services/auth-session.service';
import { RefreshQuotesUseCase } from './domain/usecases/market/refresh-quotes.use-case';
import { GetDashboardUseCase } from './domain/usecases/portfolio/get-dashboard.use-case';
import { GetHoldingBySymbolUseCase } from './domain/usecases/portfolio/get-holding-by-symbol.use-case';
import { GetPortfolioAnalysisUseCase } from './domain/usecases/portfolio/get-portfolio-analysis.use-case';
import {
  CreateCorporateActionUseCase,
  DeleteCorporateActionUseCase,
  ListCorporateActionsUseCase,
} from './domain/usecases/corporate-actions/corporate-actions.use-cases';
import {
  AddWatchlistUseCase,
  DeleteWatchlistUseCase,
  ListWatchlistUseCase,
} from './domain/usecases/watchlist/watchlist.use-cases';
import { CreateTransactionUseCase } from './domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from './domain/usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from './domain/usecases/transactions/list-transactions.use-case';
import { ITokenService } from './domain/repositories';
import { BcryptPasswordHasher } from './data/auth/password-hasher';
import { EnvOAuthProviderService } from './data/auth/oauth-provider.service';
import {
  PrismaOAuthStateRepository,
  PrismaUserOAuthAccountRepository,
} from './data/auth/oauth.repositories';
import { JwtTokenService } from './data/auth/token.service';
import { MarketDataProvider } from './data/market/market-data.provider';
import { PrismaStockCatalogRepository } from './data/persistence/stock-catalog.repository';
import {
  PrismaCorporateActionRepository,
  PrismaRefreshTokenRepository,
  PrismaStockQuoteRepository,
  PrismaStockRepository,
  PrismaTransactionRepository,
  PrismaUserRepository,
  PrismaWatchlistRepository,
} from './data/persistence/prisma.repositories';
import { PrismaAuthTokenRepository } from './data/auth/auth-token.repository';
import { ConsoleEmailSender } from './data/auth/console-email.sender';
import {
  ChangeEmailUseCase,
  ChangePasswordUseCase,
  GetAccountUseCase,
  RequestEmailVerificationUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  UnlinkOAuthAccountUseCase,
  VerifyEmailUseCase,
} from './domain/usecases/account/account.use-cases';

export interface ServerServices {
  tokenService: ITokenService;
  oauthProvider: EnvOAuthProviderService;
  loginUseCase: LoginUseCase;
  registerUseCase: RegisterUseCase;
  checkUsernameAvailabilityUseCase: CheckUsernameAvailabilityUseCase;
  startOAuthLoginUseCase: StartOAuthLoginUseCase;
  completeOAuthLoginUseCase: CompleteOAuthLoginUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  logoutUseCase: LogoutUseCase;
  createTransactionUseCase: CreateTransactionUseCase;
  listTransactionsUseCase: ListTransactionsUseCase;
  deleteTransactionUseCase: DeleteTransactionUseCase;
  getDashboardUseCase: GetDashboardUseCase;
  getHoldingBySymbolUseCase: GetHoldingBySymbolUseCase;
  getPortfolioAnalysisUseCase: GetPortfolioAnalysisUseCase;
  refreshQuotesUseCase: RefreshQuotesUseCase;
  fetchQuotesUseCase: FetchQuotesUseCase;
  getFeaturedQuotesUseCase: GetFeaturedQuotesUseCase;
  getStockQuoteUseCase: GetStockQuoteUseCase;
  getMarketStatusUseCase: GetMarketStatusUseCase;
  getMarketAnalysisUseCase: GetMarketAnalysisUseCase;
  searchStocksUseCase: SearchStocksUseCase;
  getFxRateUseCase: GetFxRateUseCase;
  listCorporateActionsUseCase: ListCorporateActionsUseCase;
  createCorporateActionUseCase: CreateCorporateActionUseCase;
  deleteCorporateActionUseCase: DeleteCorporateActionUseCase;
  listWatchlistUseCase: ListWatchlistUseCase;
  addWatchlistUseCase: AddWatchlistUseCase;
  deleteWatchlistUseCase: DeleteWatchlistUseCase;
  getAccountUseCase: GetAccountUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  changeEmailUseCase: ChangeEmailUseCase;
  requestEmailVerificationUseCase: RequestEmailVerificationUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;
  unlinkOAuthAccountUseCase: UnlinkOAuthAccountUseCase;
}

let cached: ServerServices | null = null;

export function getServerServices(): ServerServices {
  if (cached) return cached;

  const userRepo = new PrismaUserRepository();
  const refreshRepo = new PrismaRefreshTokenRepository();
  const stockRepo = new PrismaStockRepository();
  const txRepo = new PrismaTransactionRepository();
  const quoteRepo = new PrismaStockQuoteRepository();
  const corpActionRepo = new PrismaCorporateActionRepository();
  const watchlistRepo = new PrismaWatchlistRepository();
  const catalogRepo = new PrismaStockCatalogRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const oauthProvider = new EnvOAuthProviderService();
  const oauthAccountRepo = new PrismaUserOAuthAccountRepository();
  const oauthStateRepo = new PrismaOAuthStateRepository();
  const authTokenRepo = new PrismaAuthTokenRepository();
  const emailSender = new ConsoleEmailSender();
  const authSession = new AuthSessionService(refreshRepo, tokenService);
  const marketData = new MarketDataProvider();

  const fetchQuotesUseCase = new FetchQuotesUseCase(marketData);
  const getFeaturedQuotesUseCase = new GetFeaturedQuotesUseCase(fetchQuotesUseCase);

  cached = {
    tokenService,
    oauthProvider,
    loginUseCase: new LoginUseCase(userRepo, passwordHasher, authSession),
    registerUseCase: new RegisterUseCase(userRepo, passwordHasher, authSession),
    checkUsernameAvailabilityUseCase: new CheckUsernameAvailabilityUseCase(userRepo),
    startOAuthLoginUseCase: new StartOAuthLoginUseCase(oauthProvider, oauthStateRepo),
    completeOAuthLoginUseCase: new CompleteOAuthLoginUseCase(
      userRepo,
      oauthAccountRepo,
      oauthStateRepo,
      oauthProvider,
      authSession,
    ),
    fetchQuotesUseCase,
    getFeaturedQuotesUseCase,
    getStockQuoteUseCase: new GetStockQuoteUseCase(marketData),
    refreshTokenUseCase: new RefreshTokenUseCase(refreshRepo, tokenService),
    logoutUseCase: new LogoutUseCase(refreshRepo, tokenService),
    createTransactionUseCase: new CreateTransactionUseCase(stockRepo, txRepo),
    listTransactionsUseCase: new ListTransactionsUseCase(txRepo),
    deleteTransactionUseCase: new DeleteTransactionUseCase(txRepo),
    getDashboardUseCase: new GetDashboardUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      marketData,
    ),
    getHoldingBySymbolUseCase: new GetHoldingBySymbolUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      marketData,
    ),
    getPortfolioAnalysisUseCase: new GetPortfolioAnalysisUseCase(
      stockRepo,
      txRepo,
      quoteRepo,
      corpActionRepo,
      marketData,
    ),
    refreshQuotesUseCase: new RefreshQuotesUseCase(stockRepo, txRepo, quoteRepo, marketData),
    getMarketStatusUseCase: new GetMarketStatusUseCase(marketData),
    getMarketAnalysisUseCase: new GetMarketAnalysisUseCase(getFeaturedQuotesUseCase, marketData),
    searchStocksUseCase: new SearchStocksUseCase(catalogRepo, marketData),
    getFxRateUseCase: new GetFxRateUseCase(marketData),
    listCorporateActionsUseCase: new ListCorporateActionsUseCase(corpActionRepo),
    createCorporateActionUseCase: new CreateCorporateActionUseCase(stockRepo, corpActionRepo),
    deleteCorporateActionUseCase: new DeleteCorporateActionUseCase(corpActionRepo),
    listWatchlistUseCase: new ListWatchlistUseCase(watchlistRepo),
    addWatchlistUseCase: new AddWatchlistUseCase(watchlistRepo),
    deleteWatchlistUseCase: new DeleteWatchlistUseCase(watchlistRepo),
    getAccountUseCase: new GetAccountUseCase(userRepo, oauthAccountRepo),
    changePasswordUseCase: new ChangePasswordUseCase(userRepo, passwordHasher),
    changeEmailUseCase: new ChangeEmailUseCase(userRepo, authTokenRepo, emailSender),
    requestEmailVerificationUseCase: new RequestEmailVerificationUseCase(
      userRepo,
      authTokenRepo,
      emailSender,
    ),
    verifyEmailUseCase: new VerifyEmailUseCase(userRepo, authTokenRepo),
    requestPasswordResetUseCase: new RequestPasswordResetUseCase(
      userRepo,
      authTokenRepo,
      emailSender,
    ),
    resetPasswordUseCase: new ResetPasswordUseCase(userRepo, authTokenRepo, passwordHasher),
    unlinkOAuthAccountUseCase: new UnlinkOAuthAccountUseCase(userRepo, oauthAccountRepo),
  };

  return cached;
}
