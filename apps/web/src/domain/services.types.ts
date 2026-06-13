import { LoginUseCase, LogoutUseCase, RefreshSessionUseCase } from './usecases/auth/auth.use-cases';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  GetDashboardUseCase,
  ListTransactionsUseCase,
  RefreshQuotesUseCase,
} from './usecases/portfolio/portfolio.use-cases';
import { IAuthSessionPort } from './repositories';

export interface AppServices {
  loginUseCase: LoginUseCase;
  refreshSessionUseCase: RefreshSessionUseCase;
  logoutUseCase: LogoutUseCase;
  createTransactionUseCase: CreateTransactionUseCase;
  listTransactionsUseCase: ListTransactionsUseCase;
  deleteTransactionUseCase: DeleteTransactionUseCase;
  getDashboardUseCase: GetDashboardUseCase;
  refreshQuotesUseCase: RefreshQuotesUseCase;
  authSession: IAuthSessionPort;
}
