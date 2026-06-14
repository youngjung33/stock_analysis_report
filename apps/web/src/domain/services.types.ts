import { LoginUseCase } from './usecases/auth/login.use-case';
import { LogoutUseCase } from './usecases/auth/logout.use-case';
import { RefreshSessionUseCase } from './usecases/auth/refresh-session.use-case';
import { IAuthSessionPort } from './repositories';
import { GetDashboardUseCase } from './usecases/portfolio/get-dashboard.use-case';
import { RefreshQuotesUseCase } from './usecases/portfolio/refresh-quotes.use-case';
import { CreateTransactionUseCase } from './usecases/transactions/create-transaction.use-case';
import { DeleteTransactionUseCase } from './usecases/transactions/delete-transaction.use-case';
import { ListTransactionsUseCase } from './usecases/transactions/list-transactions.use-case';

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
