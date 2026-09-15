import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAiProvider } from '@/server/data/ai/openai.provider';

const validPayload = JSON.stringify({
  sections: [{ id: 'stock.summary', title: 'Summary', body: 'Body text' }],
});

const minimalRequest = {
  systemPrompt: 'prompt',
  context: { kind: 'stock' } as never,
  locale: 'ko' as const,
  maxTokens: 512,
  temperature: 0.2,
};

describe('OpenAiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws OPENAI_HTTP_429 on rate limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }),
    );
    const provider = new OpenAiProvider('test-key', 'gpt-4o-mini');
    await expect(provider.completeStructured(minimalRequest)).rejects.toThrow('OPENAI_HTTP_429');
  });

  it('throws OPENAI_EMPTY_RESPONSE when content missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: {} }] }),
      }),
    );
    const provider = new OpenAiProvider('test-key', 'gpt-4o-mini');
    await expect(provider.completeStructured(minimalRequest)).rejects.toThrow(
      'OPENAI_EMPTY_RESPONSE',
    );
  });

  it('throws AI_INVALID_JSON when model returns non-JSON text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'not json at all' } }] }),
      }),
    );
    const provider = new OpenAiProvider('test-key', 'gpt-4o-mini');
    await expect(provider.completeStructured(minimalRequest)).rejects.toThrow('AI_INVALID_JSON');
  });

  it('parses valid JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: validPayload } }] }),
      }),
    );
    const provider = new OpenAiProvider('test-key', 'gpt-4o-mini');
    const result = await provider.completeStructured(minimalRequest);
    expect(result.sections[0].id).toBe('stock.summary');
  });

  it('throws on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const provider = new OpenAiProvider('test-key', 'gpt-4o-mini');
    await expect(provider.completeStructured(minimalRequest)).rejects.toThrow('network down');
  });

  it('aborts on timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );
    const provider = new OpenAiProvider('test-key', 'gpt-4o-mini');
    const promise = provider.completeStructured(minimalRequest);
    vi.advanceTimersByTime(31_000);
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    vi.useRealTimers();
  });
});
