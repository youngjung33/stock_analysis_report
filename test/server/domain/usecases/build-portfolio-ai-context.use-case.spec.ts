import { vi, describe, expect, it } from 'vitest';
import { AppErrorCode, Market, DEFAULT_PORTFOLIO_PREFERENCES } from '@sar/shared';
import { BuildPortfolioAiContextUseCase } from '@/server/domain/usecases/ai/build-portfolio-ai-context.use-case';

function mockDashboard() {
  return {
    summary: {
      totalAssetsKrw: 1000000,
      totalMarketValueKrw: 900000,
      totalUnrealizedPnlKrw: 50000,
      cashKrw: 100000,
      cashUsd: 0,
      holdingsCount: 1,
    },
    holdings: [
      {
        symbol: '005930',
        name: 'Samsung',
        market: Market.KR,
        weightPercent: 90,
      },
    ],
  };
}

function mockAnalysis() {
  return {
    portfolioReturns: [{ period: '1mo', label: '1M', returnPercent: 2, coveragePercent: 100 }],
    benchmarkComparisons: [],
    holdingsInsights: [
      {
        symbol: '005930',
        market: Market.KR,
        name: 'Samsung',
        rsi14: 60,
        news: [{ title: 'News 1', url: 'https://x', source: 's' }],
      },
    ],
    holdingReturns: [],
    fxRate: 1300,
    asOf: new Date().toISOString(),
    allocationByMarket: { krPercent: 90, usPercent: 10 },
  };
}

function mockSimulationBundle() {
  return {
    preferences: { ...DEFAULT_PORTFOLIO_PREFERENCES, investorProfile: null },
    simulation: {
      actions: [{ symbol: '005930', type: 'keep', reasonKey: 'shared.simulation.keep' }],
      stockAllocationByMarket: { krPercent: 90, usPercent: 10 },
    },
    investorProfile: {
      compositePercent: 55,
      typeId: 'balanced',
      preferredTags: ['quality'],
      adjustmentPercent: 0,
    },
    ledgerEntryCount: 2,
    asOf: new Date().toISOString(),
    recommendations: [],
    regimes: [],
  };
}

function createUseCase(overrides: {
  dashboard?: ReturnType<typeof vi.fn>;
  analysis?: ReturnType<typeof vi.fn>;
  simulation?: ReturnType<typeof vi.fn>;
  preferences?: ReturnType<typeof vi.fn>;
  transactions?: ReturnType<typeof vi.fn>;
} = {}) {
  return new BuildPortfolioAiContextUseCase(
    { execute: overrides.dashboard ?? vi.fn().mockResolvedValue(mockDashboard()) } as never,
    { execute: overrides.analysis ?? vi.fn().mockResolvedValue(mockAnalysis()) } as never,
    { execute: overrides.simulation ?? vi.fn().mockResolvedValue(mockSimulationBundle()) } as never,
    {
      execute:
        overrides.preferences ??
        vi.fn().mockResolvedValue({ userId: 'user-1', ...DEFAULT_PORTFOLIO_PREFERENCES, investorProfile: null }),
    } as never,
    {
      execute:
        overrides.transactions ??
        vi.fn().mockResolvedValue([{ memo: '  long term hold  ' }, { memo: '   ' }]),
    } as never,
  );
}

describe('BuildPortfolioAiContextUseCase', () => {
  it('builds portfolio context with analysis and simulation', async () => {
    const result = await createUseCase().execute('user-1', 'ko');

    expect(result.kind).toBe('portfolio');
    expect(result.facts.summary.holdingCount).toBe(1);
    expect(result.facts.holdingsDigest[0].newsTitles).toEqual(['News 1']);
    expect(result.facts.investorProfile?.primaryTypeId).toBe('balanced');
    expect(result.facts.simulation.actions).toHaveLength(1);
    expect(result.contextHash).toHaveLength(16);
  });

  it('degrades when portfolio analysis fails', async () => {
    const result = await createUseCase({
      analysis: vi.fn().mockRejectedValue(new Error('quote timeout')),
    }).execute('user-1', 'ko');

    expect(result.facts.holdingsDigest).toEqual([]);
    expect(result.facts.performance.portfolioReturns).toEqual([]);
  });

  it('degrades when simulation fails', async () => {
    const result = await createUseCase({
      simulation: vi.fn().mockRejectedValue(new Error('simulation error')),
    }).execute('user-1', 'ko');

    expect(result.facts.simulation.actions).toEqual([]);
    expect(result.facts.allocation.actualKrPercent).toBe(0);
    expect(result.facts.investorProfile).toBeNull();
  });

  it('degrades when preferences fail', async () => {
    const result = await createUseCase({
      preferences: vi.fn().mockRejectedValue(new Error('pref db error')),
    }).execute('user-1', 'ko');

    expect(result.facts.allocation.targetKrPercent).toBe(DEFAULT_PORTFOLIO_PREFERENCES.targetKrPercent);
  });

  it('degrades when transactions fail', async () => {
    const result = await createUseCase({
      transactions: vi.fn().mockRejectedValue(new Error('tx list error')),
    }).execute('user-1', 'ko');

    expect(result.facts.holdingsDigest.every((h) => h.memoSample == null)).toBe(true);
  });

  it('throws AI_CONTEXT_UNAVAILABLE when dashboard fails', async () => {
    await expect(
      createUseCase({
        dashboard: vi.fn().mockRejectedValue(new Error('DB_UNAVAILABLE')),
      }).execute('user-1', 'ko'),
    ).rejects.toMatchObject({ code: AppErrorCode.AI_CONTEXT_UNAVAILABLE });
  });
});
