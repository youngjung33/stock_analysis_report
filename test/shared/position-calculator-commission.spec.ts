import { describe, expect, it } from 'vitest';
import { TransactionType } from '@sar/shared';
import { computePosition } from '@sar/shared';

describe('computePosition commission', () => {
  const d = (s: string) => new Date(s);

  it('includes buy commission in average cost and cost basis', () => {
    const result = computePosition([
      {
        type: TransactionType.BUY,
        quantity: 10,
        price: 70_000,
        commission: 1_000,
        tradedAt: d('2024-01-01'),
      },
    ]);

    expect(result.quantity).toBe(10);
    expect(result.averageCost).toBe(70_100);
    expect(result.costBasis).toBe(701_000);
  });

  it('includes sell commission in realized PnL', () => {
    const result = computePosition([
      {
        type: TransactionType.BUY,
        quantity: 10,
        price: 70_000,
        commission: 1_000,
        tradedAt: d('2024-01-01'),
      },
      {
        type: TransactionType.SELL,
        quantity: 5,
        price: 75_000,
        commission: 500,
        tradedAt: d('2024-02-01'),
      },
    ]);

    expect(result.quantity).toBe(5);
    expect(result.averageCost).toBe(70_100);
    expect(result.realizedPnl).toBe(24_000);
  });
});
