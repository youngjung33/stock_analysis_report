import { ENRICHMENT_SCORE_CAPS } from './score-caps';
import type { RecommendationBacktestSummary } from '../recommendation-backtest';

/** Bump when ENRICHMENT_SCORE_CAPS or channel deltas change materially */
export const ENRICHMENT_DELTA_PROFILE_VERSION = '1.0.0';

export type DeltaTuningHintSeverity = 'info' | 'warn';

export interface DeltaTuningHint {
  severity: DeltaTuningHintSeverity;
  hintKey: string;
  params: Record<string, string | number>;
}

const MIN_HORIZON_SAMPLES = 10;
const MIN_TAG_SAMPLES = 5;
const HORIZON_ALPHA_WARN_THRESHOLD = -1;
const TAG_ALPHA_INFO_THRESHOLD = -2;

/** Heuristic review hints — manual cap/delta changes only after ledger review */
export function suggestDeltaTuningHints(summary: RecommendationBacktestSummary): DeltaTuningHint[] {
  const hints: DeltaTuningHint[] = [];

  for (const horizon of summary.horizons) {
    if (
      horizon.evaluatedCount >= MIN_HORIZON_SAMPLES &&
      horizon.avgAlphaPercent != null &&
      horizon.avgAlphaPercent < HORIZON_ALPHA_WARN_THRESHOLD
    ) {
      hints.push({
        severity: 'warn',
        hintKey: 'negativeAlphaHorizon',
        params: {
          horizon: horizon.horizon,
          alpha: Number(horizon.avgAlphaPercent.toFixed(2)),
          count: horizon.evaluatedCount,
        },
      });
    }
  }

  for (const tag of summary.byTag.slice(0, 8)) {
    if (
      tag.sampleCount >= MIN_TAG_SAMPLES &&
      tag.avgAlphaPercent != null &&
      tag.avgAlphaPercent < TAG_ALPHA_INFO_THRESHOLD
    ) {
      hints.push({
        severity: 'info',
        hintKey: 'tagUnderperform',
        params: {
          tag: tag.tag,
          horizon: tag.horizon,
          alpha: Number(tag.avgAlphaPercent.toFixed(2)),
          count: tag.sampleCount,
        },
      });
    }
  }

  return hints;
}

export function enrichmentScoreCapsSnapshot(): typeof ENRICHMENT_SCORE_CAPS {
  return { ...ENRICHMENT_SCORE_CAPS };
}
