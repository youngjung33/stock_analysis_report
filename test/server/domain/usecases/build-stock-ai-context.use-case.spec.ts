import { vi, describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { BuildStockAiContextUseCase } from '@/server/domain/usecases/ai/build-stock-ai-context.use-case';

function mockReport() {
  return {
    symbol: '005930',
    name: 'Samsung',
    market: Market.KR,
    currency: 'KRW',
    currentPrice: 70000,
    changePercent1d: 1.2,
    changePercent1w: 2.5,
    changePercent1mo: -0.5,
    tag: 'hold',
    tagLabel: 'Hold',
    score: 0.5,
    insights: [{ category: 'stockAction', title: 't', summary: 's' }],
    scoreBreakdown: [{ factor: 'momentum', delta: 0.1 }],
  };
}

function mockDashboard() {
  return {
    summary: { totalAssetsKrw: 1000000, totalMarketValueKrw: 900000, cashKrw: 100000, cashUsd: 0 },
    holdings: [
      {
        symbol: '005930',
        market: Market.KR,
        marketValueKrw: 700000,
        unrealizedPnlPercent: 5,
        weightPercent: 70,
      },
    ],
  };
}

function createUseCase(overrides: {
  report?: ReturnType<typeof vi.fn>;
  market?: ReturnType<typeof vi.fn>;
  enrichment?: ReturnType<typeof vi.fn>;
  dashboard?: ReturnType<typeof vi.fn>;
} = {}) {
  return new BuildStockAiContextUseCase(
    { execute: overrides.report ?? vi.fn().mockResolvedValue(mockReport()) } as never,
    {
      execute:
        overrides.market ??
        vi.fn().mockResolvedValue({
          macro: [{ interpretKey: 'risk_on' }],
          indices: [{ changePercent1d: 0.5 }],
          sectors: [{ name: 'Tech' }],
        }),
    } as never,
    {
      execute:
        overrides.enrichment ??
        vi.fn().mockResolvedValue({
          technicalSnapshots: [
            { symbol: '005930', market: Market.KR, rsi14: 55, trendKey: 'up' },
          ],
          newsSnapshots: [
            {
              symbol: '005930',
              market: Market.KR,
              recentTitles: ['News A'],
              headlineSample: 'News A',
              tone: 'neutral',
            },
          ],
          eventSnapshots: [
            {
              symbol: '005930',
              market: Market.KR,
              kind: 'earnings',
              eventDay: '2026-09-01',
              source: 'test',
            },
          ],
        }),
    } as never,
    { execute: overrides.dashboard ?? vi.fn().mockResolvedValue(mockDashboard()) } as never,
  );
}

const baseInput = {
  userId: 'user-1',
  symbol: '005930',
  name: 'Samsung',
  market: Market.KR,
  locale: 'ko' as const,
  userWatchlist: [{ symbol: '005930', market: Market.KR }],
};

describe('BuildStockAiContextUseCase', () => {
  it('builds full stock context with enrichment and user link', async () => {
    const result = await createUseCase().execute(baseInput);

    expect(result.kind).toBe('stock');
    expect(result.facts.instrument.symbol).toBe('005930');
    expect(result.facts.technical?.rsi14).toBe(55);
    expect(result.facts.recentNewsTitles).toEqual(['News A']);
    expect(result.facts.recentEvent?.kind).toBe('earnings');
    expect(result.facts.userLink.isHeld).toBe(true);
    expect(result.facts.userLink.isWatchlisted).toBe(true);
    expect(result.contextHash).toHaveLength(16);
  });

  it('continues with null enrichment when enrichment fetch fails', async () => {
    const result = await createUseCase({
      enrichment: vi.fn().mockRejectedValue(new Error('news provider down')),
    }).execute(baseInput);

    expect(result.facts.technical).toBeNull();
    expect(result.facts.recentNewsTitles).toEqual([]);
    expect(result.facts.recentEvent).toBeNull();
    expect(result.facts.derived.rsiZone).toBeNull();
  });

  it('uses empty market link when market context fails', async () => {
    const result = await createUseCase({
      market: vi.fn().mockRejectedValue(new Error('fx unavailable')),
    }).execute(baseInput);

    expect(result.facts.marketLink.regimeIds).toEqual([]);
    expect(result.facts.marketLink.leadingSectors).toEqual([]);
    expect(result.facts.marketLink.indexChange1d).toBeNull();
  });

  it('propagates report failure', async () => {
    await expect(
      createUseCase({
        report: vi.fn().mockRejectedValue(new Error('STOCK_ANALYSIS_UNAVAILABLE')),
      }).execute(baseInput),
    ).rejects.toThrow('STOCK_ANALYSIS_UNAVAILABLE');
  });

  it('propagates dashboard failure', async () => {
    await expect(
      createUseCase({
        dashboard: vi.fn().mockRejectedValue(new Error('DB_UNAVAILABLE')),
      }).execute(baseInput),
    ).rejects.toThrow('DB_UNAVAILABLE');
  });
});
