import { CashBalances } from './cash-ledger';
import { Market } from './enums';
import {
  buildInvestorProfile,
  createDefaultStoredProfile,
  type BuiltInvestorProfile,
  type StoredInvestorProfile,
} from './investor-survey/profile';
import { buildStockRecommendations } from './market-recommendation/engine';
import type { MarketContextInput } from './market-recommendation/types';
import type { MarketInsightsResult } from './market-insights.types';
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
  recommendations: MarketInsightsResult['recommendations'];
  regimes: MarketInsightsResult['regimes'];
}

export function toFeaturedQuoteInputs(
  quotes: {
    symbol: string;
    name: string;
    market: Market;
    currency: string;
    currentPrice: number | null;
    changePercent: number | null;
  }[],
): FeaturedQuoteInput[] {
  return quotes
    .filter((q): q is typeof q & { currentPrice: number } => q.currentPrice != null)
    .map((q) => ({
      symbol: q.symbol,
      name: q.name,
      market: q.market,
      currency: q.currency,
      currentPrice: q.currentPrice,
      changePercent: q.changePercent,
    }));
}

/** Market context + holdings → ranked recommendations → portfolio simulation */
export function buildRankedPortfolioSimulation(input: {
  cash: CashBalances;
  holdings: SimulationHoldingInput[];
  preferences: PortfolioPreferences;
  featuredKr: FeaturedQuoteInput[];
  featuredUs: FeaturedQuoteInput[];
  storedProfile?: StoredInvestorProfile | null;
  usdKrwRate: number | null;
  insightCount?: number;
  marketContext?: Omit<MarketContextInput, 'krQuotes' | 'usQuotes' | 'investorProfile' | 'preferredTags'>;
  candidateQuotes?: MarketContextInput['candidateQuotes'];
}): RankedPortfolioSimulationResult {
  const storedProfile = input.storedProfile ?? createDefaultStoredProfile();
  const builtProfile = buildInvestorProfile(storedProfile);

  const contextInput: MarketContextInput = {
    krQuotes: input.featuredKr,
    usQuotes: input.featuredUs,
    candidateQuotes: input.candidateQuotes,
    usdKrwRate: input.usdKrwRate,
    investorProfile: builtProfile,
    preferredTags: builtProfile.preferredTags,
    userHoldings: input.holdings.map((h) => ({ symbol: h.symbol, market: h.market })),
    ...input.marketContext,
  };

  const recResult = buildStockRecommendations(contextInput, input.insightCount ?? 6);
  const insights: MarketInsightsResult = {
    kr: recResult.kr,
    us: recResult.us,
    recommendations: recResult.recommendations as MarketInsightsResult['recommendations'],
    regimes: recResult.regimes,
  };

  const simulation = buildPortfolioSimulation({
    cash: input.cash,
    holdings: input.holdings,
    preferences: input.preferences,
    recommendations: recResult.recommendations,
    usdKrwRate: input.usdKrwRate,
    regimes: recResult.regimes.map((r) => r.id),
  });

  return {
    simulation,
    builtProfile,
    insights,
    storedProfile,
    recommendations: recResult.recommendations,
    regimes: recResult.regimes,
  };
}
