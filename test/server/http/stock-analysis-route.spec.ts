import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as getStockAnalysis } from '@/app/api/market/stock-analysis/route';

const authUser = { userId: 'user-1', username: 'admin' };
const stockReport = {
  symbol: '000660',
  name: 'SK하이닉스',
  market: Market.KR,
  insights: [{ id: 'stock-action', category: 'stockAction' }],
};

function authedRequest(url: string) {
  return new NextRequest(url, {
    headers: {
      authorization: 'Bearer test-token',
      'x-forwarded-for': '10.0.0.11',
    },
  });
}

function mockServices(overrides: Record<string, unknown> = {}) {
  const buildStockAnalysisReportUseCase = {
    execute: vi.fn().mockResolvedValue(stockReport),
  };
  const getDashboardUseCase = {
    execute: vi.fn().mockResolvedValue({
      holdings: [{ symbol: '005930', market: Market.KR, name: '삼성전자' }],
    }),
  };
  const listWatchlistUseCase = {
    execute: vi.fn().mockResolvedValue([{ id: 'wl-1', symbol: 'AAPL', market: Market.US, name: 'Apple' }]),
  };

  vi.mocked(getServerServices).mockReturnValue({
    tokenService: {
      verifyAccessToken: vi.fn().mockReturnValue({ sub: authUser.userId, username: authUser.username }),
    },
    buildStockAnalysisReportUseCase,
    getDashboardUseCase,
    listWatchlistUseCase,
    ...overrides,
  } as never);

  return { buildStockAnalysisReportUseCase, getDashboardUseCase, listWatchlistUseCase };
}

describe('GET /api/market/stock-analysis', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it('returns report for valid symbol params', async () => {
    const { buildStockAnalysisReportUseCase } = mockServices();

    const res = await getStockAnalysis(
      new NextRequest(
        'http://localhost/api/market/stock-analysis?symbol=000660&name=SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4&market=KR',
        { headers: { 'x-forwarded-for': '10.0.0.12' } },
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe('000660');
    expect(buildStockAnalysisReportUseCase.execute).toHaveBeenCalledWith({
      symbol: '000660',
      name: 'SK하이닉스',
      market: Market.KR,
      yahooSymbol: undefined,
      userHoldings: undefined,
      userWatchlist: undefined,
    });
  });

  it('personalizes with auth user holdings and watchlist', async () => {
    const { buildStockAnalysisReportUseCase } = mockServices();

    const res = await getStockAnalysis(
      authedRequest(
        'http://localhost/api/market/stock-analysis?symbol=000660&name=SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4&market=KR',
      ),
    );

    expect(res.status).toBe(200);
    expect(buildStockAnalysisReportUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userHoldings: [{ symbol: '005930', market: Market.KR }],
        userWatchlist: [{ symbol: 'AAPL', market: Market.US }],
      }),
    );
  });

  it('rejects missing or invalid params', async () => {
    mockServices();

    const res = await getStockAnalysis(
      new NextRequest('http://localhost/api/market/stock-analysis?symbol=000660&market=KR', {
        headers: { 'x-forwarded-for': '10.0.0.13' },
      }),
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
