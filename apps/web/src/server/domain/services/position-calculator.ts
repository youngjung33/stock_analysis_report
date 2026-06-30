import {
  computePosition as computeSharedPosition,
  PositionState,
  PositionTransaction,
} from '@sar/shared';
import { InvalidPositionError } from '../errors/domain.errors';

export type { PositionState, PositionTransaction };

/** @sar/shared computePosition 래퍼 — 도메인 에러로 매핑 */
export function computePosition(transactions: PositionTransaction[]): PositionState {
  try {
    return computeSharedPosition(transactions);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid sell quantity in history') {
      throw new InvalidPositionError(error.message);
    }
    throw error;
  }
}
