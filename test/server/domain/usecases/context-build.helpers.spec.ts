import { describe, expect, it, vi } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import {
  rethrowAiContextUnavailable,
  withContextFallback,
} from '@/server/domain/usecases/ai/context-build.helpers';

describe('withContextFallback', () => {
  it('returns result on success', async () => {
    const result = await withContextFallback('test', 'fallback', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('returns fallback and logs on failure', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await withContextFallback('test.label', { empty: true }, async () => {
      throw new Error('upstream down');
    });
    expect(result).toEqual({ empty: true });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('rethrowAiContextUnavailable maps dependency errors', () => {
    try {
      rethrowAiContextUnavailable(new Error('STOCK_ANALYSIS_UNAVAILABLE'));
      expect.unreachable('should throw');
    } catch (error) {
      expect(error).toMatchObject({ code: AppErrorCode.AI_CONTEXT_UNAVAILABLE });
    }
  });
});
