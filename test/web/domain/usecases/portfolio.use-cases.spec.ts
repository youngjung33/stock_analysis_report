import { describe, expect, it } from 'vitest';
import { GetDashboardUseCase } from '@/client/domain/usecases/portfolio/get-dashboard.use-case';
import { RefreshQuotesUseCase } from '@/client/domain/usecases/portfolio/refresh-quotes.use-case';
import { createFakePortfolioRepository } from '../../mocks/fake-repositories';

describe('GetDashboardUseCase', () => {
  // WP-01
  it('delegates to portfolio repository getDashboard', async () => {
    const repo = createFakePortfolioRepository();
    const useCase = new GetDashboardUseCase(repo);
    await useCase.execute();
    expect(repo.getDashboard).toHaveBeenCalled();
  });
});

describe('RefreshQuotesUseCase', () => {
  // WP-02
  it('delegates to portfolio repository refreshQuotes', async () => {
    const repo = createFakePortfolioRepository();
    const useCase = new RefreshQuotesUseCase(repo);
    await useCase.execute();
    expect(repo.refreshQuotes).toHaveBeenCalled();
  });
});
