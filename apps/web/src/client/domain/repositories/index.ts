import {
  CreateTransactionInput,
  Dashboard,
  LoginResult,
  RefreshQuoteResult,
  Transaction,
  User,
} from '../models';

export interface IAuthRepository {
  login(username: string, password: string): Promise<LoginResult>;
  refresh(): Promise<LoginResult | null>;
  logout(): Promise<void>;
}

export interface ITransactionRepository {
  create(input: CreateTransactionInput): Promise<Transaction>;
  list(filters?: { stockId?: string; type?: string }): Promise<Transaction[]>;
  delete(id: string): Promise<void>;
}

export interface IPortfolioRepository {
  getDashboard(): Promise<Dashboard>;
  refreshQuotes(): Promise<RefreshQuoteResult>;
}

export interface IAuthSessionPort {
  onUnauthorized(callback: () => void): void;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
