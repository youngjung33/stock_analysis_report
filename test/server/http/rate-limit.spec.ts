import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AppErrorCode } from '@sar/shared';
import { enforceRateLimit, resetRateLimitStoreForTests } from '@server/http/rate-limit';

describe('enforceRateLimit store selection', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses in-memory store in non-production without Upstash', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const req = new NextRequest('http://localhost/api/market/featured', {
      headers: { 'x-forwarded-for': '1.1.1.1' },
    });

    await expect(enforceRateLimit(req, 'market:featured', 'standard')).resolves.toBeUndefined();
  });

  it('rejects requests in production without Upstash', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const req = new NextRequest('http://localhost/api/market/featured', {
      headers: { 'x-forwarded-for': '2.2.2.2' },
    });

    await expect(enforceRateLimit(req, 'market:featured', 'standard')).rejects.toMatchObject({
      statusCode: 503,
      code: AppErrorCode.INTERNAL,
    });
  });
});
