import type { Market } from './enums';
import type { StoredInvestorProfile } from './investor-survey/profile';

export interface MarketPersonalizationScope {
  userHoldings?: Array<{ symbol: string; market: Market }>;
  userWatchlist?: Array<{ symbol: string; market: Market }>;
  investorProfile?: StoredInvestorProfile | null;
}

/** Stable React Query key segment for holdings/watchlist·투자 성향 personalization */
export function buildMarketPersonalizationScopeKey(scope?: MarketPersonalizationScope): string {
  if (!scope) return 'global';
  const parts: string[] = [];
  if (scope.investorProfile) {
    parts.push(
      `p:${scope.investorProfile.updatedAt}:${scope.investorProfile.adjustmentPercent}`,
    );
  }
  for (const h of scope.userHoldings ?? []) {
    parts.push(`h:${h.market}:${h.symbol.toUpperCase()}`);
  }
  for (const w of scope.userWatchlist ?? []) {
    parts.push(`w:${w.market}:${w.symbol.toUpperCase()}`);
  }
  if (parts.length === 0) return 'global';
  parts.sort();
  return parts.join('|');
}
