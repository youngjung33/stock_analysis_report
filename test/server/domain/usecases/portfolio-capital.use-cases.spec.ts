import { describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  GetPortfolioSimulationUseCase,
  UpdatePortfolioPreferencesUseCase,
} from '@server/domain/usecases/portfolio/portfolio-capital.use-cases';

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

describe('GetPortfolioSimulationUseCase', () => {
  it('combines dashboard, featured quotes, cash, and preferences', async () => {
    const dashboardUseCase = {
      execute: vi.fn().mockResolvedValue({
        summary: { cashKrw: 1_000_000, cashUsd: 0, usdKrwRate: 1300, holdingsCount: 1 },
        holdings: [
          {
            symbol: '005930',
            name: '삼성전자',
            market: Market.KR,
            currency: 'KRW',
            quantity: 10,
            currentPrice: 80000,
            marketValueKrw: 800_000,
            weightPercent: 100,
          },
        ],
        lastRefreshedAt: null,
      }),
    };
    const featuredQuotesUseCase = {
      execute: vi.fn().mockResolvedValue({
        kr: [{ symbol: '000660', name: 'SK하이닉스', market: Market.KR, currency: 'KRW', currentPrice: 200000, changePercent: 1 }],
        us: [],
        fetchedAt: '2026-01-01T00:00:00.000Z',
      }),
    };
    const cashRepo = { findByUser: vi.fn().mockResolvedValue([{ id: 'c1' }]) };
    const prefRepo = { findByUser: vi.fn().mockResolvedValue(null) };
    const watchlistRepo = { findByUser: vi.fn().mockResolvedValue([]) };
    const catalogRepo = { findBySymbols: vi.fn().mockResolvedValue([]) };
    const buildMarketContextUseCase = {
      execute: vi.fn().mockResolvedValue({
        macro: [],
        sectors: [],
        indices: [],
        usdKrwRate: 1300,
        usdKrwChange1d: null,
        indexInputs: [],
        macroInputs: [],
        sectorInputs: [],
      }),
    };
    const buildStockEnrichmentUseCase = {
      execute: vi.fn().mockResolvedValue({ candidateQuotes: [], technicalSnapshots: [], newsSnapshots: [], eventSnapshots: [], figureStatements: [] }),
    };

    const useCase = new GetPortfolioSimulationUseCase(
      dashboardUseCase as never,
      featuredQuotesUseCase as never,
      cashRepo as never,
      prefRepo as never,
      watchlistRepo as never,
      catalogRepo as never,
      buildMarketContextUseCase as never,
      buildStockEnrichmentUseCase as never,
    );

    const result = await useCase.execute('user-1');

    expect(result.ledgerEntryCount).toBe(1);
    expect(result.asOf).toBe('2026-01-01T00:00:00.000Z');
    expect(result.simulation).toBeDefined();
    expect(result.preferences.targetKrPercent).toBe(70);
    expect(dashboardUseCase.execute).toHaveBeenCalledWith('user-1');
  });
});
