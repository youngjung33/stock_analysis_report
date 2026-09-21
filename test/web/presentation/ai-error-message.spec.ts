import { describe, expect, it } from 'vitest';
import { AppErrorCode } from '@sar/shared';
import { AppError } from '@/client/domain/errors/app-error';
import { resolveAiFetchErrorMessage } from '@/presentation/features/ai/ai-error-message';

const t = (key: string) => key;

describe('resolveAiFetchErrorMessage', () => {
  it('maps quota exceeded', () => {
    expect(
      resolveAiFetchErrorMessage(new AppError('x', AppErrorCode.AI_QUOTA_EXCEEDED), t),
    ).toBe('ai.quotaExceeded');
  });

  it('maps provider error', () => {
    expect(
      resolveAiFetchErrorMessage(new AppError('x', AppErrorCode.AI_PROVIDER_ERROR), t),
    ).toBe('ai.providerFailed');
  });

  it('maps context unavailable error', () => {
    expect(
      resolveAiFetchErrorMessage(new AppError('x', AppErrorCode.AI_CONTEXT_UNAVAILABLE), t),
    ).toBe('ai.contextUnavailable');
  });

  it('maps disabled error', () => {
    expect(
      resolveAiFetchErrorMessage(new AppError('x', AppErrorCode.AI_DISABLED), t),
    ).toBe('ai.disabled');
  });

  it('maps members only error', () => {
    expect(
      resolveAiFetchErrorMessage(new AppError('x', AppErrorCode.AI_MEMBERS_ONLY), t),
    ).toBe('ai.membersOnly');
  });

  it('maps rate limit error', () => {
    expect(
      resolveAiFetchErrorMessage(new AppError('x', AppErrorCode.RATE_LIMIT), t),
    ).toBe('ai.rateLimited');
  });

  it('falls back for unknown errors', () => {
    expect(resolveAiFetchErrorMessage(new Error('boom'), t)).toBe('ai.loadFailed');
  });
});
