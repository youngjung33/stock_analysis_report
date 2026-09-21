import { describe, expect, it, vi } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import { ValidationError } from '@/server/domain/errors/domain.errors';
import { runAiAnalysisResponse } from '@/server/http/ai-route-helpers';

describe('runAiAnalysisResponse', () => {
  it('returns enabled insight payload', async () => {
    const runAiAnalysisUseCase = {
      execute: vi.fn().mockResolvedValue({ sections: [{ id: 'stock.summary' }] }),
    };

    const res = await runAiAnalysisResponse(runAiAnalysisUseCase as never, {
      userId: 'user-1',
      kind: 'stock',
      context: { kind: 'stock' } as never,
      locale: 'ko',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(true);
    expect(body.insight.sections).toHaveLength(1);
  });

  it('returns disabled payload for AI_DISABLED', async () => {
    const runAiAnalysisUseCase = {
      execute: vi.fn().mockRejectedValue(new ValidationError(AppErrorCode.AI_DISABLED)),
    };

    const res = await runAiAnalysisResponse(runAiAnalysisUseCase as never, {
      userId: 'user-1',
      kind: 'portfolio',
      context: { kind: 'portfolio' } as never,
      locale: 'ko',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });

  it('rethrows non-disabled validation errors', async () => {
    const runAiAnalysisUseCase = {
      execute: vi.fn().mockRejectedValue(new ValidationError(AppErrorCode.AI_QUOTA_EXCEEDED)),
    };

    await expect(
      runAiAnalysisResponse(runAiAnalysisUseCase as never, {
        userId: 'user-1',
        kind: 'stock',
        context: { kind: 'stock' } as never,
        locale: 'ko',
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.AI_QUOTA_EXCEEDED });
  });
});
