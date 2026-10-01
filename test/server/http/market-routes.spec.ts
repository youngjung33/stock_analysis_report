import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { enforceRateLimit, resetRateLimitStoreForTests } from '@server/http/rate-limit';
import { HttpError } from '@server/http/errors';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as getIndices } from '@/app/api/market/indices/route';
import { GET as getSentimentSummary, POST as postSentimentSummary } from '@/app/api/market/sentiment-summary/route';
import { GET as getAnalysis } from '@/app/api/market/analysis/route';

const sentimentSummaryExecute = vi.fn();

describe('market API rate limit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    sentimentSummaryExecute.mockReset();
    sentimentSummaryExecute.mockResolvedValue({
      indices: [],
      insights: { kr: { label: 'neutral' }, us: { label: 'neutral' }, recommendations: [], regimes: [] },
      fetchedAt: '',
    });
    vi.mocked(getServerServices).mockReturnValue({
      getMarketIndicesUseCase: {
        execute: vi.fn().mockResolvedValue({ indices: [], fetchedAt: '' }),
      },
      getMarketSentimentSummaryUseCase: {
        execute: sentimentSummaryExecute,
      },
      getMarketAnalysisUseCase: { execute: vi.fn().mockResolvedValue({ fetchedAt: '' }) },
    } as never);
  });

  it('allows requests under limit', async () => {
    const req = new NextRequest('http://localhost/api/market/indices', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    await expect(enforceRateLimit(req, 'market:indices', 'standard')).resolves.toBeUndefined();
  });

  it('returns 429 when limit exceeded', async () => {
    const ip = '9.9.9.9';
    for (let i = 0; i < 60; i++) {
      await enforceRateLimit(
        new NextRequest('http://localhost/api/market/indices', {
          headers: { 'x-forwarded-for': ip },
        }),
        'market:indices',
        'standard',
      );
    }

    await expect(
      enforceRateLimit(
        new NextRequest('http://localhost/api/market/indices', {
          headers: { 'x-forwarded-for': ip },
        }),
        'market:indices',
        'standard',
      ),
    ).rejects.toThrow(HttpError);

    const req = new NextRequest('http://localhost/api/market/indices', {
      headers: { 'x-forwarded-for': ip },
    });
    const res = await getIndices(req);
    expect(res.status).toBe(429);
  });

  it('GET /api/market/sentiment-summary returns 200', async () => {
    const req = new NextRequest('http://localhost/api/market/sentiment-summary', {
      headers: { 'x-forwarded-for': '4.4.4.4' },
    });
    const res = await getSentimentSummary(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.insights).toBeDefined();
    expect(body.indices).toEqual([]);
    expect(sentimentSummaryExecute).toHaveBeenCalledWith(undefined);
  });

  it('POST /api/market/sentiment-summary passes guest watchlist to use case', async () => {
    const req = new NextRequest('http://localhost/api/market/sentiment-summary', {
      method: 'POST',
      headers: { 'x-forwarded-for': '4.4.4.5', 'content-type': 'application/json' },
      body: JSON.stringify({
        userWatchlist: [{ symbol: 'AAPL', market: 'US' }],
      }),
    });
    const res = await postSentimentSummary(req);
    expect(res.status).toBe(200);
    expect(sentimentSummaryExecute).toHaveBeenCalledWith({
      userHoldings: undefined,
      userWatchlist: [{ symbol: 'AAPL', market: 'US' }],
      investorProfile: null,
    });
  });

  it('GET /api/market/indices returns 200 with indices payload', async () => {
    const req = new NextRequest('http://localhost/api/market/indices', {
      headers: { 'x-forwarded-for': '3.3.3.3' },
    });
    const res = await getIndices(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.indices).toEqual([]);
    expect(body.fetchedAt).toBe('');
  });

  it('GET /api/market/analysis returns 200 under heavy limit', async () => {
    const req = new NextRequest('http://localhost/api/market/analysis', {
      headers: { 'x-forwarded-for': '5.5.5.5' },
    });
    const res = await getAnalysis(req);
    expect(res.status).toBe(200);
  });
});
