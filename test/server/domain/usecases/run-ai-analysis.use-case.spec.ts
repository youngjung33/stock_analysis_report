import { vi, beforeEach, describe, expect, it } from 'vitest';
import { AI_SCHEMA_VERSION, AppErrorCode, stockAiContextSchema } from '@sar/shared';
import { RunAiAnalysisUseCase } from '@/server/domain/usecases/ai/run-ai-analysis.use-case';
import { ValidationError } from '@/server/domain/errors/domain.errors';

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
    countToday: vi.fn().mockResolvedValue(0),
    recordUsage: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { resolveAiProviderForUser } from '@/server/data/ai/resolve-ai-provider';
import { isAiEnabled } from '@/server/data/ai/ai-config';

const baseContext = stockAiContextSchema.parse({
  schemaVersion: AI_SCHEMA_VERSION,
  kind: 'stock',
  locale: 'ko',
  generatedAt: new Date().toISOString(),
  contextHash: 'hash12345678',
  constraints: { maxSections: 5, tone: 'educational', noTradeAdvice: true },
  facts: {
    instrument: { symbol: '005930', name: 'Samsung', market: 'KR', currency: 'KRW' },
    price: { current: 70000, change1d: 1.2, change1w: null, change1mo: null },
    ruleBasedReport: {
      tag: 'hold',
      tagLabel: 'Hold',
      score: 0.5,
      insights: [],
      scoreBreakdown: [],
    },
    technical: null,
    marketLink: { regimeIds: [], indexChange1d: null, leadingSectors: [] },
    userLink: { isHeld: false, isWatchlisted: false, portfolioWeightPercent: null },
    recentNews: [],
  },
});

describe('RunAiAnalysisUseCase', () => {
  beforeEach(() => {
    vi.mocked(isAiEnabled).mockReturnValue(true);
    vi.mocked(resolveAiProviderForUser).mockResolvedValue({
      id: 'gemini',
      model: 'gemini-2.0-flash',
      completeStructured: vi.fn().mockResolvedValue({
        sections: [{ id: 'stock.summary', title: '요약', body: '본문', severity: 'info' }],
      }),
    });
  });

  it('returns validated insight envelope', async () => {
    const useCase = new RunAiAnalysisUseCase();
    const result = await useCase.execute({
      userId: 'user-1',
      kind: 'stock',
      context: baseContext,
      locale: 'ko',
    });
    expect(result.kind).toBe('stock');
    expect(result.sections).toHaveLength(1);
    expect(result.meta.providerId).toBe('gemini');
  });

  it('throws AI_DISABLED when feature is off', async () => {
    vi.mocked(isAiEnabled).mockReturnValue(false);
    const useCase = new RunAiAnalysisUseCase();
    await expect(
      useCase.execute({
        userId: 'user-1',
        kind: 'stock',
        context: baseContext,
        locale: 'ko',
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.AI_DISABLED } satisfies Partial<ValidationError>);
  });
});
