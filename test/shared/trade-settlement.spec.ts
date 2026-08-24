import { describe, expect, it } from 'vitest';
import { Market, TransactionType, computeTradeCashSettlement } from '@sar/shared';

describe('computeTradeCashSettlement', () => {
  it('adds commission to KR buy settle amount', () => {
    const result = computeTradeCashSettlement({
      type: TransactionType.BUY,
      quantity: 10,
      price: 70_000,
      market: Market.KR,
      commission: 1_000,
    });

    expect(result.notional).toBe(700_000);
    expect(result.commission).toBe(1_000);
    expect(result.settleAmount).toBe(701_000);
    expect(result.currency).toBe('KRW');
  });

  it('deducts commission from KR sell net proceeds after STT', () => {
    const result = computeTradeCashSettlement({
      type: TransactionType.SELL,
      quantity: 10,
      price: 100_000,
      market: Market.KR,
      commission: 500,
    });

    expect(result.securitiesTaxKrw).toBe(2_000);
    expect(result.settleAmount).toBe(997_500);
  });

  it('deducts commission from US sell gross', () => {
    const result = computeTradeCashSettlement({
      type: TransactionType.SELL,
      quantity: 5,
      price: 200,
      market: Market.US,
      commission: 3,
    });

    expect(result.securitiesTaxKrw).toBe(0);
    expect(result.settleAmount).toBe(997);
    expect(result.currency).toBe('USD');
  });

  it('treats missing commission as zero', () => {
    const result = computeTradeCashSettlement({
      type: TransactionType.BUY,
      quantity: 1,
      price: 100,
      market: Market.US,
    });

    expect(result.commission).toBe(0);
    expect(result.settleAmount).toBe(100);
  });
});
