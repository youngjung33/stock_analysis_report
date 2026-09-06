import { vi, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStoreForTests } from '@server/http/rate-limit';

vi.mock('@/server/container', () => ({
  getServerServices: vi.fn(),
}));

import { getServerServices } from '@/server/container';
import { POST as postRecommendationBatch } from '@/app/api/cron/recommendation-batch/route';
import { POST as postRecommendationOutcomes } from '@/app/api/cron/recommendation-outcomes/route';

const cronResult = { batchId: 'batch-1', picked: 5 };

function cronRequest(url: string, secret?: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

function mockServices(overrides: Record<string, unknown> = {}) {
  const runGlobalRecommendationBatchUseCase = {
    execute: vi.fn().mockResolvedValue(cronResult),
  };
  const evaluateRecommendationOutcomesUseCase = {
    execute: vi.fn().mockResolvedValue({ evaluated: 3 }),
  };

  vi.mocked(getServerServices).mockReturnValue({
    runGlobalRecommendationBatchUseCase,
    evaluateRecommendationOutcomesUseCase,
    ...overrides,
  } as never);

  return { runGlobalRecommendationBatchUseCase, evaluateRecommendationOutcomesUseCase };
}

describe('cron recommendation routes', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    resetRateLimitStoreForTests();
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it('POST /api/cron/recommendation-batch runs batch with valid secret', async () => {
    const { runGlobalRecommendationBatchUseCase } = mockServices();

    const res = await postRecommendationBatch(
      cronRequest('http://localhost/api/cron/recommendation-batch', 'test-cron-secret'),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.batchId).toBe('batch-1');
    expect(runGlobalRecommendationBatchUseCase.execute).toHaveBeenCalled();
  });

  it('POST /api/cron/recommendation-outcomes evaluates outcomes with valid secret', async () => {
    const { evaluateRecommendationOutcomesUseCase } = mockServices();

    const res = await postRecommendationOutcomes(
      cronRequest('http://localhost/api/cron/recommendation-outcomes', 'test-cron-secret'),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.evaluated).toBe(3);
    expect(evaluateRecommendationOutcomesUseCase.execute).toHaveBeenCalled();
  });

  it('rejects missing or invalid cron secret', async () => {
    mockServices();

    const res = await postRecommendationBatch(
      cronRequest('http://localhost/api/cron/recommendation-batch', 'wrong-secret'),
    );

    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});
