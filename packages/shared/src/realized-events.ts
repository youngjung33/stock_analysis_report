import { TransactionType } from './enums';
import { CorporateActionInput, applyCorporateActions } from './corporate-actions';
import { PositionTransaction } from './position-calculator';

export interface SellEvent {
  tradedAt: string;
  quantity: number;
  price: number;
  proceeds: number;
  gain: number;
  averageCostAtSell: number;
}

export interface DividendEvent {
  effectiveAt: string;
  amount: number;
}

/** 매도 건별 실현손익·배당 이벤트 추출 (가중평균법) */
export function extractRealizedEvents(
  transactions: PositionTransaction[],
  actions: CorporateActionInput[],
): { sells: SellEvent[]; dividends: DividendEvent[] } {
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime(),
  );

  const syntheticTxs: PositionTransaction[] = [...transactions];
  const dividends: DividendEvent[] = [];

  for (const action of sortedActions) {
    if (action.type === 'DIVIDEND' && action.cashAmount) {
      dividends.push({ effectiveAt: String(action.effectiveAt), amount: action.cashAmount });
      continue;
    }

    if (action.type === 'SPLIT' && action.splitRatio && action.splitRatio > 0) {
      const ratio = action.splitRatio;
      const effectiveTime = new Date(action.effectiveAt).getTime();
      for (const tx of syntheticTxs) {
        if (new Date(tx.tradedAt).getTime() <= effectiveTime && tx.type === TransactionType.BUY) {
          tx.quantity *= ratio;
          tx.price /= ratio;
        }
      }
      continue;
    }

    if (action.type === 'MERGER') {
      const effectiveTime = new Date(action.effectiveAt).getTime();
      const positionBefore = applyCorporateActions(
        syntheticTxs.filter((tx) => new Date(tx.tradedAt).getTime() <= effectiveTime),
        [],
      );
      if (positionBefore.quantity > 0) {
        if (action.cashAmount) {
          dividends.push({ effectiveAt: String(action.effectiveAt), amount: action.cashAmount });
        }
        syntheticTxs.push({
          type: TransactionType.SELL,
          quantity: positionBefore.quantity,
          price: positionBefore.averageCost,
          tradedAt: action.effectiveAt,
        });
        if (action.targetQuantity && action.targetPrice !== undefined && action.targetPrice !== null) {
          syntheticTxs.push({
            type: TransactionType.BUY,
            quantity: action.targetQuantity,
            price: action.targetPrice,
            tradedAt: action.effectiveAt,
          });
        }
      }
    }
  }

  const sorted = [...syntheticTxs].sort(
    (a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime(),
  );

  let quantity = 0;
  let totalCost = 0;
  const sells: SellEvent[] = [];

  for (const tx of sorted) {
    if (tx.type === TransactionType.BUY) {
      totalCost += tx.quantity * tx.price;
      quantity += tx.quantity;
      continue;
    }

    if (tx.quantity > quantity) continue;

    const avgCost = quantity > 0 ? totalCost / quantity : 0;
    const gain = (tx.price - avgCost) * tx.quantity;
    sells.push({
      tradedAt: String(tx.tradedAt),
      quantity: tx.quantity,
      price: tx.price,
      proceeds: tx.price * tx.quantity,
      gain,
      averageCostAtSell: avgCost,
    });
    totalCost -= avgCost * tx.quantity;
    quantity -= tx.quantity;
  }

  return { sells, dividends };
}

export function filterEventsByYear<T extends { tradedAt?: string; effectiveAt?: string }>(
  events: T[],
  year: number,
  dateKey: 'tradedAt' | 'effectiveAt' = 'tradedAt',
): T[] {
  return events.filter((event) => {
    const raw = dateKey === 'tradedAt' ? event.tradedAt : event.effectiveAt;
    if (!raw) return false;
    return new Date(raw).getFullYear() === year;
  });
}
