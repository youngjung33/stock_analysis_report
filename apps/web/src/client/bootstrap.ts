import { LoginUseCase } from './domain/usecases/auth/login.use-case';
import { RegisterUseCase } from './domain/usecases/auth/register.use-case';
import { CheckUsernameAvailabilityUseCase } from './domain/usecases/auth/check-username-availability.use-case';
import { StartOAuthLoginUseCase } from './domain/usecases/auth/start-oauth-login.use-case';
import { ListOAuthProvidersUseCase } from './domain/usecases/auth/list-oauth-providers.use-case';
import { LogoutUseCase } from './domain/usecases/auth/logout.use-case';
import { RefreshSessionUseCase } from './domain/usecases/auth/refresh-session.use-case';
import { CreateCorporateActionUseCase } from './domain/usecases/corporate-actions/create-corporate-action.use-case';
import { AppServices } from './domain/services.types';
import {
  AddWatchlistUseCase,
  ListWatchlistUseCase,
  RemoveWatchlistUseCase,
} from './domain/usecases/watchlist/watchlist.use-cases';
import {
  GetFeaturedQuotesUseCase,
  GetFxRateUseCase,
  GetMarketAnalysisUseCase,
  GetMarketStatusUseCase,
  GetStockQuoteUseCase,
  SearchStocksUseCase,
} from './domain/usecases/market/market.use-cases';
import { GetDashboardUseCase } from './domain/usecases/portfolio/get-dashboard.use-case';
import { GetHoldingBySymbolUseCase } from './domain/usecases/portfolio/get-holding-by-symbol.use-case';
import { GetPortfolioAnalysisUseCase } from './domain/usecases/portfolio/get-portfolio-analysis.use-case';
import { RefreshQuotesUseCase } from './domain/usecases/portfolio/refresh-quotes.use-case';
import { CreateTransactionUseCase } from './domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from './domain/usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from './domain/usecases/transactions/list-transactions.use-case';
import { accountRepository } from './data/repositories/account.repository';
import {
  ChangeEmailUseCase,
  ChangePasswordUseCase,
  ConfirmEmailVerificationUseCase,
  DeleteAccountUseCase,
  GetAccountUseCase,
  RequestEmailVerificationUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  UnlinkOAuthUseCase,
} from './domain/usecases/account/account.use-cases';
import { tokenStorageAdapter } from './data/auth/token-storage.adapter';
import { authSessionAdapter } from './data/auth/auth-session.adapter';
import { guestSessionAdapter, guestStoreAdapter } from './data/guest/guest-session.adapter';
import {
  authRepository,
  corporateActionRepository,
  marketRepository,
  portfolioRepository,
  transactionRepository,
  watchlistRepository,
  cashRepository,
  portfolioCapitalRepository,
} from './data/repositories/routing.repositories';
import {
  GetCashSummaryUseCase,
  GetPortfolioPreferencesUseCase,
  GetPortfolioSimulationUseCase,
  RecordCashEntryUseCase,
  UpdatePortfolioPreferencesUseCase,
} from './domain/usecases/portfolio/portfolio-capital.use-cases';

export function wireAppServices(): AppServices {
  return {
    loginUseCase: new LoginUseCase(authRepository),
    registerUseCase: new RegisterUseCase(authRepository),
    checkUsernameAvailabilityUseCase: new CheckUsernameAvailabilityUseCase(authRepository),
    startOAuthLoginUseCase: new StartOAuthLoginUseCase(authRepository),
    listOAuthProvidersUseCase: new ListOAuthProvidersUseCase(authRepository),
    refreshSessionUseCase: new RefreshSessionUseCase(authRepository),
    logoutUseCase: new LogoutUseCase(authRepository),
    createTransactionUseCase: new CreateTransactionUseCase(transactionRepository),
    listTransactionsUseCase: new ListTransactionsUseCase(transactionRepository),
    deleteTransactionUseCase: new DeleteTransactionUseCase(transactionRepository),
    getDashboardUseCase: new GetDashboardUseCase(portfolioRepository),
    getHoldingBySymbolUseCase: new GetHoldingBySymbolUseCase(portfolioRepository),
    getPortfolioAnalysisUseCase: new GetPortfolioAnalysisUseCase(portfolioRepository),
    refreshQuotesUseCase: new RefreshQuotesUseCase(portfolioRepository),
    getFeaturedQuotesUseCase: new GetFeaturedQuotesUseCase(marketRepository),
    getStockQuoteUseCase: new GetStockQuoteUseCase(marketRepository),
    getMarketStatusUseCase: new GetMarketStatusUseCase(marketRepository),
    getMarketAnalysisUseCase: new GetMarketAnalysisUseCase(marketRepository),
    searchStocksUseCase: new SearchStocksUseCase(marketRepository),
    getFxRateUseCase: new GetFxRateUseCase(marketRepository),
    listWatchlistUseCase: new ListWatchlistUseCase(watchlistRepository),
    addWatchlistUseCase: new AddWatchlistUseCase(watchlistRepository),
    removeWatchlistUseCase: new RemoveWatchlistUseCase(watchlistRepository),
    createCorporateActionUseCase: new CreateCorporateActionUseCase(corporateActionRepository),
    getAccountUseCase: new GetAccountUseCase(accountRepository),
    changePasswordUseCase: new ChangePasswordUseCase(accountRepository),
    changeEmailUseCase: new ChangeEmailUseCase(accountRepository),
    requestEmailVerificationUseCase: new RequestEmailVerificationUseCase(accountRepository),
    confirmEmailVerificationUseCase: new ConfirmEmailVerificationUseCase(accountRepository),
    unlinkOAuthUseCase: new UnlinkOAuthUseCase(accountRepository),
    requestPasswordResetUseCase: new RequestPasswordResetUseCase(accountRepository),
    resetPasswordUseCase: new ResetPasswordUseCase(accountRepository),
    deleteAccountUseCase: new DeleteAccountUseCase(accountRepository),
    recordCashEntryUseCase: new RecordCashEntryUseCase(cashRepository),
    getCashSummaryUseCase: new GetCashSummaryUseCase(cashRepository),
    getPortfolioPreferencesUseCase: new GetPortfolioPreferencesUseCase(portfolioCapitalRepository),
    updatePortfolioPreferencesUseCase: new UpdatePortfolioPreferencesUseCase(portfolioCapitalRepository),
    getPortfolioSimulationUseCase: new GetPortfolioSimulationUseCase(portfolioCapitalRepository),
    authSession: authSessionAdapter,
    guestSession: guestSessionAdapter,
    guestStore: guestStoreAdapter,
    tokenStorage: tokenStorageAdapter,
  };
}
