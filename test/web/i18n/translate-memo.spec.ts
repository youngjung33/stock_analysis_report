import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import ko from '@/i18n/locales/ko.json';
import en from '@/i18n/locales/en.json';
import { translateLedgerMemo } from '@/i18n/translate-memo';

function makeT(bundle: typeof ko): TFunction {
  return ((key: string, params?: Record<string, string>) => {
    const parts = key.split('.');
    let value: unknown = bundle;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
      value,
    );
  }) as TFunction;
}

describe('translateLedgerMemo', () => {
  it('translates machine-readable cash memos', () => {
    const tKo = makeT(ko);
    const tEn = makeT(en);

    expect(translateLedgerMemo('DEPOSIT:KRW', tKo)).toBe('입금');
    expect(translateLedgerMemo('DEPOSIT:KRW', tEn)).toBe('Deposit');
    expect(translateLedgerMemo('INITIAL:USD', tKo)).toBe('투자 원금 (USD)');
    expect(translateLedgerMemo('WITHDRAW:USD', tEn)).toBe('Withdrawal');
  });

  it('translates legacy localized cash memos', () => {
    const tKo = makeT(ko);
    expect(translateLedgerMemo('투자 원금', tKo)).toBe('투자 원금');
    expect(translateLedgerMemo('Deposit', makeT(en))).toBe('Deposit');
  });

  it('still translates trade memos', () => {
    const tKo = makeT(ko);
    expect(translateLedgerMemo('AAPL BUY', tKo)).toBe(ko.transactions.memo.trade
      .replace('{{symbol}}', 'AAPL')
      .replace('{{side}}', ko.transactions.form.buy));
  });

  it('translates KR sell memo with securities tax', () => {
    const tKo = makeT(ko);
    expect(translateLedgerMemo('005930 SELL|STT:2000', tKo)).toContain('005930');
    expect(translateLedgerMemo('005930 SELL|STT:2000', tKo)).toContain('2,000');
  });

  it('translates trade memo with commission', () => {
    const tKo = makeT(ko);
    const result = translateLedgerMemo('005930 BUY|FEE:1500', tKo);
    expect(result).toContain('005930');
    expect(result).toContain('1,500');
  });

  it('translates KR sell memo with STT and commission', () => {
    const tKo = makeT(ko);
    const result = translateLedgerMemo('005930 SELL|STT:2000|FEE:500', tKo);
    expect(result).toContain('005930');
    expect(result).toContain('2,000');
    expect(result).toContain('500');
  });
});
