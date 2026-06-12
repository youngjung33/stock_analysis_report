import { LoginUseCase, LogoutUseCase, RefreshSessionUseCase } from './auth/auth.use-cases';
import {
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  GetDashboardUseCase,
  ListTransactionsUseCase,
  RefreshQuotesUseCase,
} from './portfolio/portfolio.use-cases';
import { IAuthSessionPort } from '../domain/repositories';

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
