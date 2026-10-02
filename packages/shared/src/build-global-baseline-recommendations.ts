import {
  buildInvestorProfile,
  createDefaultStoredProfile,
} from './investor-survey/profile';
import { buildStockRecommendations } from './market-recommendation/engine';
import type { MarketContextInput, StockRecommendationsResult } from './market-recommendation/types';

/** Global baseline — pre-fetched candidateQuotes + default profile (no user holdings). */
export function buildGlobalBaselineRecommendations(input: {
  candidateQuotes?: MarketContextInput['candidateQuotes'];
  marketContext: Omit<
    MarketContextInput,
    'investorProfile' | 'preferredTags' | 'userHoldings' | 'userWatchlist'
  > & {
    technicalSnapshots?: MarketContextInput['technicalSnapshots'];
    newsSnapshots?: MarketContextInput['newsSnapshots'];
    eventSnapshots?: MarketContextInput['eventSnapshots'];
    figureStatements?: MarketContextInput['figureStatements'];
  };
  maxRecommendations?: number;
}): StockRecommendationsResult {
  const builtProfile = buildInvestorProfile(createDefaultStoredProfile());

  return buildStockRecommendations(
    {
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
