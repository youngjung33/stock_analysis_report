import { TransactionType } from '@sar/shared';
import { InvalidPositionError } from '../errors/domain.errors';

export interface PositionState {
  quantity: number;
  averageCost: number;
  realizedPnl: number;
  costBasis: number;
}

export interface PositionTransaction {
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: Date;
}

export function computePosition(transactions: PositionTransaction[]): PositionState {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
  );

  let quantity = 0;
  let totalCost = 0;
  let realizedPnl = 0;

  for (const tx of sorted) {
    if (tx.type === TransactionType.BUY) {
      totalCost += tx.quantity * tx.price;
      quantity += tx.quantity;
    } else {
      if (tx.quantity > quantity) {
        throw new InvalidPositionError('Invalid sell quantity in history');
      }
      const avgCost = quantity > 0 ? totalCost / quantity : 0;
      realizedPnl += (tx.price - avgCost) * tx.quantity;
      totalCost -= avgCost * tx.quantity;
      quantity -= tx.quantity;
    }
  }

  const averageCost = quantity > 0 ? totalCost / quantity : 0;
  return { quantity, averageCost, realizedPnl, costBasis: totalCost };
}
