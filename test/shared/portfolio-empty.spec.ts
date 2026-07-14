import { describe, expect, it } from 'vitest';
import { isPortfolioEmpty } from '@sar/shared';

describe('isPortfolioEmpty', () => {
  it('returns true when no holdings and no cash', () => {
    expect(isPortfolioEmpty({ holdingsCount: 0, cashKrw: 0, cashUsd: 0 })).toBe(true);
  });

  it('returns false when cash exists', () => {
    expect(isPortfolioEmpty({ holdingsCount: 0, cashKrw: 1_000_000, cashUsd: 0 })).toBe(false);
  });

  it('returns false when holdings exist', () => {
    expect(isPortfolioEmpty({ holdingsCount: 1, cashKrw: 0, cashUsd: 0 })).toBe(false);
  });
});
