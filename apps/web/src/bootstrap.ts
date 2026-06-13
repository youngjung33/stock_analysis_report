import {
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
} from './domain/usecases/auth/auth.use-cases';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  GetDashboardUseCase,
  ListTransactionsUseCase,
  RefreshQuotesUseCase,
} from './domain/usecases/portfolio/portfolio.use-cases';
import { AppServices } from './domain/services.types';
import { authSessionAdapter } from './data/auth/auth-session.adapter';
import {
  authRepository,
  portfolioRepository,
  transactionRepository,
} from './data/repositories/api.repositories';

export function wireAppServices(): AppServices {
  return {
    loginUseCase: new LoginUseCase(authRepository),
    refreshSessionUseCase: new RefreshSessionUseCase(authRepository),
    logoutUseCase: new LogoutUseCase(authRepository),
    createTransactionUseCase: new CreateTransactionUseCase(transactionRepository),
    listTransactionsUseCase: new ListTransactionsUseCase(transactionRepository),
    deleteTransactionUseCase: new DeleteTransactionUseCase(transactionRepository),
    getDashboardUseCase: new GetDashboardUseCase(portfolioRepository),
    refreshQuotesUseCase: new RefreshQuotesUseCase(portfolioRepository),
    authSession: authSessionAdapter,
  };
}
