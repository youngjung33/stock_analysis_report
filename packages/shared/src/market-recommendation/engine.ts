import { Market } from '../enums';
import { buildInvestorProfile, createDefaultStoredProfile } from '../investor-survey/profile';
import { computeRegionSentiment } from '../market-sentiment';
import { buildMacroSnapshot } from '../market-macro';
import { buildCandidatePool, mergeQuotesIntoCandidates } from './candidate-pool';
import { buildMarketContext } from './regime';
import { scoreCandidates } from './scoring';
import type { MarketContextInput, StockRecommendationsResult } from './types';

export function buildStockRecommendations(
  input: MarketContextInput,
  maxRecommendations = 6,
): StockRecommendationsResult {
  const krSentiment = computeRegionSentiment(Market.KR, input.krQuotes);
  const usSentiment = computeRegionSentiment(Market.US, input.usQuotes);

  const storedProfile = input.investorProfile ?? buildInvestorProfile(createDefaultStoredProfile());
  const preferredTags = input.preferredTags ?? storedProfile.preferredTags;

  const ctx = buildMarketContext({
    krSentiment,
    usSentiment,
    macro: input.macro ?? [],
    sectors: input.sectors ?? [],
    indices: input.indices ?? [],
    usdKrwRate: input.usdKrwRate ?? null,
    usdKrwChange1d: input.usdKrwChange1d ?? null,
    preferredTags,
    userHoldings: input.userHoldings,
    userWatchlist: input.userWatchlist,
  });

  const pool = buildCandidatePool({
    userHoldings: input.userHoldings,
    userWatchlist: input.userWatchlist,
    catalogSymbols: input.catalogSymbols,
  });

  const allQuotes = mergeQuotesIntoCandidates(pool, [
    ...input.krQuotes,
    ...input.usQuotes,
    ...(input.candidateQuotes ?? []),
  ]);

  const scored = scoreCandidates(allQuotes, ctx);

  const krTop = scored.filter((r) => r.market === Market.KR).slice(0, 2);
  const usTop = scored.filter((r) => r.market === Market.US).slice(0, 2);
  const interleaved: typeof scored = [];
  const maxPerSide = Math.ceil(maxRecommendations / 2);
  for (let i = 0; i < maxPerSide; i++) {
    if (krTop[i]) interleaved.push(krTop[i]);
    if (usTop[i]) interleaved.push(usTop[i]);
  }

  const recommendations = interleaved.slice(0, maxRecommendations);
  if (recommendations.length < maxRecommendations) {
    for (const r of scored) {
      if (recommendations.length >= maxRecommendations) break;
      if (!recommendations.some((x) => x.symbol === r.symbol && x.market === r.market)) {
        recommendations.push(r);
      }
    }
  }

  return {
    kr: krSentiment,
    us: usSentiment,
    regimes: ctx.regimes,
    recommendations,
  };
}

/** Extract FX change from macro series inputs when snapshots not yet built */
export function resolveUsdKrwChange1d(
  macroSnapshots: ReturnType<typeof buildMacroSnapshot>[],
): number | null {
  const fx = macroSnapshots.find((m) => m?.kind === 'fx');
  return fx?.changePercent1d ?? null;
}

export function resolveUsdKrwRate(macroSnapshots: ReturnType<typeof buildMacroSnapshot>[]): number | null {
  const fx = macroSnapshots.find((m) => m?.kind === 'fx');
  return fx?.value ?? null;
}
