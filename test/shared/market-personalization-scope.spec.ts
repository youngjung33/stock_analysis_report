import { describe, expect, it } from 'vitest';
import { Market, buildMarketPersonalizationScopeKey } from '@sar/shared';

describe('buildMarketPersonalizationScopeKey', () => {
  it('returns global when scope is empty', () => {
    expect(buildMarketPersonalizationScopeKey()).toBe('global');
    expect(buildMarketPersonalizationScopeKey({})).toBe('global');
  });

  it('builds stable sorted key from holdings and watchlist', () => {
    const key = buildMarketPersonalizationScopeKey({
      userWatchlist: [{ symbol: 'aapl', market: Market.US }],
      userHoldings: [{ symbol: '005930', market: Market.KR }],
    });
    expect(key).toBe('h:KR:005930|w:US:AAPL');
  });
});
