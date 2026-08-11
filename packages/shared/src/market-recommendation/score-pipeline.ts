import type { EnrichedStockRecommendation } from './types';
import { applyEnrichmentCaps } from './score-caps';
import { applyEnrichmentDedupe } from './score-dedupe';

/** §9.0 steps 5→8 — dedupe gate then cap trim */
export function applyScorePipeline(rec: EnrichedStockRecommendation): EnrichedStockRecommendation {
  if (!rec.scoreBreakdown?.length || rec.score == null) return rec;

  const afterDedupe = applyEnrichmentDedupe(rec.scoreBreakdown, rec.score);
  const { breakdown, score } = applyEnrichmentCaps(afterDedupe.breakdown, afterDedupe.score);
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
export { applyEnrichmentDedupe, figureLinkScopeAllowsSymbolDelta } from './score-dedupe';
export type { ScoreChannel } from './score-caps';
export type { FigureLinkScope } from './score-dedupe';
