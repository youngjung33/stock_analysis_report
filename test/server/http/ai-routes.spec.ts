import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { Market } from '@sar/shared';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

vi.mock('@/server/data/ai/ai-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/data/ai/ai-config')>();
  return {
    ...actual,
    isAiEnabled: vi.fn(),
  };
});

import { getServerServices } from '@/server/container';
import { isAiEnabled } from '@/server/data/ai/ai-config';
import { POST as stockAnalysis } from '@/app/api/ai/stock-analysis/route';
import { POST as portfolioAnalysis } from '@/app/api/ai/portfolio-analysis/route';
import {
  GET as getAiCredential,
  PUT as putAiCredential,
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
      execute: vi.fn().mockResolvedValue(undefined),
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
  });

  describe('/api/account/ai-credential', () => {
    it('GET returns credential status', async () => {
      const res = await getAiCredential(authedRequest('http://localhost/api/account/ai-credential'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(false);
    });

    it('PUT saves credential', async () => {
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
    });

    it('DELETE removes credential', async () => {
      const res = await deleteAiCredential(
        authedRequest('http://localhost/api/account/ai-credential', { method: 'DELETE' }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
