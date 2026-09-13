import { describe, expect, it } from 'vitest';
import { containsTradeAdvice, sanitizeInsightSections } from '@sar/shared';

describe('AI insight sanitize', () => {
  it('drops unknown section ids and trade advice', () => {
    const out = sanitizeInsightSections(
      [
        { id: 'stock.summary', title: '요약', body: '본문' },
        { id: 'invalid.id', title: 'x', body: 'y' },
        { id: 'stock.priceContext', title: '가격', body: '지금 매수하세요' },
        { id: 'stock.catalysts', title: '촉매', body: '뉴스 제목 인용' },
      ],
      'stock',
    );
    expect(out.map((s) => s.id)).toEqual(['stock.summary', 'stock.catalysts']);
  });

  it('detects trade advice patterns', () => {
    expect(containsTradeAdvice('strong buy signal')).toBe(true);
    expect(containsTradeAdvice('참고용 맥락 설명')).toBe(false);
  });
});
