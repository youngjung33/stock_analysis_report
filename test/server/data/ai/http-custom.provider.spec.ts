import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpCustomProvider } from '@/server/data/ai/http-custom.provider';
import { minimalAiRequest, validInsightPayload } from './provider-test-helpers';

describe('HttpCustomProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws CUSTOM_HTTP_500 on server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    const provider = new HttpCustomProvider('https://custom.example/analyze', 'key', 'custom-v1');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow('CUSTOM_HTTP_500');
  });

  it('throws CUSTOM_EMPTY_RESPONSE on empty body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    const provider = new HttpCustomProvider('https://custom.example/analyze', 'key', 'custom-v1');
    await expect(provider.completeStructured(minimalAiRequest)).rejects.toThrow(
      'CUSTOM_EMPTY_RESPONSE',
    );
  });

  it('parses raw sections payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => JSON.parse(validInsightPayload),
      }),
    );
    const provider = new HttpCustomProvider('https://custom.example/analyze', 'key', 'custom-v1');
    const result = await provider.completeStructured(minimalAiRequest);
    expect(result.sections[0].id).toBe('stock.summary');
  });

  it('parses dedicated analyze response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          insight: {
            schemaVersion: '1.0',
            kind: 'stock',
            locale: 'ko',
            disclaimer: 'For reference only',
            sections: JSON.parse(validInsightPayload).sections,
          },
        }),
      }),
    );
    const provider = new HttpCustomProvider('https://custom.example/analyze', undefined, 'custom-v1');
    const result = await provider.completeStructured(minimalAiRequest);
    expect(result.sections).toHaveLength(1);
  });
});
