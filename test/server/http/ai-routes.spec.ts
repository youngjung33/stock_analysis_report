import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { AppErrorCode, GUEST_DISPLAY_NAME, Market } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';
import { ValidationError } from '@/server/domain/errors/domain.errors';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

vi.mock('@/server/data/ai/ai-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/data/ai/ai-config')>();
  return {
    ...actual,
    isAiEnabled: vi.fn(),
    isAiGuestAllowed: vi.fn(),
  };
});

import { getServerServices } from '@/server/container';
import { isAiEnabled, isAiGuestAllowed } from '@/server/data/ai/ai-config';
import { POST as stockAnalysis } from '@/app/api/ai/stock-analysis/route';
import { POST as portfolioAnalysis } from '@/app/api/ai/portfolio-analysis/route';
import {
  GET as getAiCredential,
  PUT as putAiCredential,
  POST as postAiCredentialValidate,
  DELETE as deleteAiCredential,
} from '@/app/api/account/ai-credential/route';

const authUser = { userId: 'user-1', username: 'admin' };
const mockInsight = {
  schemaVersion: '1.0',
  kind: 'stock',
  locale: 'ko',
  disclaimer: '참고용',
  meta: { providerId: 'gemini', model: 'gemini-2.0-flash', promptVersion: 'stock-v1', latencyMs: 100 },
  sections: [{ id: 'stock.summary', title: '요약', body: '본문' }],
};

function authedRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, {
    ...init,
    headers: {
      authorization: 'Bearer test-token',
      'x-forwarded-for': '10.0.0.20',
      ...(init?.headers ?? {}),
    },
  });
}

