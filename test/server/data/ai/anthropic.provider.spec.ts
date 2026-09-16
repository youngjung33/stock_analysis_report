import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from '@/server/data/ai/anthropic.provider';
import { minimalAiRequest, validInsightPayload } from './provider-test-helpers';

describe('AnthropicProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws ANTHROPIC_HTTP_401 on auth failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }),
    );
    const provider = new AnthropicProvider('test-key', 'claude-3-5-haiku-latest');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow(
      'ANTHROPIC_HTTP_401',
    );
  });

  it('throws ANTHROPIC_EMPTY_RESPONSE when text missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [] }) }),
    );
    const provider = new AnthropicProvider('test-key', 'claude-3-5-haiku-latest');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow(
      'ANTHROPIC_EMPTY_RESPONSE',
    );
  });

  it('parses markdown-fenced JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: `\`\`\`json\n${validInsightPayload}\n\`\`\`` }],
        }),
      }),
    );
    const provider = new AnthropicProvider('test-key', 'claude-3-5-haiku-latest');
    const result = await provider.completeStructured(minimalAiRequest);
    expect(result.sections[0].body).toBe('Body text');
  });
});
