import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { resolveMarketPersonalization } from '@/server/http/market-personalization';

const authUser = { userId: 'user-1', username: 'tester' };

describe('resolveMarketPersonalization', () => {
  beforeEach(() => {
    vi.mocked(getServerServices).mockReturnValue({
      tokenService: {
        verifyAccessToken: vi.fn().mockReturnValue({ sub: authUser.userId, username: authUser.username }),
      },
      getDashboardUseCase: {
        execute: vi.fn().mockResolvedValue({
          holdings: [{ symbol: '005930', market: Market.KR, name: '삼성전자' }],
        }),
      },
      listWatchlistUseCase: {
        execute: vi.fn().mockResolvedValue([{ id: 'w1', symbol: 'AAPL', market: Market.US, name: 'Apple' }]),
      },
      getPortfolioPreferencesUseCase: {
        execute: vi.fn().mockResolvedValue({
          userId: authUser.userId,
          targetKrPercent: 70,
          targetUsPercent: 30,
          maxSingleWeightPercent: 40,
          investorProfile: null,
        }),
      },
    } as never);
  });

  it('loads holdings and watchlist for authenticated requests', async () => {
    const req = new NextRequest('http://localhost/api/market/sentiment-summary', {
      headers: { authorization: 'Bearer test-token' },
    });

    const result = await resolveMarketPersonalization(req);
    expect(result?.userHoldings?.[0]).toEqual({
      symbol: '005930',
      market: Market.KR,
      name: '삼성전자',
    });
    expect(result?.userWatchlist?.[0]?.symbol).toBe('AAPL');
  });

  it('uses guest body when unauthenticated', async () => {
    const req = new NextRequest('http://localhost/api/market/sentiment-summary', {
      method: 'POST',
    });
    const body = {
      userWatchlist: [{ symbol: 'TSLA', market: Market.US, name: 'Tesla' }],
    };

    const result = await resolveMarketPersonalization(req, body);
    expect(result?.userWatchlist).toEqual(body.userWatchlist);
  });
});
