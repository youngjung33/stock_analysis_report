import { CashBalances } from './cash-ledger';
import { Market } from './enums';
import {
  buildInvestorProfile,
  createDefaultStoredProfile,
  rankRecommendationsByTags,
  type BuiltInvestorProfile,
  type StoredInvestorProfile,
} from './investor-survey/profile';
import { buildMarketInsights, type MarketInsightsResult } from './market-insights';
import {
  buildPortfolioSimulation,
  type PortfolioPreferences,
  type PortfolioSimulationResult,
  type SimulationHoldingInput,
} from './portfolio-simulation';

export interface FeaturedQuoteInput {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  currentPrice: number;
  changePercent: number | null;
}

export interface RankedPortfolioSimulationResult {
  simulation: PortfolioSimulationResult;
  builtProfile: BuiltInvestorProfile;
  insights: MarketInsightsResult;
  storedProfile: StoredInvestorProfile;
}

/** Featured quotes + investor profile → ranked recommendations → portfolio simulation */
export function buildRankedPortfolioSimulation(input: {
  cash: CashBalances;
  holdings: SimulationHoldingInput[];
  preferences: PortfolioPreferences;
  featuredKr: FeaturedQuoteInput[];
  featuredUs: FeaturedQuoteInput[];
  storedProfile?: StoredInvestorProfile | null;
  usdKrwRate: number | null;
  insightCount?: number;
}): RankedPortfolioSimulationResult {
  const storedProfile = input.storedProfile ?? createDefaultStoredProfile();
  const builtProfile = buildInvestorProfile(storedProfile);
  const insights = buildMarketInsights(
    input.featuredKr,
    input.featuredUs,
    input.insightCount ?? 6,
  );
  const rankedRecommendations = rankRecommendationsByTags(
    insights.recommendations.filter((r) => r.currentPrice > 0),
    builtProfile.preferredTags,
  );
  const simulation = buildPortfolioSimulation({
    cash: input.cash,
    holdings: input.holdings,
    preferences: input.preferences,
    recommendations: rankedRecommendations,
    usdKrwRate: input.usdKrwRate,
  });

  return { simulation, builtProfile, insights, storedProfile };
}
