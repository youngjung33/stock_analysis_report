import { LoginUseCase } from './domain/usecases/auth/login.use-case';
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
import { authSessionAdapter } from './data/auth/auth-session.adapter';
import { guestSessionAdapter, guestStoreAdapter } from './data/guest/guest-session.adapter';
import {
  authRepository,
  corporateActionRepository,
  marketRepository,
  portfolioRepository,
  transactionRepository,
  watchlistRepository,
} from './data/repositories/routing.repositories';

export function wireAppServices(): AppServices {
  return {
    loginUseCase: new LoginUseCase(authRepository),
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
    authSession: authSessionAdapter,
    guestSession: guestSessionAdapter,
    guestStore: guestStoreAdapter,
  };
}
