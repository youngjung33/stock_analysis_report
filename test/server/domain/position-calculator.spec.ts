import { vi, type Mock } from 'vitest';
import { TransactionType } from '@sar/shared';
import { InvalidPositionError } from '@server/domain/errors/domain.errors';
import { computePosition } from '@server/domain/services/position-calculator';

describe('PositionCalculator', () => {
  const d = (s: string) => new Date(s);

  // PC-01
  it('computes single BUY position', () => {
    const result = computePosition([
      { type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: d('2024-01-01') },
    ]);
    expect(result.quantity).toBe(10);
    expect(result.averageCost).toBe(100);
    expect(result.costBasis).toBe(1000);
    expect(result.realizedPnl).toBe(0);
  });

  // PC-02
  it('computes weighted average for DCA', () => {
    const result = computePosition([
      { type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: d('2024-01-01') },
      { type: TransactionType.BUY, quantity: 10, price: 200, tradedAt: d('2024-02-01') },
    ]);
    expect(result.quantity).toBe(20);
    expect(result.averageCost).toBe(150);
    expect(result.costBasis).toBe(3000);
  });

  // PC-06 — 물타기: 고가 매수 후 저가 추가 매수
  it('computes weighted average when averaging down (high buy then lower buy)', () => {
    const result = computePosition([
      { type: TransactionType.BUY, quantity: 10, price: 100_000, tradedAt: d('2024-01-01') },
      { type: TransactionType.BUY, quantity: 10, price: 60_000, tradedAt: d('2024-02-01') },
    ]);
    expect(result.quantity).toBe(20);
    expect(result.averageCost).toBe(80_000);
    expect(result.costBasis).toBe(1_600_000);
    expect(result.realizedPnl).toBe(0);
  });

  // PC-07 — 물타기 후 부분 매도 시 평단 기준 실현손익
  it('computes realized PnL after averaging down and partial sell', () => {
    const result = computePosition([
      { type: TransactionType.BUY, quantity: 10, price: 100_000, tradedAt: d('2024-01-01') },
      { type: TransactionType.BUY, quantity: 10, price: 60_000, tradedAt: d('2024-02-01') },
      { type: TransactionType.SELL, quantity: 10, price: 90_000, tradedAt: d('2024-03-01') },
    ]);
    expect(result.quantity).toBe(10);
    expect(result.averageCost).toBe(80_000);
    expect(result.realizedPnl).toBe(100_000);
    expect(result.costBasis).toBe(800_000);
  });

  // PC-03
  it('computes realized PnL after partial SELL', () => {
    const result = computePosition([
      { type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: d('2024-01-01') },
      { type: TransactionType.SELL, quantity: 5, price: 150, tradedAt: d('2024-03-01') },
    ]);
    expect(result.quantity).toBe(5);
    expect(result.realizedPnl).toBe(250);
    expect(result.costBasis).toBe(500);
  });

  // PC-04
  it('throws when SELL exceeds holdings', () => {
    expect(() =>
      computePosition([
        { type: TransactionType.BUY, quantity: 5, price: 100, tradedAt: d('2024-01-01') },
        { type: TransactionType.SELL, quantity: 10, price: 150, tradedAt: d('2024-02-01') },
      ]),
    ).toThrow(InvalidPositionError);
  });

  // PC-05
  it('returns zero quantity after full SELL', () => {
    const result = computePosition([
      { type: TransactionType.BUY, quantity: 10, price: 100, tradedAt: d('2024-01-01') },
      { type: TransactionType.SELL, quantity: 10, price: 120, tradedAt: d('2024-02-01') },
    ]);
    expect(result.quantity).toBe(0);
    expect(result.averageCost).toBe(0);
    expect(result.realizedPnl).toBe(200);
  });
});
