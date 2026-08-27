import { TransactionType } from './enums';

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
  tradedAt: Date | string;
  /** Optional per-trade commission included in cost basis / realized PnL */
  commission?: number;
}

export function toPositionTransaction(tx: {
  type: TransactionType;
  quantity: number;
  price: number;
  tradedAt: Date | string;
  commission?: number | null;
}): PositionTransaction {
  return {
    type: tx.type,
    quantity: tx.quantity,
    price: tx.price,
    tradedAt: tx.tradedAt,
    commission: tx.commission && tx.commission > 0 ? tx.commission : undefined,
  };
}

export function computePosition(transactions: PositionTransaction[]): PositionState {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
  );

  let quantity = 0;
  let totalCost = 0;
  let realizedPnl = 0;

  for (const tx of sorted) {
    const commission = Math.max(0, tx.commission ?? 0);

    if (tx.type === TransactionType.BUY) {
      totalCost += tx.quantity * tx.price + commission;
      quantity += tx.quantity;
    } else {
      if (tx.quantity > quantity) {
        throw new Error('Invalid sell quantity in history');
      }
      const avgCost = quantity > 0 ? totalCost / quantity : 0;
      realizedPnl += (tx.price - avgCost) * tx.quantity - commission;
      totalCost -= avgCost * tx.quantity;
      quantity -= tx.quantity;
    }
  }

  const averageCost = quantity > 0 ? totalCost / quantity : 0;
  return { quantity, averageCost, realizedPnl, costBasis: totalCost };
}
