import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  buildStockEventFromKrDisclosure,
  classifyKrDisclosureReport,
  resolveKrCorpCode,
} from '@sar/shared';

function isoDayOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

describe('kr-disclosure-enrichment (Phase L)', () => {
  it('resolveKrCorpCode maps featured symbols', () => {
    expect(resolveKrCorpCode('005930')).toBe('00126380');
    expect(resolveKrCorpCode('999999')).toBeNull();
  });

  it('classifyKrDisclosureReport detects buyback and dividend', () => {
    expect(classifyKrDisclosureReport('자기주식 취득 결정')).toBe('buyback');
    expect(classifyKrDisclosureReport('현금·현물 배당 결정')).toBe('dividend');
    expect(classifyKrDisclosureReport('분기보고서 (2026.03)')).toBe('earnings_neutral');
  });

  it('buildStockEventFromKrDisclosure prefers buyback over earnings report', () => {
    const snap = buildStockEventFromKrDisclosure({
      symbol: '005930',
      market: Market.KR,
      disclosures: [
        {
          reportName: '분기보고서 (2026.06)',
          receiptDate: isoDayOffset(0).replace(/-/g, ''),
        },
        {
          reportName: '자기주식 취득 결정',
          receiptDate: isoDayOffset(0).replace(/-/g, ''),
        },
      ],
    });
    expect(snap?.kind).toBe('buyback');
    expect(snap?.source).toBe('dart');
    expect(snap?.eventDay).toBe('D0');
  });

  it('resolveKrCorpCode prefers catalog over static fallback', () => {
    expect(resolveKrCorpCode('005930', { '005930': '00999999' })).toBe('00999999');
    expect(resolveKrCorpCode('999999', { '999999': '00111111' })).toBe('00111111');
    expect(resolveKrCorpCode('005930')).toBe('00126380');
  });
});
