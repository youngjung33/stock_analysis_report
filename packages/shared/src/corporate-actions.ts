/**
 * 기업 행사 — 배당·분할·합병 등을 거래 이력에 반영.
 */
import { Market, TransactionType } from './enums';
import { PositionState, PositionTransaction, computePosition } from './position-calculator';

export type CorporateActionType = 'DIVIDEND' | 'SPLIT' | 'MERGER';

export interface CorporateActionInput {
  type: CorporateActionType;
  effectiveAt: Date | string;
  cashAmount?: number | null;
  splitRatio?: number | null;
  targetQuantity?: number | null;
  targetPrice?: number | null;
}

/** 기업 행사(배당·분할·합병)를 거래에 적용해 포지션 재계산 */
export function applyCorporateActions(
  transactions: PositionTransaction[],
  actions: CorporateActionInput[],
): PositionState {
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime(),
  );

  let extraRealizedPnl = 0;
  const syntheticTxs: PositionTransaction[] = [...transactions];

  for (const action of sortedActions) {
    if (action.type === 'DIVIDEND' && action.cashAmount) {
      extraRealizedPnl += action.cashAmount;
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
      const positionBefore = computePosition(
        syntheticTxs.filter((tx) => new Date(tx.tradedAt).getTime() <= effectiveTime),
      );
      if (positionBefore.quantity > 0) {
        if (action.cashAmount) extraRealizedPnl += action.cashAmount;
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

  const position = computePosition(syntheticTxs);
  return {
    ...position,
    realizedPnl: position.realizedPnl + extraRealizedPnl,
  };
}
