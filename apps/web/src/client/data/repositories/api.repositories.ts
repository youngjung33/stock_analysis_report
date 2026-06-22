import { CreateTransactionInput, LoginResult, SessionResult } from '../../domain/models';
import { IAuthRepository, IPortfolioRepository, ITransactionRepository } from '../../domain/repositories';
import { apiClient } from '../api/client';
import { tokenStorage } from '../auth/token-storage';

export class ApiAuthRepository implements IAuthRepository {
  async login(username: string, password: string): Promise<LoginResult> {
    const { data } = await apiClient.post<LoginResult>('/auth/login', { username, password });
    tokenStorage.setAccessToken(data.accessToken);
    return data;
  }

  async refresh(): Promise<LoginResult | null> {
    const { data } = await apiClient.post<SessionResult>('/auth/refresh');
    if (!data.accessToken || !data.username) {
      tokenStorage.setAccessToken(null);
      return null;
    }
    tokenStorage.setAccessToken(data.accessToken);
    return { accessToken: data.accessToken, username: data.username };
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    tokenStorage.setAccessToken(null);
  }
}

export class ApiTransactionRepository implements ITransactionRepository {
  async create(input: CreateTransactionInput) {
    const { data } = await apiClient.post('/transactions', input);
    return data;
  }

  async list(filters?: { stockId?: string; type?: string }) {
    const { data } = await apiClient.get('/transactions', { params: filters });
    return data;
  }

  async delete(id: string) {
    await apiClient.delete(`/transactions/${id}`);
  }
}

export class ApiPortfolioRepository implements IPortfolioRepository {
  async getDashboard() {
    const { data } = await apiClient.get('/portfolio/dashboard');
    return data;
  }

  async refreshQuotes() {
    const { data } = await apiClient.post('/market/refresh');
    return data;
  }
}
