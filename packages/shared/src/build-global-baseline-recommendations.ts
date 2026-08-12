import {
  buildInvestorProfile,
  createDefaultStoredProfile,
} from './investor-survey/profile';
import { buildStockRecommendations } from './market-recommendation/engine';
import type { MarketContextInput, StockRecommendationsResult } from './market-recommendation/types';
import type { FeaturedQuoteInput } from './portfolio-capital-simulation';

/**
 * Global baseline — Featured + optional candidate quotes, default profile,
 * no user holdings or watchlist. Used for Phase Q ledger and engine validation.
 */
export function buildGlobalBaselineRecommendations(input: {
  featuredKr: FeaturedQuoteInput[];
  featuredUs: FeaturedQuoteInput[];
  candidateQuotes?: MarketContextInput['candidateQuotes'];
  marketContext: Omit<
    MarketContextInput,
    'krQuotes' | 'usQuotes' | 'investorProfile' | 'preferredTags' | 'userHoldings' | 'userWatchlist'
  > & { technicalSnapshots?: MarketContextInput['technicalSnapshots'] };
  maxRecommendations?: number;
}): StockRecommendationsResult {
  const builtProfile = buildInvestorProfile(createDefaultStoredProfile());

  return buildStockRecommendations(
    {
      krQuotes: input.featuredKr,
      usQuotes: input.featuredUs,
      candidateQuotes: input.candidateQuotes,
      investorProfile: builtProfile,
      preferredTags: builtProfile.preferredTags,
      userHoldings: [],
      userWatchlist: [],
      ...input.marketContext,
    },
    input.maxRecommendations ?? 6,
  );
}
