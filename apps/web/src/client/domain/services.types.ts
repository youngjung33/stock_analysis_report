import { LoginUseCase } from './usecases/auth/login.use-case';
import { RegisterUseCase } from './usecases/auth/register.use-case';
import { CheckUsernameAvailabilityUseCase } from './usecases/auth/check-username-availability.use-case';
import { StartOAuthLoginUseCase } from './usecases/auth/start-oauth-login.use-case';
import { ListOAuthProvidersUseCase } from './usecases/auth/list-oauth-providers.use-case';
import { LogoutUseCase } from './usecases/auth/logout.use-case';
import { RefreshSessionUseCase } from './usecases/auth/refresh-session.use-case';
import { CreateCorporateActionUseCase } from './usecases/corporate-actions/create-corporate-action.use-case';
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
} from './usecases/account/account.use-cases';
import {
  IAuthSessionPort,
  IGuestSessionPort,
  IGuestStorePort,
  ITokenStoragePort,
} from './repositories';
import {
  AddWatchlistUseCase,
  ListWatchlistUseCase,
  RemoveWatchlistUseCase,
} from './usecases/watchlist/watchlist.use-cases';
import {
  GetFeaturedQuotesUseCase,
  GetFxRateUseCase,
  GetMarketAnalysisUseCase,
  GetMarketStatusUseCase,
  GetStockQuoteUseCase,
  SearchStocksUseCase,
} from './usecases/market/market.use-cases';
import { GetDashboardUseCase } from './usecases/portfolio/get-dashboard.use-case';
import { GetHoldingBySymbolUseCase } from './usecases/portfolio/get-holding-by-symbol.use-case';
import { GetPortfolioAnalysisUseCase } from './usecases/portfolio/get-portfolio-analysis.use-case';
import { RefreshQuotesUseCase } from './usecases/portfolio/refresh-quotes.use-case';
import { CreateTransactionUseCase } from './usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from './usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from './usecases/transactions/list-transactions.use-case';

export interface AppServices {
  loginUseCase: LoginUseCase;
  registerUseCase: RegisterUseCase;
  checkUsernameAvailabilityUseCase: CheckUsernameAvailabilityUseCase;
  startOAuthLoginUseCase: StartOAuthLoginUseCase;
  listOAuthProvidersUseCase: ListOAuthProvidersUseCase;
  refreshSessionUseCase: RefreshSessionUseCase;
  logoutUseCase: LogoutUseCase;
  createTransactionUseCase: CreateTransactionUseCase;
  listTransactionsUseCase: ListTransactionsUseCase;
  deleteTransactionUseCase: DeleteTransactionUseCase;
  getDashboardUseCase: GetDashboardUseCase;
  getHoldingBySymbolUseCase: GetHoldingBySymbolUseCase;
  getPortfolioAnalysisUseCase: GetPortfolioAnalysisUseCase;
  refreshQuotesUseCase: RefreshQuotesUseCase;
  getFeaturedQuotesUseCase: GetFeaturedQuotesUseCase;
  getStockQuoteUseCase: GetStockQuoteUseCase;
  getMarketStatusUseCase: GetMarketStatusUseCase;
  getMarketAnalysisUseCase: GetMarketAnalysisUseCase;
  searchStocksUseCase: SearchStocksUseCase;
  getFxRateUseCase: GetFxRateUseCase;
  listWatchlistUseCase: ListWatchlistUseCase;
  addWatchlistUseCase: AddWatchlistUseCase;
  removeWatchlistUseCase: RemoveWatchlistUseCase;
  createCorporateActionUseCase: CreateCorporateActionUseCase;
  getAccountUseCase: GetAccountUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  changeEmailUseCase: ChangeEmailUseCase;
  requestEmailVerificationUseCase: RequestEmailVerificationUseCase;
  confirmEmailVerificationUseCase: ConfirmEmailVerificationUseCase;
  unlinkOAuthUseCase: UnlinkOAuthUseCase;
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;
  deleteAccountUseCase: DeleteAccountUseCase;
  authSession: IAuthSessionPort;
  guestSession: IGuestSessionPort;
  guestStore: IGuestStorePort;
  tokenStorage: ITokenStoragePort;
}
