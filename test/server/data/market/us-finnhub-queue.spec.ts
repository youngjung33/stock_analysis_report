import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resetUsFinnhubQueueForTests,
  runOnUsFinnhubQueue,
} from '@server/data/market/us-finnhub-queue';

describe('runOnUsFinnhubQueue', () => {
  afterEach(() => {
    resetUsFinnhubQueueForTests();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('runs Finnhub operations one at a time', async () => {
    vi.stubEnv('US_FINNHUB_QUEUE_GAP_MS', '0');
    const order: string[] = [];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const first = runOnUsFinnhubQueue(async () => {
      order.push('a-start');
      await sleep(30);
      order.push('a-end');
      return 1;
    });

    const second = runOnUsFinnhubQueue(async () => {
      order.push('b-start');
      order.push('b-end');
      return 2;
    });

    await Promise.all([first, second]);
    expect(order).toEqual(['a-start', 'a-end', 'b-start', 'b-end']);
  });

  it('runs next operation after previous failure', async () => {
    vi.stubEnv('US_FINNHUB_QUEUE_GAP_MS', '0');
    const first = runOnUsFinnhubQueue(async () => {
      throw new Error('finnhub down');
    });
    const second = runOnUsFinnhubQueue(async () => 'ok');

    await expect(first).rejects.toThrow('finnhub down');
    await expect(second).resolves.toBe('ok');
  });
});
