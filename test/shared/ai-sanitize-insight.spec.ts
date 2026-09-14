import { describe, expect, it } from 'vitest';
import {
  AI_INSIGHT_SECTION_MAX,
  AI_SECTION_BODY_MAX,
  containsTradeAdvice,
  sanitizeInsightSections,
} from '@sar/shared';

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

  it('returns empty when all sections are invalid or filtered', () => {
    expect(
      sanitizeInsightSections(
        [
          { id: 'wrong.id', title: 't', body: 'b' },
          { id: 'stock.summary', title: '매수', body: 'strong buy now' },
        ],
        'stock',
      ),
    ).toEqual([]);
  });

  it('drops duplicate section ids (keeps first)', () => {
    const out = sanitizeInsightSections(
      [
        { id: 'stock.summary', title: '첫', body: '본문1' },
        { id: 'stock.summary', title: '둘', body: '본문2' },
        { id: 'stock.catalysts', title: '촉매', body: 'ok' },
      ],
      'stock',
    );
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('첫');
  });

  it('drops empty id/title/body after trim', () => {
    const out = sanitizeInsightSections(
      [
        { id: '  ', title: 't', body: 'b' },
        { id: 'stock.summary', title: '  ', body: 'b' },
        { id: 'stock.catalysts', title: 't', body: '  ' },
        { id: 'stock.openQuestions', title: 'ok', body: 'ok' },
      ],
      'stock',
    );
    expect(out.map((s) => s.id)).toEqual(['stock.openQuestions']);
  });

  it('truncates overly long body', () => {
    const longBody = '가'.repeat(AI_SECTION_BODY_MAX + 50);
    const out = sanitizeInsightSections(
      [{ id: 'stock.summary', title: '요약', body: longBody }],
      'stock',
    );
    expect(out[0].body.length).toBe(AI_SECTION_BODY_MAX + 1);
    expect(out[0].body.endsWith('…')).toBe(true);
  });

  it('keeps at most AI_INSIGHT_SECTION_MAX valid sections', () => {
    const ids = [
      'portfolio.summary',
      'portfolio.allocation',
      'portfolio.profileFit',
      'portfolio.riskWatch',
      'portfolio.nextQuestions',
    ];
    const sections = [
      ...ids.map((id) => ({ id, title: 't', body: 'b' })),
      ...ids.map((id, i) => ({ id, title: `dup${i}`, body: 'dup' })),
    ];
    const out = sanitizeInsightSections(sections, 'portfolio');
    expect(out.length).toBeLessThanOrEqual(AI_INSIGHT_SECTION_MAX);
    expect(out.length).toBe(5);
  });

  it('uses portfolio whitelist separately from stock', () => {
    const out = sanitizeInsightSections(
      [
        { id: 'stock.summary', title: 'wrong kind', body: 'for portfolio' },
        { id: 'portfolio.summary', title: 'ok', body: 'ok' },
      ],
      'portfolio',
    );
    expect(out.map((s) => s.id)).toEqual(['portfolio.summary']);
  });

  describe('containsTradeAdvice', () => {
    it.each([
      ['strong buy signal', true],
      ['must sell immediately', true],
      ['지금 매수하세요', true],
      ['적극 매도 검토', true],
      ['전량 매수 추천', true],
      ['참고용 맥락 설명', false],
      ['가격 변동 요약', false],
    ])('"%s" → %s', (text, expected) => {
      expect(containsTradeAdvice(text)).toBe(expected);
    });
  });
});
