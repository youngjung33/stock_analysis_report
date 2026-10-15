import { afterEach, describe, expect, it, vi } from 'vitest';

describe('readHeavyApiClientTimeoutMs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to 90 seconds', async () => {
    const { readHeavyApiClientTimeoutMs } = await import('@/client/data/api/client');
    expect(readHeavyApiClientTimeoutMs()).toBe(90_000);
  });

  it('reads NEXT_PUBLIC_HEAVY_API_CLIENT_TIMEOUT_MS', async () => {
    vi.stubEnv('NEXT_PUBLIC_HEAVY_API_CLIENT_TIMEOUT_MS', '120000');
    vi.resetModules();
    const { readHeavyApiClientTimeoutMs } = await import('@/client/data/api/client');
    expect(readHeavyApiClientTimeoutMs()).toBe(120_000);
  });
});
