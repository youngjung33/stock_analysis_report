import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as getAnalysis, POST as postAnalysis } from '@/app/api/market/analysis/route';

const authUser = { userId: 'user-1', username: 'admin' };
const analysisReport = { krQuotes: [], usQuotes: [], fetchedAt: '2026-01-01T00:00:00.000Z' };

function authedRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, {
    ...init,
    headers: {
      authorization: 'Bearer test-token',
      ...(init?.headers ?? {}),
    },
  });
}

function mockServices(overrides: Record<string, unknown> = {}) {
  const getMarketAnalysisUseCase = {
    execute: vi.fn().mockResolvedValue(analysisReport),
  };
  const getDashboardUseCase = {
    execute: vi.fn().mockResolvedValue({
      summary: { holdingsCount: 1, cashKrw: 1_000_000, cashUsd: 0 },
      holdings: [{ symbol: '005930', market: Market.KR, name: '삼성전자' }],
      lastRefreshedAt: null,
    }),
  };
  const listWatchlistUseCase = {
    execute: vi.fn().mockResolvedValue([{ id: 'wl-1', symbol: 'AAPL', market: Market.US, name: 'Apple' }]),
  };

  vi.mocked(getServerServices).mockReturnValue({
    tokenService: {
      verifyAccessToken: vi.fn().mockReturnValue({ sub: authUser.userId, username: authUser.username }),
    },
    getMarketAnalysisUseCase,
    getDashboardUseCase,
    listWatchlistUseCase,
    ...overrides,
  } as never);

  return { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase };
}

describe('market analysis route personalization', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it('GET with auth loads holdings and watchlist from server', async () => {
    const { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase } = mockServices();

    const res = await getAnalysis(
      authedRequest('http://localhost/api/market/analysis', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      }),
    );

    expect(res.status).toBe(200);
    expect(getDashboardUseCase.execute).toHaveBeenCalledWith(authUser.userId);
    expect(listWatchlistUseCase.execute).toHaveBeenCalledWith(authUser.userId);
    expect(getMarketAnalysisUseCase.execute).toHaveBeenCalledWith({
      userHoldings: [{ symbol: '005930', market: Market.KR }],
      userWatchlist: [{ symbol: 'AAPL', market: Market.US }],
    });
  });

  it('GET without auth does not personalize', async () => {
    const { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase } = mockServices();

    const res = await getAnalysis(
      new NextRequest('http://localhost/api/market/analysis', {
        headers: { 'x-forwarded-for': '10.0.0.2' },
      }),
    );

    expect(res.status).toBe(200);
    expect(getDashboardUseCase.execute).not.toHaveBeenCalled();
    expect(listWatchlistUseCase.execute).not.toHaveBeenCalled();
    expect(getMarketAnalysisUseCase.execute).toHaveBeenCalledWith(undefined);
  });

  it('POST without auth uses guest body holdings and watchlist', async () => {
    const { getMarketAnalysisUseCase, getDashboardUseCase, listWatchlistUseCase } = mockServices();

    const res = await postAnalysis(
      new NextRequest('http://localhost/api/market/analysis', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '10.0.0.3',
        },
        body: JSON.stringify({
          userHoldings: [{ symbol: '035720', market: Market.KR }],
          userWatchlist: [{ symbol: 'TSLA', market: Market.US }],
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(getDashboardUseCase.execute).not.toHaveBeenCalled();
    expect(listWatchlistUseCase.execute).not.toHaveBeenCalled();
    expect(getMarketAnalysisUseCase.execute).toHaveBeenCalledWith({
      userHoldings: [{ symbol: '035720', market: Market.KR }],
      userWatchlist: [{ symbol: 'TSLA', market: Market.US }],
    });
  });

  it('POST with auth prefers server-side portfolio over request body', async () => {
    const { getMarketAnalysisUseCase } = mockServices();

    const res = await postAnalysis(
      authedRequest('http://localhost/api/market/analysis', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '10.0.0.4',
        },
        body: JSON.stringify({
          userHoldings: [{ symbol: 'IGNORED', market: Market.KR }],
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(getMarketAnalysisUseCase.execute).toHaveBeenCalledWith({
      userHoldings: [{ symbol: '005930', market: Market.KR }],
      userWatchlist: [{ symbol: 'AAPL', market: Market.US }],
    });
  });
});
