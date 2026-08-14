import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import {
  applyEventEnrichment,
  buildStockEventFromHeadline,
  buildStockEventSnapshot,
} from '@sar/shared';
import type { RecommendationTag } from '@sar/shared';

function emptyTagScores(): Record<RecommendationTag, number> {
  return { momentum: 0, watchlist: 0, pullback: 0, defensive: 0 };
}

function isoDayOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

describe('event-enrichment (Phase I)', () => {
  it('buildStockEventSnapshot classifies earnings beat on D0', () => {
    const snap = buildStockEventSnapshot({
      symbol: 'AAPL',
      market: Market.US,
      earnings: [
        {
          period: '2026Q2',
          reportDate: isoDayOffset(0),
          actual: 1.5,
          estimate: 1.2,
          surprisePercent: 25,
        },
      ],
    });
    expect(snap?.kind).toBe('earnings_beat');
    expect(snap?.eventDay).toBe('D0');
  });

  it('applyEventEnrichment adds CH_EVENT on earnings beat', () => {
    const tagScores = emptyTagScores();
    const snap = buildStockEventSnapshot({
      symbol: 'MSFT',
      market: Market.US,
      earnings: [
        {
          period: '2026Q1',
          reportDate: isoDayOffset(0),
          actual: 2.9,
          estimate: 2.7,
          surprisePercent: 7,
        },
      ],
    });
    expect(snap).not.toBeNull();

    const breakdown = applyEventEnrichment(tagScores, snap!);
    expect(breakdown.some((b) => b.factor === 'CH_EVENT:earningsBeat')).toBe(true);
    expect(tagScores.momentum).toBeCloseTo(0.15, 8);
  });

  it('buildStockEventFromHeadline detects dividend headline', () => {
    const snap = buildStockEventFromHeadline({
      symbol: '005930',
      market: Market.KR,
      headline: '삼성전자 배당 확대 검토',
    });
    expect(snap?.kind).toBe('dividend');
    expect(snap?.eventDay).toBe('D0');
  });

  it('buildStockEventSnapshot returns upcoming on D-1 without actual', () => {
    const snap = buildStockEventSnapshot({
      symbol: 'NVDA',
      market: Market.US,
      earnings: [
        {
          period: '2026Q2',
          reportDate: isoDayOffset(-1),
          actual: null,
          estimate: 5.1,
        },
      ],
    });
    expect(snap?.kind).toBe('earnings_upcoming');
    expect(snap?.eventDay).toBe('D-1');
  });
});
