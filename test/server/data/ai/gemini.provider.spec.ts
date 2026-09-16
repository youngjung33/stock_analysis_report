import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiProvider } from '@/server/data/ai/gemini.provider';
import { minimalAiRequest, validInsightPayload } from './provider-test-helpers';

describe('GeminiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws GEMINI_HTTP_429 on rate limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }),
    );
    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow('GEMINI_HTTP_429');
  });

  it('throws GEMINI_EMPTY_RESPONSE when candidates missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) }),
    );
    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow(
      'GEMINI_EMPTY_RESPONSE',
    );
  });

  it('parses valid JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: validInsightPayload }] } }],
        }),
      }),
    );
    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash');
    const result = await provider.completeStructured(minimalAiRequest);
    expect(result.sections[0].id).toBe('stock.summary');
  });

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const provider = new GeminiProvider('test-key', 'gemini-2.0-flash');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow('network down');
  });
});
