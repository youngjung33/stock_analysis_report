export { Market, TransactionType } from './enums';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const GUEST_DISPLAY_NAME = '비회원';

export function isGuestUsername(username: string | null | undefined): boolean {
  return username === GUEST_DISPLAY_NAME;
}

export { computePosition } from './position-calculator';
export type { PositionState, PositionTransaction } from './position-calculator';
export { resolveCurrency, resolveYahooSymbol } from './stock-symbol';
export {
  FEATURED_KR_STOCKS,
  FEATURED_US_STOCKS,
  FEATURED_STOCKS,
  featuredStockId,
} from './featured-stocks';
export type { FeaturedStock } from './featured-stocks';
