import { afterEach, describe, expect, it, vi } from 'vitest';
import { Market } from '@sar/shared';
import {
  clearMarketContextCacheForTests,
  getCachedMarketContext,
  setCachedMarketContext,
} from '@server/data/market/market-context.cache';
import type { BuiltMarketContextData } from '@server/domain/usecases/market/build-market-context.use-case';

function minimalContext(): BuiltMarketContextData {
  return {
    macro: [],
    sectors: [],
    indices: [
      {
        yahooSymbol: '^KS11',
        name: 'KOSPI',
        market: Market.KR,
        changePercent1d: 0.5,
      },
    ],
    usdKrwRate: null,
    usdKrwChange1d: null,
    indexInputs: [],
    macroInputs: [],
    sectorInputs: [],
  };
}

describe('market-context.cache', () => {
  afterEach(() => {
    clearMarketContextCacheForTests();
    vi.unstubAllEnvs();
  });

  it('returns cached context within TTL', () => {
    vi.stubEnv('MARKET_CONTEXT_CACHE_TTL_MS', '60_000');
    const data = minimalContext();
    setCachedMarketContext(data);
    expect(getCachedMarketContext()).toEqual(data);
  });

  it('disables cache when TTL is 0', () => {
    vi.stubEnv('MARKET_CONTEXT_CACHE_TTL_MS', '0');
    setCachedMarketContext(minimalContext());
    expect(getCachedMarketContext()).toBeNull();
  });

  it('expires after TTL', () => {
    vi.stubEnv('MARKET_CONTEXT_CACHE_TTL_MS', '1000');
    setCachedMarketContext(minimalContext());
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);
    expect(getCachedMarketContext()).toBeNull();
  });
});
