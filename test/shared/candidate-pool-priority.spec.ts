import { describe, expect, it } from 'vitest';
import { Market, buildCandidatePool } from '@sar/shared';

describe('buildCandidatePool priority', () => {
  it('prefers holdings over sector when cap applies', () => {
    const pool = buildCandidatePool({
      userHoldings: [{ symbol: '999999', market: Market.KR, name: 'Rare KR' }],
      profileSymbols: [{ symbol: '888888', market: Market.KR }],
    });
    const kr = pool.filter((c) => c.market === Market.KR);
    expect(kr.some((c) => c.symbol === '999999' && c.source === 'holding')).toBe(true);
    expect(kr[0]?.source).toBe('holding');
  });
});
