import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

import { getServerServices } from '@/server/container';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as refresh } from '@/app/api/auth/refresh/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';
import { POST as guestSession, DELETE as clearGuestSession } from '@/app/api/auth/guest/session/route';
import { GET as oauthProviders } from '@/app/api/auth/oauth/providers/route';
import { GET as oauthStart } from '@/app/api/auth/oauth/[provider]/start/route';
import { GET as oauthCallback } from '@/app/api/auth/oauth/[provider]/callback/route';
import { POST as changePassword } from '@/app/api/account/password/route';
import { POST as requestAccountVerifyEmail } from '@/app/api/account/verify-email/route';
import { POST as confirmAccountEmail } from '@/app/api/account/confirm-email/route';
import { GET as getQuote } from '@/app/api/market/quote/route';
import { GET as getMarketStatus } from '@/app/api/market/status/route';
import { GET as searchStocks } from '@/app/api/market/search/route';
import { GET as getFx } from '@/app/api/market/fx/route';
import { POST as fetchQuotes } from '@/app/api/market/quotes/route';
import { GET as getRecommendationContext } from '@/app/api/market/recommendation-context/route';
import { GET as getHolding } from '@/app/api/portfolio/holding/route';
import { DELETE as deleteWatchlistItem } from '@/app/api/watchlist/[id]/route';
import { DELETE as deleteCorporateAction } from '@/app/api/corporate-actions/[id]/route';

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
    registerUseCase: {
      execute: vi.fn().mockResolvedValue({
        username: 'newuser',
        accessToken: 'access',
        refreshToken: 'refresh',
        isNewUser: true,
      }),
    },
    refreshTokenUseCase: {
      execute: vi.fn().mockResolvedValue({
        username: 'admin',
        accessToken: 'access2',
        refreshToken: 'refresh2',
      }),
    },
    logoutUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    requestPasswordResetUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    resetPasswordUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    changePasswordUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    requestEmailVerificationUseCase: {
      execute: vi.fn().mockResolvedValue({ verificationCode: '123456' }),
    },
    verifyEmailUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    oauthProvider: {
      isConfigured: vi.fn().mockReturnValue(true),
    },
    startOAuthLoginUseCase: {
      execute: vi.fn().mockResolvedValue({ authorizeUrl: 'https://oauth.example/authorize', state: 'st' }),
    },
    completeOAuthLoginUseCase: {
      execute: vi.fn().mockResolvedValue({
        accessToken: 'oa-access',
        refreshToken: 'oa-refresh',
        isNewUser: false,
      }),
    },
    getStockQuoteUseCase: {
      execute: vi.fn().mockResolvedValue({
        symbol: '005930',
        market: Market.KR,
        currentPrice: 70000,
        changePercent: 1,
        points: [],
      }),
    },
    getMarketStatusUseCase: {
      execute: vi.fn().mockResolvedValue({ kr: { available: true }, us: { available: true } }),
    },
    searchStocksUseCase: { execute: vi.fn().mockResolvedValue([]) },
    getFxRateUseCase: {
      execute: vi.fn().mockResolvedValue({ usdKrwRate: 1350, fetchedAt: new Date().toISOString() }),
    },
    fetchQuotesUseCase: {
      execute: vi.fn().mockResolvedValue({ quotes: [], fetchedAt: new Date().toISOString() }),
    },
    buildMarketContextUseCase: {
      execute: vi.fn().mockResolvedValue({
        macro: [],
        sectors: [],
        indices: [],
        usdKrwRate: 1350,
        usdKrwChange1d: 0,
      }),
    },
    getHoldingBySymbolUseCase: {
      execute: vi.fn().mockResolvedValue({ symbol: '005930', quantity: 10 }),
    },
    deleteWatchlistUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    deleteCorporateActionUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
    ...overrides,
  } as never);
}

