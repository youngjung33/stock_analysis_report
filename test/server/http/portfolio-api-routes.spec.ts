import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Market, TransactionType } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as listTransactions, POST as createTransaction } from '@/app/api/transactions/route';
import { GET as getDashboard } from '@/app/api/portfolio/dashboard/route';
import { GET as listWatchlist, POST as addWatchlist } from '@/app/api/watchlist/route';

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
});
