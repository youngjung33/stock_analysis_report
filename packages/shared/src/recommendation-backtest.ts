import {
  RECOMMENDATION_OUTCOME_HORIZONS,
  type RecommendationBatchView,
  type RecommendationOutcomeHorizon,
} from './recommendation-ledger';

export interface RecommendationBacktestHorizonStats {
  horizon: RecommendationOutcomeHorizon;
  sampleCount: number;
  evaluatedCount: number;
  avgReturnPercent: number | null;
  avgAlphaPercent: number | null;
  hitRatePercent: number | null;
}

export interface RecommendationBacktestTagStats {
  tag: string;
  horizon: RecommendationOutcomeHorizon;
  sampleCount: number;
  avgReturnPercent: number | null;
  avgAlphaPercent: number | null;
}

export interface RecommendationBacktestCoverage {
  outcomeSlotsTotal: number;
  outcomeEvaluatedCount: number;
  outcomePendingCount: number;
  coveragePercent: number | null;
}

export interface RecommendationBacktestSummary {
  batchCount: number;
  itemCount: number;
  coverage: RecommendationBacktestCoverage;
  horizons: RecommendationBacktestHorizonStats[];
  byTag: RecommendationBacktestTagStats[];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Phase N+ — aggregate ledger outcomes by horizon and tag */
export function computeRecommendationBacktestSummary(
  batches: RecommendationBatchView[],
): RecommendationBacktestSummary {
  const itemCount = batches.reduce((sum, batch) => sum + batch.items.length, 0);

  const horizons = RECOMMENDATION_OUTCOME_HORIZONS.map((horizon) => {
    const returns: number[] = [];
    const alphas: number[] = [];

    for (const batch of batches) {
      for (const item of batch.items) {
        const outcome = item.outcomes.find((o) => o.horizon === horizon);
        if (outcome?.returnPercent == null) continue;
        returns.push(outcome.returnPercent);
        if (outcome.alphaVsBenchmark != null) {
          alphas.push(outcome.alphaVsBenchmark);
        }
      }
    }

    const hitRatePercent =
      returns.length > 0
        ? (returns.filter((r) => r > 0).length / returns.length) * 100
        : null;

    return {
      horizon,
      sampleCount: itemCount,
      evaluatedCount: returns.length,
      avgReturnPercent: average(returns),
      avgAlphaPercent: average(alphas),
      hitRatePercent,
    };
  });

  const tagBuckets = new Map<string, { returns: number[]; alphas: number[] }>();

  for (const batch of batches) {
    for (const item of batch.items) {
      for (const horizon of RECOMMENDATION_OUTCOME_HORIZONS) {
        const outcome = item.outcomes.find((o) => o.horizon === horizon);
        if (outcome?.returnPercent == null) continue;

        const key = `${item.tag}\0${horizon}`;
        const bucket = tagBuckets.get(key) ?? { returns: [], alphas: [] };
        bucket.returns.push(outcome.returnPercent);
        if (outcome.alphaVsBenchmark != null) {
          bucket.alphas.push(outcome.alphaVsBenchmark);
        }
        tagBuckets.set(key, bucket);
      }
    }
  }

  const byTag = [...tagBuckets.entries()]
    .map(([key, bucket]) => {
      const split = key.indexOf('\0');
      const tag = key.slice(0, split);
      const horizon = key.slice(split + 1) as RecommendationOutcomeHorizon;
      return {
        tag,
        horizon,
        sampleCount: bucket.returns.length,
        avgReturnPercent: average(bucket.returns),
        avgAlphaPercent: average(bucket.alphas),
      };
    })
    .sort((a, b) => b.sampleCount - a.sampleCount);

  const outcomeSlotsTotal = itemCount * RECOMMENDATION_OUTCOME_HORIZONS.length;
  let outcomeEvaluatedCount = 0;
  for (const batch of batches) {
    for (const item of batch.items) {
      for (const horizon of RECOMMENDATION_OUTCOME_HORIZONS) {
        const outcome = item.outcomes.find((o) => o.horizon === horizon);
        if (outcome?.returnPercent != null) {
          outcomeEvaluatedCount += 1;
        }
      }
    }
  }

  const coverage: RecommendationBacktestCoverage = {
    outcomeSlotsTotal,
    outcomeEvaluatedCount,
    outcomePendingCount: outcomeSlotsTotal - outcomeEvaluatedCount,
    coveragePercent:
      outcomeSlotsTotal > 0 ? (outcomeEvaluatedCount / outcomeSlotsTotal) * 100 : null,
  };

  return {
    batchCount: batches.length,
    itemCount,
    coverage,
    horizons,
    byTag,
  };
}
