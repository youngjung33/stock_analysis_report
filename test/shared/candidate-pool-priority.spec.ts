import { describe, expect, it } from 'vitest';
import { Market, buildCandidatePool } from '@sar/shared';

describe('buildCandidatePool priority', () => {
  it('prefers holdings over watchlist when cap applies', () => {
    const pool = buildCandidatePool({
      userHoldings: [{ symbol: '999999', market: Market.KR, name: 'Held' }],
      userWatchlist: [{ symbol: '888888', market: Market.KR, name: 'Watched' }],
    });
    const kr = pool.filter((c) => c.market === Market.KR);
    expect(kr.some((c) => c.symbol === '999999' && c.source === 'holding')).toBe(true);
    expect(kr.find((c) => c.symbol === '999999')?.source).toBe('holding');
  });

  it('uses guest baseline when no holdings or watchlist', () => {
    const pool = buildCandidatePool({});
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.some((c) => c.source === 'baseline' && c.symbol === '005930')).toBe(true);
  });

  it('does not add baseline when watchlist is set', () => {
    const pool = buildCandidatePool({
      userWatchlist: [{ symbol: 'GUESTONLY', market: Market.KR, name: '게스트' }],
    });
    expect(pool.some((c) => c.symbol === 'GUESTONLY')).toBe(true);
    expect(pool.some((c) => c.symbol === '005930')).toBe(false);
  });
});
