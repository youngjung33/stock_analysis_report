export enum Market {
  KR = 'KR',
  US = 'US',
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const GUEST_DISPLAY_NAME = '비회원';

export function isGuestUsername(username: string | null | undefined): boolean {
  return username === GUEST_DISPLAY_NAME;
}

export { computePosition } from './position-calculator';
export type { PositionState, PositionTransaction } from './position-calculator';
export { resolveCurrency, resolveYahooSymbol } from './stock-symbol';
