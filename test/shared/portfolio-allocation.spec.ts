import { describe, expect, it } from 'vitest';
import { Market } from '@sar/shared';
import { computeAllocation } from '@sar/shared';

describe('computeAllocation', () => {
  it('returns weights summing to 100%', () => {
    const result = computeAllocation([
      { symbol: 'A', name: 'A', market: Market.KR, marketValueKrw: 600_000 },
      { symbol: 'B', name: 'B', market: Market.US, marketValueKrw: 400_000 },
    ]);
    const sum = result.items.reduce((s, i) => s + i.weightPercent, 0);
    expect(sum).toBeCloseTo(100, 5);
    expect(result.items[0].weightPercent).toBeCloseTo(60, 5);
    expect(result.allocationByMarket.krPercent).toBeCloseTo(60, 5);
  });

  it('excludes holdings without market value', () => {
    const result = computeAllocation([
      { symbol: 'A', name: 'A', market: Market.KR, marketValueKrw: 100_000 },
      { symbol: 'B', name: 'B', market: Market.US, marketValueKrw: null },
    ]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].weightPercent).toBe(100);
  });

  it('returns empty for no eligible holdings', () => {
    const result = computeAllocation([
      { symbol: 'A', name: 'A', market: Market.KR, marketValueKrw: null },
    ]);
    expect(result.items).toHaveLength(0);
  });
});
