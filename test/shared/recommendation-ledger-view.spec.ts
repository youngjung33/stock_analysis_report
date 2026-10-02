import { describe, expect, it } from 'vitest';
import {
  Market,
  lookupCandidatePoolName,
  mapRecommendationItemToView,
} from '@sar/shared';

describe('recommendation-ledger-view', () => {
  it('lookupCandidatePoolName resolves display name', () => {
    const pool = [
      { symbol: '005930', market: Market.KR, name: '삼성전자', source: 'holding' },
    ];
    expect(lookupCandidatePoolName(pool, '005930', Market.KR)).toBe('삼성전자');
    expect(lookupCandidatePoolName(pool, 'AAPL', Market.US)).toBeUndefined();
  });

  it('mapRecommendationItemToView uses catalog when pool name missing', () => {
    const catalogNames = new Map([['US:NVDA', 'NVIDIA Corporation']]);
    const view = mapRecommendationItemToView(
      {
        id: '1',
        rank: 1,
        symbol: 'NVDA',
        market: Market.US,
        tag: 'momentum',
        score: 1,
        priceAtRun: 100,
        changePercent1d: 0,
        outcomes: [],
      },
      [],
      catalogNames,
    );
    expect(view.name).toBe('NVIDIA Corporation');
  });

  it('mapRecommendationItemToView falls back to symbol', () => {
    const view = mapRecommendationItemToView(
      {
        id: '1',
        rank: 1,
        symbol: 'NVDA',
        market: Market.US,
        tag: 'momentum',
        score: 1,
        priceAtRun: 100,
        changePercent1d: 0,
        outcomes: [],
      },
      [],
    );
    expect(view.name).toBe('NVDA');
  });
});
