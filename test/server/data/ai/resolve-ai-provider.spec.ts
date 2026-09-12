import { vi, beforeEach, afterEach, describe, expect, it } from 'vitest';

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaUserAiCredentialRepository: vi.fn().mockImplementation(() => ({
    findByUserId: vi.fn().mockResolvedValue(null),
  })),
}));

import { resolveAiProviderForUser } from '@/server/data/ai/resolve-ai-provider';

describe('resolveAiProviderForUser', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  beforeEach(() => {
    process.env.AI_PROVIDER = 'off';
    delete process.env.GOOGLE_AI_API_KEY;
  });

  it('returns null when AI_PROVIDER is off', async () => {
    expect(await resolveAiProviderForUser('user-1')).toBeNull();
  });

  it('builds gemini provider from server key', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GOOGLE_AI_API_KEY = 'server-gemini-key';
    const provider = await resolveAiProviderForUser('user-1');
    expect(provider?.id).toBe('gemini');
    expect(provider?.model).toBeTruthy();
  });
});