function mockServices(overrides: Record<string, unknown> = {}) {
  vi.mocked(getServerServices).mockReturnValue({
    tokenService: {
      verifyAccessToken: vi.fn().mockReturnValue({ sub: authUser.userId, username: authUser.username }),
    },
    getDashboardUseCase: {
      execute: vi.fn().mockResolvedValue({ holdings: [] }),
    },
    listWatchlistUseCase: {
      execute: vi.fn().mockResolvedValue([]),
    },
    buildStockAiContextUseCase: {
      execute: vi.fn().mockResolvedValue({ kind: 'stock', facts: {} }),
    },
    buildPortfolioAiContextUseCase: {
      execute: vi.fn().mockResolvedValue({ kind: 'portfolio', facts: {} }),
    },
    runAiAnalysisUseCase: {
      execute: vi.fn().mockResolvedValue(mockInsight),
    },
    getAiCredentialStatusUseCase: {
      execute: vi.fn().mockResolvedValue({ configured: false }),
    },
    upsertAiCredentialUseCase: {
      execute: vi.fn().mockResolvedValue({ success: true, validated: true }),
    },
    validateAiCredentialUseCase: {
      execute: vi.fn().mockResolvedValue({ ok: true }),
    },
    deleteAiCredentialUseCase: {
      execute: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  } as never);
}

describe('AI API routes', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    vi.mocked(isAiEnabled).mockReturnValue(true);
    vi.mocked(isAiGuestAllowed).mockReturnValue(false);
    mockServices();
  });

  describe('POST /api/ai/stock-analysis', () => {
    it('returns disabled payload when AI is off', async () => {
      vi.mocked(isAiEnabled).mockReturnValue(false);
      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(false);
    });

    it('returns insight for authed member', async () => {
      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(body.insight.sections).toHaveLength(1);
    });

    it('returns 401 without auth', async () => {
      const res = await stockAnalysis(
        new NextRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.21' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(401);
    });

    it('returns 400 when symbol or name missing', async () => {
      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(AppErrorCode.MARKET_QUOTE_PARAMS_REQUIRED);
    });

    it('returns 400 for invalid market', async () => {
      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: 'JP' }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(AppErrorCode.MARKET_INVALID);
    });

    it('returns 400 for guest when guest AI not allowed', async () => {
      vi.mocked(getServerServices).mockReturnValue({
        tokenService: {
          verifyAccessToken: vi.fn().mockReturnValue({
            sub: 'guest-1',
            username: GUEST_DISPLAY_NAME,
          }),
        },
      } as never);

      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(AppErrorCode.AI_MEMBERS_ONLY);
    });

    it('returns 400 when quota exceeded', async () => {
      mockServices({
        runAiAnalysisUseCase: {
          execute: vi.fn().mockRejectedValue(new ValidationError(AppErrorCode.AI_QUOTA_EXCEEDED)),
        },
      });

      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(AppErrorCode.AI_QUOTA_EXCEEDED);
    });

    it('returns 429 when rate limit exceeded', async () => {
      const ip = '10.0.0.99';
      const body = JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR });
      for (let i = 0; i < 15; i++) {
        await stockAnalysis(
          authedRequest('http://localhost/api/ai/stock-analysis', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
            body,
          }),
        );
      }

      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
          body,
        }),
      );
      expect(res.status).toBe(429);
    });

    it('returns 500 when context build fails', async () => {
      mockServices({
        buildStockAiContextUseCase: {
          execute: vi.fn().mockRejectedValue(new Error('STOCK_ANALYSIS_UNAVAILABLE')),
        },
      });

      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(500);
    });

    it('returns 400 when provider fails', async () => {
      mockServices({
        runAiAnalysisUseCase: {
          execute: vi.fn().mockRejectedValue(new ValidationError(AppErrorCode.AI_PROVIDER_ERROR)),
        },
      });

      const res = await stockAnalysis(
        authedRequest('http://localhost/api/ai/stock-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symbol: '005930', name: 'Samsung', market: Market.KR }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(AppErrorCode.AI_PROVIDER_ERROR);
    });
  });

  describe('POST /api/ai/portfolio-analysis', () => {
    it('returns insight for authed member', async () => {
      const res = await portfolioAnalysis(
        authedRequest('http://localhost/api/ai/portfolio-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale: 'ko' }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(body.insight).toBeTruthy();
    });

    it('returns 500 when portfolio context build fails', async () => {
      mockServices({
        buildPortfolioAiContextUseCase: {
          execute: vi.fn().mockRejectedValue(new Error('DB_UNAVAILABLE')),
        },
      });

      const res = await portfolioAnalysis(
        authedRequest('http://localhost/api/ai/portfolio-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale: 'ko' }),
        }),
      );
      expect(res.status).toBe(500);
    });

    it('returns disabled when AI off without calling use case', async () => {
      vi.mocked(isAiEnabled).mockReturnValue(false);
      const runAiAnalysisUseCase = { execute: vi.fn() };
      mockServices({ runAiAnalysisUseCase });

      const res = await portfolioAnalysis(
        authedRequest('http://localhost/api/ai/portfolio-analysis', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale: 'ko' }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(false);
      expect(runAiAnalysisUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('/api/account/ai-credential', () => {
    it('GET returns credential status', async () => {
      const res = await getAiCredential(authedRequest('http://localhost/api/account/ai-credential'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(false);
    });

    it('PUT saves credential with validation result', async () => {
      const res = await putAiCredential(
        authedRequest('http://localhost/api/account/ai-credential', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ provider: 'gemini', apiKey: 'test-key-12345678' }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.validated).toBe(true);
    });

    it('POST validates stored credential', async () => {
      const res = await postAiCredentialValidate(
        authedRequest('http://localhost/api/account/ai-credential', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it('PUT returns 400 when provider or apiKey missing', async () => {
      const res = await putAiCredential(
        authedRequest('http://localhost/api/account/ai-credential', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ provider: 'gemini' }),
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.code).toBe(AppErrorCode.VALIDATION);
    });

    it('DELETE removes credential', async () => {
      const res = await deleteAiCredential(
        authedRequest('http://localhost/api/account/ai-credential', { method: 'DELETE' }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('GET returns 401 without auth', async () => {
      const res = await getAiCredential(
        new NextRequest('http://localhost/api/account/ai-credential', {
          headers: { 'x-forwarded-for': '10.0.0.22' },
        }),
      );
      expect(res.status).toBe(401);
    });
  });
});
