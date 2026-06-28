import { describe, expect, it } from 'vitest';
import { TransactionType } from '@sar/shared';
import { applyCorporateActions } from '@sar/shared';

describe('applyCorporateActions', () => {
  it('adds dividend to realized pnl', () => {
    const result = applyCorporateActions(
      [{ type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: '2024-01-01' }],
      [{ type: 'DIVIDEND', effectiveAt: '2024-06-01', cashAmount: 1_000_000 }],
    );
    expect(result.quantity).toBe(10);
    expect(result.realizedPnl).toBe(1_000_000);
  });

  it('applies 2-for-1 split', () => {
    const result = applyCorporateActions(
      [{ type: TransactionType.BUY, quantity: 10, price: 100_000, tradedAt: '2024-01-01' }],
      [{ type: 'SPLIT', effectiveAt: '2024-06-01', splitRatio: 2 }],
    );
    expect(result.quantity).toBe(20);
    expect(result.averageCost).toBeCloseTo(50_000, 0);
    expect(result.costBasis).toBeCloseTo(1_000_000, 0);
  });
});
