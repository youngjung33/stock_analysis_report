import {
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
} from './application/auth/auth.use-cases';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  GetDashboardUseCase,
  ListTransactionsUseCase,
  RefreshQuotesUseCase,
} from './application/portfolio/portfolio.use-cases';
import { AppServices } from './application/services.types';
import { authSessionAdapter } from './infrastructure/auth/auth-session.adapter';
import {
  authRepository,
  portfolioRepository,
  transactionRepository,
} from './infrastructure/repositories/api.repositories';

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
