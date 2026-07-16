import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { CashLedgerType } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as getCash, POST as postCash } from '@/app/api/cash/route';
import { GET as getPreferences, PUT as putPreferences } from '@/app/api/portfolio/preferences/route';
import { GET as getSimulation } from '@/app/api/portfolio/simulation/route';

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
    getCashSummaryUseCase: {
      execute: vi.fn().mockResolvedValue({
        balances: { krw: 10_000_000, usd: 0 },
        entries: [],
      }),
    },
    recordCashEntryUseCase: {
      execute: vi.fn().mockResolvedValue({
        id: 'cash-1',
        userId: authUser.userId,
        currency: 'KRW',
        type: CashLedgerType.DEPOSIT,
        amount: 1_000_000,
        occurredAt: new Date(),
        memo: null,
        refId: null,
      }),
    },
    getPortfolioPreferencesUseCase: {
      execute: vi.fn().mockResolvedValue({
        targetKrPercent: 70,
        targetUsPercent: 30,
        maxSingleWeightPercent: 40,
      }),
    },
    updatePortfolioPreferencesUseCase: {
      execute: vi.fn().mockResolvedValue({
        targetKrPercent: 60,
        targetUsPercent: 40,
        maxSingleWeightPercent: 35,
      }),
    },
    getPortfolioSimulationUseCase: {
      execute: vi.fn().mockResolvedValue({
        preferences: { targetKrPercent: 70, targetUsPercent: 30, maxSingleWeightPercent: 40 },
        simulation: { headline: 'test', actions: [] },
        ledgerEntryCount: 1,
        asOf: new Date().toISOString(),
      }),
    },
    ...overrides,
  } as never);
}

describe('cash & portfolio capital API routes', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    mockServices();
  });

  it('GET /api/cash returns 401 without auth', async () => {
    const res = await getCash(new NextRequest('http://localhost/api/cash'));
    expect(res.status).toBe(401);
  });

  it('GET /api/cash returns summary for authed user', async () => {
    const res = await getCash(authedRequest('http://localhost/api/cash'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.balances.krw).toBe(10_000_000);
  });

  it('POST /api/cash records entry', async () => {
    const req = authedRequest('http://localhost/api/cash', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({
        currency: 'KRW',
        type: CashLedgerType.DEPOSIT,
        amount: 1_000_000,
      }),
    });
    const res = await postCash(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.currency).toBe('KRW');
  });

  it('GET /api/portfolio/preferences returns preferences', async () => {
    const res = await getPreferences(authedRequest('http://localhost/api/portfolio/preferences'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.targetKrPercent).toBe(70);
  });

  it('PUT /api/portfolio/preferences updates preferences', async () => {
    const req = authedRequest('http://localhost/api/portfolio/preferences', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({
        targetKrPercent: 60,
        targetUsPercent: 40,
        maxSingleWeightPercent: 35,
      }),
    });
    const res = await putPreferences(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.targetKrPercent).toBe(60);
  });

  it('GET /api/portfolio/simulation returns simulation', async () => {
    const res = await getSimulation(authedRequest('http://localhost/api/portfolio/simulation'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.simulation.headline).toBe('test');
  });
});
