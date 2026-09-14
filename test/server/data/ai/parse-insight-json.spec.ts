import { describe, expect, it } from 'vitest';
import { parseInsightPayload } from '@/server/data/ai/parse-insight-json';

describe('parseInsightPayload', () => {
  it('parses valid sections JSON', () => {
    const result = parseInsightPayload(
      JSON.stringify({
        sections: [{ id: 'stock.summary', title: '요약', body: '본문' }],
      }),
    );
    expect(result.sections).toHaveLength(1);
  });

  it('throws AI_INVALID_JSON on malformed JSON', () => {
    expect(() => parseInsightPayload('{ not json')).toThrow('AI_INVALID_JSON');
  });

  it('throws on empty sections array', () => {
    expect(() => parseInsightPayload(JSON.stringify({ sections: [] }))).toThrow();
  });

  it('throws when sections missing required fields', () => {
    expect(() =>
      parseInsightPayload(JSON.stringify({ sections: [{ id: 'stock.summary', title: '' }] })),
    ).toThrow();
  });

  it('throws on unexpected top-level shape', () => {
    expect(() => parseInsightPayload(JSON.stringify({ insight: [] }))).toThrow();
  });

  it('throws on non-string body', () => {
    expect(() =>
      parseInsightPayload(
        JSON.stringify({ sections: [{ id: 'stock.summary', title: 't', body: 123 }] }),
      ),
    ).toThrow();
  });
});
