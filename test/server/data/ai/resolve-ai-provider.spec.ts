import { vi, beforeEach, afterEach, describe, expect, it } from 'vitest';

const { mockFindByUserId } = vi.hoisted(() => ({
  mockFindByUserId: vi.fn(),
}));

vi.mock('@/server/data/persistence/ai.repositories', () => ({
  PrismaUserAiCredentialRepository: vi.fn().mockImplementation(() => ({
    findByUserId: mockFindByUserId,
  })),
}));

import { resolveAiProviderForUser } from '@/server/data/ai/resolve-ai-provider';

describe('resolveAiProviderForUser', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    mockFindByUserId.mockReset();
  });

  beforeEach(() => {
    process.env.AI_PROVIDER = 'off';
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_CUSTOM_ENDPOINT;
    mockFindByUserId.mockResolvedValue(null);
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

  it('returns null when server API key missing', async () => {
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    expect(await resolveAiProviderForUser('user-1')).toBeNull();
  });

  it('returns null for custom provider without endpoint', async () => {
    process.env.AI_PROVIDER = 'custom';
    delete process.env.AI_CUSTOM_ENDPOINT;
    expect(await resolveAiProviderForUser('user-1')).toBeNull();
  });

  it('falls back to server key when BYOK decrypt fails', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GOOGLE_AI_API_KEY = 'server-gemini-key';
    mockFindByUserId.mockResolvedValue({
      provider: 'gemini',
      encryptedKey: 'invalid-base64!!!',
      keyIv: 'invalid-iv!!!',
    });
    const provider = await resolveAiProviderForUser('user-1');
    expect(provider?.id).toBe('gemini');
  });
});
