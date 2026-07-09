import { vi } from 'vitest';
import { AuthTokenType } from '@sar/shared';
import { IAuthTokenRepository } from '@server/domain/repositories';

export function createMockAuthTokenRepo(
  overrides: Partial<IAuthTokenRepository> = {},
): IAuthTokenRepository {
  return {
    create: vi.fn(),
    invalidateUserTokens: vi.fn(),
    consumeValid: vi.fn(),
    ...overrides,
  };
}

export function createMockEmailSender() {
  return {
    send: vi.fn().mockResolvedValue(undefined),
  };
}

export { AuthTokenType };
