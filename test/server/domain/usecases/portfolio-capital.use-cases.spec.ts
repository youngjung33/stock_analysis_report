import { describe, expect, it, vi } from 'vitest';
import { UpdatePortfolioPreferencesUseCase } from '@server/domain/usecases/portfolio/portfolio-capital.use-cases';

describe('UpdatePortfolioPreferencesUseCase', () => {
  it('clamps preference percents before upsert', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const useCase = new UpdatePortfolioPreferencesUseCase({ upsert } as never);

    await useCase.execute({
      userId: 'user-1',
      targetKrPercent: 150,
      targetUsPercent: -10,
      maxSingleWeightPercent: 2,
      investorProfile: null,
    });

    expect(upsert).toHaveBeenCalledWith({
      userId: 'user-1',
      targetKrPercent: 100,
      targetUsPercent: 0,
      maxSingleWeightPercent: 5,
      investorProfile: null,
    });
  });
});
