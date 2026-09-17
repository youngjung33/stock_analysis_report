import { vi, beforeEach, describe, expect, it } from 'vitest';
import {
  AI_SCHEMA_VERSION,
  AppErrorCode,
  Market,
  stockAiContextSchema,
} from '@sar/shared';
import { BuildStockAiContextUseCase } from '@/server/domain/usecases/ai/build-stock-ai-context.use-case';
import { RunAiAnalysisUseCase } from '@/server/domain/usecases/ai/run-ai-analysis.use-case';
import { ValidationError } from '@/server/domain/errors/domain.errors';

const mockReserveUsage = vi.fn();
const mockDeleteUsage = vi.fn();

vi.mock('@/server/data/ai/ai-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/data/ai/ai-config')>();
  return { ...actual, isAiEnabled: vi.fn().mockReturnValue(true) };
});

vi.mock('@/server/data/ai/load-prompt', () => ({
  loadAiPrompt: vi.fn().mockReturnValue('system prompt'),
}));

vi.mock('@/server/data/ai/resolve-ai-provider', () => ({
  resolveAiProviderForUser: vi.fn(),
}));

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaAiUsageRepository: vi.fn().mockImplementation(() => ({
    reserveUsage: mockReserveUsage,
    deleteUsage: mockDeleteUsage,
  })),
}));

import { resolveAiProviderForUser } from '@/server/data/ai/resolve-ai-provider';
import { clearAiInsightMemoryCacheForTests } from '@/server/data/ai/insight-memory-cache';

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
    holdings: [],
  };
}

describe('AI pipeline integration', () => {
  beforeEach(() => {
    clearAiInsightMemoryCacheForTests();
    mockReserveUsage.mockReset();
    mockDeleteUsage.mockReset();
    mockReserveUsage.mockResolvedValue('usage-1');
    mockDeleteUsage.mockResolvedValue(undefined);
    vi.mocked(resolveAiProviderForUser).mockResolvedValue({
      id: 'gemini',
      model: 'gemini-2.0-flash',
      completeStructured: vi.fn().mockResolvedValue({
        sections: [{ id: 'stock.summary', title: '요약', body: '본문' }],
      }),
    });
  });

  it('builds context then runs analysis end-to-end', async () => {
    const buildContext = new BuildStockAiContextUseCase(
      { execute: vi.fn().mockResolvedValue(mockReport()) } as never,
      {
        execute: vi.fn().mockResolvedValue({ macro: [], sectors: [], indices: [] }),
      } as never,
      {
        execute: vi.fn().mockResolvedValue({
          technicalSnapshots: [],
          newsSnapshots: [],
          eventSnapshots: [],
        }),
      } as never,
      { execute: vi.fn().mockResolvedValue(mockDashboard()) } as never,
    );

    const context = await buildContext.execute({
      userId: 'user-1',
      symbol: '005930',
      name: 'Samsung',
      market: Market.KR,
      locale: 'ko',
    });
    expect(stockAiContextSchema.safeParse(context).success).toBe(true);

    const insight = await new RunAiAnalysisUseCase().execute({
      userId: 'user-1',
      kind: 'stock',
      context,
      locale: 'ko',
    });

    expect(insight.kind).toBe('stock');
    expect(insight.schemaVersion).toBe(AI_SCHEMA_VERSION);
    expect(insight.sections[0].id).toBe('stock.summary');
    expect(insight.meta.fromCache).toBe(false);
  });

  it('stops pipeline with AI_CONTEXT_UNAVAILABLE when report fails', async () => {
    const buildContext = new BuildStockAiContextUseCase(
      { execute: vi.fn().mockRejectedValue(new Error('STOCK_ANALYSIS_UNAVAILABLE')) } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn().mockResolvedValue(mockDashboard()) } as never,
    );

    await expect(
      buildContext.execute({
        userId: 'user-1',
        symbol: '005930',
        name: 'Samsung',
        market: Market.KR,
        locale: 'ko',
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.AI_CONTEXT_UNAVAILABLE });
  });

  it('maps route-level context errors to ValidationError shape', async () => {
    const error = new ValidationError(AppErrorCode.AI_CONTEXT_UNAVAILABLE);
    expect(error.code).toBe(AppErrorCode.AI_CONTEXT_UNAVAILABLE);
    expect(error.message).toContain('시세');
  });
});
