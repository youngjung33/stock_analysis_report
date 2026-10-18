import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  throttleAfterKrProviderSuccess,
  throttleAfterUsProviderSuccess,
} from '@server/domain/usecases/market/recommendation-provider-throttle';

describe('recommendation-provider-throttle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits ~1100ms after US provider success', async () => {
    vi.useFakeTimers();
    const promise = throttleAfterUsProviderSuccess();
    await vi.advanceTimersByTimeAsync(1099);
    let settled = false;
    promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    await promise;
    expect(settled).toBe(true);
  });

  it('waits ~250ms after KR provider success', async () => {
    vi.useFakeTimers();
    const promise = throttleAfterKrProviderSuccess();
    await vi.advanceTimersByTimeAsync(250);
    await promise;
  });
});
