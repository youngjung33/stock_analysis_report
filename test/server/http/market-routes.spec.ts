import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { enforceRateLimit, resetRateLimitStoreForTests } from '@server/http/rate-limit';
import { HttpError } from '@server/http/errors';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as getFeatured } from '@/app/api/market/featured/route';
import { GET as getAnalysis } from '@/app/api/market/analysis/route';

describe('market API rate limit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    vi.mocked(getServerServices).mockReturnValue({
      getFeaturedQuotesUseCase: { execute: vi.fn().mockResolvedValue({ kr: [], us: [], fetchedAt: '' }) },
      getMarketAnalysisUseCase: { execute: vi.fn().mockResolvedValue({ krQuotes: [], usQuotes: [], fetchedAt: '' }) },
    } as never);
  });

  it('allows requests under limit', async () => {
    const req = new NextRequest('http://localhost/api/market/featured', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(() => enforceRateLimit(req, 'market:featured', 'standard')).not.toThrow();
  });

  it('returns 429 when limit exceeded', async () => {
    const ip = '9.9.9.9';
    for (let i = 0; i < 60; i++) {
      enforceRateLimit(
        new NextRequest('http://localhost/api/market/featured', {
          headers: { 'x-forwarded-for': ip },
        }),
        'market:featured',
        'standard',
      );
    }

    expect(() =>
      enforceRateLimit(
        new NextRequest('http://localhost/api/market/featured', {
          headers: { 'x-forwarded-for': ip },
        }),
        'market:featured',
        'standard',
      ),
    ).toThrow(HttpError);

    const req = new NextRequest('http://localhost/api/market/featured', {
      headers: { 'x-forwarded-for': ip },
    });
    const res = await getFeatured(req);
    expect(res.status).toBe(429);
  });

  it('GET /api/market/analysis returns 200 under heavy limit', async () => {
    const req = new NextRequest('http://localhost/api/market/analysis', {
      headers: { 'x-forwarded-for': '5.5.5.5' },
    });
    const res = await getAnalysis(req);
    expect(res.status).toBe(200);
  });
});
