import { vi, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { GET as listRecommendationHistory } from '@/app/api/market/recommendation-history/route';
import { GET as getRecommendationBatch } from '@/app/api/market/recommendation-history/[batchId]/route';

const batchList = {
  batches: [
    { id: 'batch-1', asOf: '2026-01-01T00:00:00.000Z', engineVersion: 'v1', pickCount: 5 },
  ],
};

const batchDetail = {
  id: 'batch-1',
  asOf: '2026-01-01T00:00:00.000Z',
  engineVersion: 'v1',
  picks: [{ symbol: '005930', market: 'KR', tag: 'momentum' }],
};

function mockServices(overrides: Record<string, unknown> = {}) {
  const listRecommendationHistoryUseCase = {
    execute: vi.fn().mockResolvedValue(batchList.batches),
  };
  const getRecommendationBatchUseCase = {
    execute: vi.fn().mockResolvedValue(batchDetail),
  };

  vi.mocked(getServerServices).mockReturnValue({
    listRecommendationHistoryUseCase,
    getRecommendationBatchUseCase,
    ...overrides,
  } as never);

  return { listRecommendationHistoryUseCase, getRecommendationBatchUseCase };
}

describe('recommendation history API routes', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    mockServices();
  });

  it('GET /api/market/recommendation-history returns batches with default limit', async () => {
    const { listRecommendationHistoryUseCase } = mockServices();

    const res = await listRecommendationHistory(
      new NextRequest('http://localhost/api/market/recommendation-history', {
        headers: { 'x-forwarded-for': '10.0.0.20' },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.batches).toHaveLength(1);
    expect(listRecommendationHistoryUseCase.execute).toHaveBeenCalledWith({ limit: 30 });
  });

  it('GET /api/market/recommendation-history clamps limit query param', async () => {
    const { listRecommendationHistoryUseCase } = mockServices();

    await listRecommendationHistory(
      new NextRequest('http://localhost/api/market/recommendation-history?limit=120', {
        headers: { 'x-forwarded-for': '10.0.0.21' },
      }),
    );

    expect(listRecommendationHistoryUseCase.execute).toHaveBeenCalledWith({ limit: 90 });
  });

  it('GET /api/market/recommendation-history/[batchId] returns batch detail', async () => {
    const { getRecommendationBatchUseCase } = mockServices();

    const res = await getRecommendationBatch(
      new NextRequest('http://localhost/api/market/recommendation-history/batch-1', {
        headers: { 'x-forwarded-for': '10.0.0.22' },
      }),
      { params: Promise.resolve({ batchId: 'batch-1' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.batch.id).toBe('batch-1');
    expect(getRecommendationBatchUseCase.execute).toHaveBeenCalledWith('batch-1');
  });

  it('GET /api/market/recommendation-history/[batchId] returns 404 when missing', async () => {
    mockServices({
      getRecommendationBatchUseCase: { execute: vi.fn().mockResolvedValue(null) },
    });

    const res = await getRecommendationBatch(
      new NextRequest('http://localhost/api/market/recommendation-history/missing', {
        headers: { 'x-forwarded-for': '10.0.0.23' },
      }),
      { params: Promise.resolve({ batchId: 'missing' }) },
    );

    expect(res.status).toBe(404);
  });
});
