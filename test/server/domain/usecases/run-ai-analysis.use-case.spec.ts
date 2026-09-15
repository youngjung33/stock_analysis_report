import { vi, beforeEach, describe, expect, it } from 'vitest';
import {
  AI_SCHEMA_VERSION,
  aiInsightEnvelopeSchema,
  AppErrorCode,
  stockAiContextSchema,
} from '@sar/shared';
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
import { isAiEnabled } from '@/server/data/ai/ai-config';
import { clearAiInsightMemoryCacheForTests } from '@/server/data/ai/insight-memory-cache';

const validSection = {
  id: 'stock.summary',
  title: '요약',
  body: '본문',
  severity: 'info' as const,
};

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
    recentNewsTitles: [],
    recentEvent: null,
    derived: {
      priceTrendBand: 'flat',
      rsiZone: null,
      newsTone: null,
      eventHint: null,
      ruleTag: 'hold',
    },
  },
});

function mockProvider(
  completeStructured: ReturnType<typeof vi.fn>,
  id = 'gemini',
) {
  vi.mocked(resolveAiProviderForUser).mockResolvedValue({
    id,
    model: 'gemini-2.0-flash',
    completeStructured,
  });
}

describe('RunAiAnalysisUseCase', () => {
  beforeEach(() => {
    clearAiInsightMemoryCacheForTests();
    mockReserveUsage.mockReset();
    mockDeleteUsage.mockReset();
    mockReserveUsage.mockResolvedValue('usage-1');
    mockDeleteUsage.mockResolvedValue(undefined);
    vi.mocked(isAiEnabled).mockReturnValue(true);
    mockProvider(vi.fn().mockResolvedValue({ sections: [validSection] }));
  });

  const baseInput = {
    userId: 'user-1',
    kind: 'stock' as const,
    context: baseContext,
    locale: 'ko' as const,
  };

  it('returns validated insight envelope', async () => {
    const result = await new RunAiAnalysisUseCase().execute(baseInput);
    expect(result.kind).toBe('stock');
    expect(result.sections).toHaveLength(1);
    expect(result.meta.fromCache).toBe(false);
    expect(mockReserveUsage).toHaveBeenCalledOnce();
    expect(mockDeleteUsage).not.toHaveBeenCalled();
  });

  it('returns cached insight on second call without provider or quota usage', async () => {
    const completeStructured = vi.fn().mockResolvedValue({ sections: [validSection] });
    mockProvider(completeStructured);
    const useCase = new RunAiAnalysisUseCase();

    const first = await useCase.execute(baseInput);
    expect(first.meta.fromCache).toBe(false);

    mockReserveUsage.mockResolvedValue(null);

    const second = await useCase.execute(baseInput);
    expect(second.meta.fromCache).toBe(true);
    expect(completeStructured).toHaveBeenCalledTimes(1);
    expect(mockReserveUsage).toHaveBeenCalledTimes(1);
  });

  it('cache miss when contextHash changes', async () => {
    const completeStructured = vi.fn().mockResolvedValue({ sections: [validSection] });
    mockProvider(completeStructured);
    const useCase = new RunAiAnalysisUseCase();

    await useCase.execute(baseInput);
    await useCase.execute({
      ...baseInput,
      context: { ...baseContext, contextHash: 'otherhash99999' },
    });

    expect(completeStructured).toHaveBeenCalledTimes(2);
    expect(mockReserveUsage).toHaveBeenCalledTimes(2);
  });

  it('cache miss when locale changes', async () => {
    const completeStructured = vi.fn().mockResolvedValue({ sections: [validSection] });
    mockProvider(completeStructured);
    const useCase = new RunAiAnalysisUseCase();

    await useCase.execute(baseInput);
    await useCase.execute({ ...baseInput, locale: 'en' });

    expect(completeStructured).toHaveBeenCalledTimes(2);
  });

  it('retries once and succeeds on second provider attempt', async () => {
    const completeStructured = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce({ sections: [validSection] });
    mockProvider(completeStructured);

    const result = await new RunAiAnalysisUseCase().execute(baseInput);
    expect(result.sections).toHaveLength(1);
    expect(completeStructured).toHaveBeenCalledTimes(2);
  });

  it('throws AI_PROVIDER_ERROR when provider fails twice', async () => {
    const completeStructured = vi.fn().mockRejectedValue(new Error('fail'));
    mockProvider(completeStructured);

    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_PROVIDER_ERROR,
    });
    expect(completeStructured).toHaveBeenCalledTimes(2);
    expect(mockReserveUsage).toHaveBeenCalledOnce();
    expect(mockDeleteUsage).toHaveBeenCalledWith('usage-1');
  });

  it('throws AI_PROVIDER_ERROR when provider returns invalid payload', async () => {
    mockProvider(vi.fn().mockResolvedValue({ sections: [] }));

    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_PROVIDER_ERROR,
    });
    expect(mockDeleteUsage).toHaveBeenCalledWith('usage-1');
  });

  it('throws AI_PROVIDER_ERROR when all sections filtered as garbage', async () => {
    mockProvider(
      vi.fn().mockResolvedValue({
        sections: [
          { id: 'not.a.real.id', title: 'x', body: 'y' },
          { id: 'stock.summary', title: 'bad', body: 'strong buy now' },
        ],
      }),
    );

    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_PROVIDER_ERROR,
    });
  });

  it('keeps only valid sections from mixed provider response', async () => {
    mockProvider(
      vi.fn().mockResolvedValue({
        sections: [
          { id: 'bogus', title: 'x', body: 'y' },
          { id: 'stock.summary', title: '요약', body: '정상 본문' },
          { id: 'stock.catalysts', title: '촉매', body: 'must sell now' },
          { id: 'stock.openQuestions', title: '질문', body: '확인 포인트' },
        ],
      }),
    );

    const result = await new RunAiAnalysisUseCase().execute(baseInput);
    expect(result.sections.map((s) => s.id)).toEqual(['stock.summary', 'stock.openQuestions']);
  });

  it('throws AI_QUOTA_EXCEEDED when daily limit reached', async () => {
    mockReserveUsage.mockResolvedValue(null);

    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_QUOTA_EXCEEDED,
    });
    expect(mockDeleteUsage).not.toHaveBeenCalled();
  });

  it('releases reserved quota when envelope parse fails', async () => {
    vi.spyOn(aiInsightEnvelopeSchema, 'parse').mockImplementationOnce(() => {
      throw new Error('envelope schema mismatch');
    });

    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_PROVIDER_ERROR,
    });
    expect(mockDeleteUsage).toHaveBeenCalledWith('usage-1');
  });

  it('throws AI_DISABLED when feature is off', async () => {
    vi.mocked(isAiEnabled).mockReturnValue(false);
    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_DISABLED,
    });
  });

  it('throws AI_DISABLED when no provider resolved', async () => {
    vi.mocked(resolveAiProviderForUser).mockResolvedValue(null);
    await expect(new RunAiAnalysisUseCase().execute(baseInput)).rejects.toMatchObject({
      code: AppErrorCode.AI_DISABLED,
    });
  });

  it('uses English disclaimer for en locale', async () => {
    const result = await new RunAiAnalysisUseCase().execute({ ...baseInput, locale: 'en' });
    expect(result.disclaimer).toContain('reference only');
  });
});
