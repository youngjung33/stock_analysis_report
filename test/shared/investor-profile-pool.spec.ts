import { describe, expect, it } from 'vitest';
import {
  Market,
  buildInvestorProfile,
  buildInvestorProfilePoolSymbols,
  createDefaultStoredProfile,
} from '@sar/shared';

describe('buildInvestorProfilePoolSymbols', () => {
  it('returns sector-aligned symbols for default profile', () => {
    const built = buildInvestorProfile(createDefaultStoredProfile());
    const symbols = buildInvestorProfilePoolSymbols(built);
    expect(symbols.length).toBeGreaterThan(0);
    expect(symbols.some((s) => s.market === Market.KR)).toBe(true);
    expect(symbols.some((s) => s.market === Market.US)).toBe(true);
  });
});
