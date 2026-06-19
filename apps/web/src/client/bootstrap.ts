import { LoginUseCase } from './domain/usecases/auth/login.use-case';
import { LogoutUseCase } from './domain/usecases/auth/logout.use-case';
import { RefreshSessionUseCase } from './domain/usecases/auth/refresh-session.use-case';
import { AppServices } from './domain/services.types';
import { GetDashboardUseCase } from './domain/usecases/portfolio/get-dashboard.use-case';
import { RefreshQuotesUseCase } from './domain/usecases/portfolio/refresh-quotes.use-case';
import { CreateTransactionUseCase } from './domain/usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from './domain/usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from './domain/usecases/transactions/list-transactions.use-case';
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