describe('remaining API routes', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-min-32-chars!!';
    mockServices();
  });

  describe('auth', () => {
    it('POST /api/auth/register returns 200 with tokens', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.1' },
        body: JSON.stringify({
          username: 'newuser',
          password: 'password1',
          passwordConfirm: 'password1',
        }),
      });
      const res = await register(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.username).toBe('newuser');
    });

    it('POST /api/auth/register returns 400 when fields missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.1.1.2' },
        body: JSON.stringify({ username: 'x' }),
      });
      const res = await register(req);
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/refresh returns username null without cookie', async () => {
      const res = await refresh(new NextRequest('http://localhost/api/auth/refresh', { method: 'POST' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.username).toBeNull();
    });

    it('POST /api/auth/logout returns success', async () => {
      const res = await logout(new NextRequest('http://localhost/api/auth/logout', { method: 'POST' }));
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/forgot-password returns 200', async () => {
      const req = new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '2.2.2.2' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
      const res = await forgotPassword(req);
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/forgot-password returns 400 without email', async () => {
      const req = new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '2.2.2.3' },
        body: JSON.stringify({}),
      });
      const res = await forgotPassword(req);
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/reset-password returns 200', async () => {
      const req = new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '3.3.3.3' },
        body: JSON.stringify({
          token: 'reset-token',
          password: 'newpass1',
          passwordConfirm: 'newpass1',
        }),
      });
      const res = await resetPassword(req);
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/guest/session issues guest cookie', async () => {
      const res = await guestSession(
        new NextRequest('http://localhost/api/auth/guest/session', {
          method: 'POST',
          headers: { 'x-forwarded-for': '4.4.4.4' },
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('DELETE /api/auth/guest/session clears guest cookie', async () => {
      const res = await clearGuestSession(
        new NextRequest('http://localhost/api/auth/guest/session', { method: 'DELETE' }),
      );
      expect(res.status).toBe(200);
    });

    it('GET /api/auth/oauth/providers returns provider list', async () => {
      const res = await oauthProviders(new NextRequest('http://localhost/api/auth/oauth/providers'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.providers.length).toBeGreaterThan(0);
    });

    it('GET /api/auth/oauth/[provider]/start returns authorize URL', async () => {
      const res = await oauthStart(new NextRequest('http://localhost/api/auth/oauth/GOOGLE/start'), {
        params: Promise.resolve({ provider: 'GOOGLE' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.authorizeUrl).toContain('oauth.example');
    });

    it('GET /api/auth/oauth/[provider]/start returns 400 for invalid provider', async () => {
      const res = await oauthStart(new NextRequest('http://localhost/api/auth/oauth/invalid/start'), {
        params: Promise.resolve({ provider: 'invalid' }),
      });
      expect(res.status).toBe(400);
    });

    it('GET /api/auth/oauth/[provider]/callback redirects on success', async () => {
      const res = await oauthCallback(
        new NextRequest('http://localhost/api/auth/oauth/GOOGLE/callback?code=c&state=s'),
        { params: Promise.resolve({ provider: 'GOOGLE' }) },
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toMatch(/\/$/);
    });
  });

  describe('account', () => {
    it('POST /api/account/password returns 401 without auth', async () => {
      const res = await changePassword(
        new NextRequest('http://localhost/api/account/password', { method: 'POST' }),
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/account/password returns 200 for authed user', async () => {
      const req = authedRequest('http://localhost/api/account/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'old',
          newPassword: 'newpass1',
          newPasswordConfirm: 'newpass1',
        }),
      });
      const res = await changePassword(req);
      expect(res.status).toBe(200);
    });

    it('POST /api/account/verify-email returns 200 for authed user', async () => {
      const res = await requestAccountVerifyEmail(
        authedRequest('http://localhost/api/account/verify-email', { method: 'POST' }),
      );
      expect(res.status).toBe(200);
    });

    it('POST /api/account/confirm-email returns 400 without code', async () => {
      const req = authedRequest('http://localhost/api/account/confirm-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await confirmAccountEmail(req);
      expect(res.status).toBe(400);
    });

    it('POST /api/account/confirm-email returns 200 with code', async () => {
      const req = authedRequest('http://localhost/api/account/confirm-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: '123456' }),
      });
      const res = await confirmAccountEmail(req);
      expect(res.status).toBe(200);
    });
  });

  describe('market', () => {
    it('GET /api/market/quote returns 200', async () => {
      const res = await getQuote(
        new NextRequest('http://localhost/api/market/quote?symbol=005930&market=KR'),
      );
      expect(res.status).toBe(200);
    });

    it('GET /api/market/quote returns 400 without params', async () => {
      const res = await getQuote(new NextRequest('http://localhost/api/market/quote'));
      expect(res.status).toBe(400);
    });

    it('GET /api/market/status returns 200', async () => {
      const res = await getMarketStatus(new NextRequest('http://localhost/api/market/status'));
      expect(res.status).toBe(200);
    });

    it('GET /api/market/search returns 200', async () => {
      const res = await searchStocks(new NextRequest('http://localhost/api/market/search?q=samsung'));
      expect(res.status).toBe(200);
    });

    it('GET /api/market/fx returns 200', async () => {
      const res = await getFx(new NextRequest('http://localhost/api/market/fx'));
      expect(res.status).toBe(200);
    });

    it('POST /api/market/quotes returns 200', async () => {
      const req = new NextRequest('http://localhost/api/market/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          stocks: [{ stockId: '1', symbol: '005930', market: Market.KR }],
        }),
      });
      const res = await fetchQuotes(req);
      expect(res.status).toBe(200);
    });

    it('POST /api/market/quotes returns 400 for empty stocks', async () => {
      const req = new NextRequest('http://localhost/api/market/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stocks: [] }),
      });
      const res = await fetchQuotes(req);
      expect(res.status).toBe(400);
    });

    it('GET /api/market/recommendation-context returns 200', async () => {
      const res = await getRecommendationContext(
        new NextRequest('http://localhost/api/market/recommendation-context'),
      );
      expect(res.status).toBe(200);
    });
  });

  describe('portfolio & watchlist & corporate-actions', () => {
    it('GET /api/portfolio/holding returns 401 without auth', async () => {
      const res = await getHolding(
        new NextRequest('http://localhost/api/portfolio/holding?symbol=005930&market=KR'),
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/portfolio/holding returns 200 for authed user', async () => {
      const res = await getHolding(
        authedRequest('http://localhost/api/portfolio/holding?symbol=005930&market=KR'),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.holding.symbol).toBe('005930');
    });

    it('DELETE /api/watchlist/[id] returns 200', async () => {
      const res = await deleteWatchlistItem(
        authedRequest('http://localhost/api/watchlist/wl-1', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'wl-1' }) },
      );
      expect(res.status).toBe(200);
    });

    it('DELETE /api/corporate-actions/[id] returns 200', async () => {
      const res = await deleteCorporateAction(
        authedRequest('http://localhost/api/corporate-actions/ca-1', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'ca-1' }) },
      );
      expect(res.status).toBe(200);
    });
  });
});
