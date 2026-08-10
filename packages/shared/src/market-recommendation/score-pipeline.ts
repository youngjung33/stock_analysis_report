import type { EnrichedStockRecommendation } from './types';
import { applyEnrichmentCaps } from './score-caps';

/** §9.0 step 8 — cap trim after all channel deltas merged into breakdown */
export function applyScorePipeline(rec: EnrichedStockRecommendation): EnrichedStockRecommendation {
  if (!rec.scoreBreakdown?.length || rec.score == null) return rec;

  const { breakdown, score } = applyEnrichmentCaps(rec.scoreBreakdown, rec.score);
  const topFactors = [...breakdown].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);

  return {
    ...rec,
    score,
    scoreBreakdown: breakdown,
    evidenceItems: topFactors.map((f) => ({
      key: f.evidenceKey,
      params: f.evidenceParams,
    })),
  };
}

export { applyEnrichmentCaps, classifyScoreChannel, enrichmentFactor } from './score-caps';
export type { ScoreChannel } from './score-caps';
