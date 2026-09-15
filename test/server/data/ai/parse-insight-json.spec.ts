import { describe, expect, it } from 'vitest';
import {
  parseInsightPayload,
  stripMarkdownJsonFence,
} from '@/server/data/ai/parse-insight-json';

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

  it('parses JSON wrapped in markdown code fence', () => {
    const inner = JSON.stringify({
      sections: [{ id: 'stock.summary', title: '요약', body: '본문' }],
    });
    const result = parseInsightPayload(`\`\`\`json\n${inner}\n\`\`\``);
    expect(result.sections[0].body).toBe('본문');
  });

  it('stripMarkdownJsonFence leaves plain JSON unchanged', () => {
    const plain = '{"sections":[]}';
    expect(stripMarkdownJsonFence(plain)).toBe(plain);
  });
});
