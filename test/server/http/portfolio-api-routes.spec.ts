import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Market, TransactionType } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as listTransactions, POST as createTransaction } from '@/app/api/transactions/route';
import { PATCH as updateTransaction } from '@/app/api/transactions/[id]/route';
import { GET as getDashboard } from '@/app/api/portfolio/dashboard/route';
import { GET as listWatchlist, POST as addWatchlist } from '@/app/api/watchlist/route';
import { GET as listCorporateActions, POST as createCorporateAction } from '@/app/api/corporate-actions/route';
import { GET as getPortfolioAnalysis } from '@/app/api/portfolio/analysis/route';
import { POST as refreshMarketQuotes } from '@/app/api/market/refresh/route';

const authUser = { userId: 'user-1', username: 'admin' };

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
  vi.mocked(getServerServices).mockReturnValue({
    tokenService: {
      verifyAccessToken: vi.fn().mockReturnValue({ sub: authUser.userId, username: authUser.username }),
    },
    listTransactionsUseCase: {
      execute: vi.fn().mockResolvedValue([{ id: 'tx-1' }]),
    },
    createTransactionUseCase: {
      execute: vi.fn().mockResolvedValue({ id: 'tx-new' }),
    },
    updateTransactionUseCase: {
      execute: vi.fn().mockResolvedValue({ id: 'tx-1', quantity: 5 }),
    },
    getDashboardUseCase: {
      execute: vi.fn().mockResolvedValue({
        summary: { holdingsCount: 0, cashKrw: 0, cashUsd: 0 },
        holdings: [],
        lastRefreshedAt: null,
      }),
    },
    listWatchlistUseCase: {
      execute: vi.fn().mockResolvedValue([{ id: 'wl-1', symbol: '005930' }]),
    },
    addWatchlistUseCase: {
      execute: vi.fn().mockResolvedValue({ id: 'wl-new', symbol: 'AAPL' }),
    },
    listCorporateActionsUseCase: {
      execute: vi.fn().mockResolvedValue([{ id: 'ca-1' }]),
    },
    createCorporateActionUseCase: {
      execute: vi.fn().mockResolvedValue({ id: 'ca-new' }),
    },
    getPortfolioAnalysisUseCase: {
      execute: vi.fn().mockResolvedValue({ periods: [], insights: null }),
    },
    refreshQuotesUseCase: {
      execute: vi.fn().mockResolvedValue({ updated: 2, succeeded: ['005930'], failed: [] }),
    },
    ...overrides,
  } as never);
}

describe('portfolio & transactions API routes', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    mockServices();
  });

  it('GET /api/transactions returns 401 without auth', async () => {
    const res = await listTransactions(new NextRequest('http://localhost/api/transactions'));
    expect(res.status).toBe(401);
  });

  it('GET /api/transactions returns list for authed user', async () => {
    const res = await listTransactions(authedRequest('http://localhost/api/transactions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
  });

  it('POST /api/transactions creates transaction', async () => {
    const req = authedRequest('http://localhost/api/transactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({
        stockSymbol: '005930',
        market: Market.KR,
        name: '삼성전자',
        type: TransactionType.BUY,
        quantity: 10,
        price: 70000,
        tradedAt: new Date().toISOString(),
      }),
    });
    const res = await createTransaction(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('tx-new');
  });

  it('PATCH /api/transactions/[id] updates transaction', async () => {
    const req = authedRequest('http://localhost/api/transactions/tx-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({
        quantity: 5,
        price: 70000,
        tradedAt: new Date().toISOString(),
      }),
    });
    const res = await updateTransaction(req, { params: Promise.resolve({ id: 'tx-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.quantity).toBe(5);
  });

  it('GET /api/portfolio/dashboard returns dashboard', async () => {
    const res = await getDashboard(authedRequest('http://localhost/api/portfolio/dashboard'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toBeDefined();
  });

  it('GET /api/watchlist returns items', async () => {
    const res = await listWatchlist(authedRequest('http://localhost/api/watchlist'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
  });

  it('POST /api/watchlist adds item', async () => {
    const req = authedRequest('http://localhost/api/watchlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({ symbol: 'AAPL', name: 'Apple', market: Market.US }),
    });
    const res = await addWatchlist(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.symbol).toBe('AAPL');
  });

  it('GET /api/corporate-actions returns 401 without auth', async () => {
    const res = await listCorporateActions(new NextRequest('http://localhost/api/corporate-actions'));
    expect(res.status).toBe(401);
  });

  it('GET /api/corporate-actions returns list for authed user', async () => {
    const res = await listCorporateActions(authedRequest('http://localhost/api/corporate-actions'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
  });

  it('POST /api/corporate-actions creates action', async () => {
    const req = authedRequest('http://localhost/api/corporate-actions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({
        stockSymbol: '005930',
        market: Market.KR,
        name: '삼성전자',
        type: 'DIVIDEND',
        effectiveAt: new Date().toISOString(),
        cashAmount: 10000,
      }),
    });
    const res = await createCorporateAction(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.id).toBe('ca-new');
  });

  it('GET /api/portfolio/analysis returns analysis', async () => {
    const res = await getPortfolioAnalysis(
      authedRequest('http://localhost/api/portfolio/analysis?periods=1mo,ytd'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.periods).toEqual([]);
  });

  it('POST /api/market/refresh refreshes quotes', async () => {
    const res = await refreshMarketQuotes(
      authedRequest('http://localhost/api/market/refresh', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(2);
  });
});
