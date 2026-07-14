import { describe, expect, it } from 'vitest';
import { formatAmount, formatAmountInput, parseAmountInput } from '@sar/shared';

describe('amount-format', () => {
  it('formatAmount adds thousand separators', () => {
    expect(formatAmount(10000000, { maxFractionDigits: 0 })).toBe('10,000,000');
    expect(formatAmount(1234.5, { maxFractionDigits: 2 })).toBe('1,234.5');
  });

  it('parseAmountInput strips commas', () => {
    expect(parseAmountInput('10,000,000')).toBe(10000000);
    expect(parseAmountInput('1,234.56')).toBe(1234.56);
    expect(parseAmountInput('')).toBeNaN();
  });

  it('formatAmountInput formats while typing', () => {
    expect(formatAmountInput('1000000', { maxFractionDigits: 0 })).toBe('1,000,000');
    expect(formatAmountInput('5000.25', { maxFractionDigits: 2 })).toBe('5,000.25');
    expect(formatAmountInput('5000.', { maxFractionDigits: 2 })).toBe('5,000.');
  });
});
