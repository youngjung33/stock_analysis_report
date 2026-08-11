import type { RecommendationTag } from '../market-sentiment';
import type { ScoreBreakdownItem } from './types';

export type ScoreChannel =
  | 'CH_BASE'
  | 'CH_TECH'
  | 'CH_EVENT'
  | 'CH_FIGURE_DIRECT'
  | 'CH_FIGURE_SECTOR'
  | 'CH_NEWS'
  | 'CH_NARRATIVE';

export const ENRICHMENT_SCORE_CAPS = {
  maxAbsEnrichmentSum: 0.5,
  maxAbsTier3Sum: 0.2,
  maxSingleT2: 0.35,
  maxSingleT3: 0.15,
} as const;

const T2_CHANNELS: ScoreChannel[] = ['CH_TECH', 'CH_EVENT', 'CH_FIGURE_DIRECT', 'CH_FIGURE_SECTOR'];
const T3_CHANNELS: ScoreChannel[] = ['CH_NEWS', 'CH_NARRATIVE'];

export function classifyScoreChannel(factor: string): ScoreChannel {
  if (factor.startsWith('CH_TECH:')) return 'CH_TECH';
  if (factor.startsWith('CH_EVENT:')) return 'CH_EVENT';
  if (factor.startsWith('CH_FIGURE_DIRECT:')) return 'CH_FIGURE_DIRECT';
  if (factor.startsWith('CH_FIGURE_SECTOR:')) return 'CH_FIGURE_SECTOR';
  if (factor.startsWith('CH_NEWS:')) return 'CH_NEWS';
  if (factor.startsWith('CH_NARRATIVE:')) return 'CH_NARRATIVE';
  if (factor.startsWith('CAP_TRIM:')) return 'CH_BASE';
  return 'CH_BASE';
}

function isEnrichmentChannel(channel: ScoreChannel): boolean {
  return channel !== 'CH_BASE';
}

function tierOf(channel: ScoreChannel): 'T2' | 'T3' | 'base' {
  if (T3_CHANNELS.includes(channel)) return 'T3';
  if (T2_CHANNELS.includes(channel)) return 'T2';
  return 'base';
}

function clampSingleFactor(item: ScoreBreakdownItem): ScoreBreakdownItem {
  const channel = classifyScoreChannel(item.factor);
  const tier = tierOf(channel);
  if (tier === 'T2') {
    const cap = ENRICHMENT_SCORE_CAPS.maxSingleT2;
    if (Math.abs(item.delta) > cap) {
      return { ...item, delta: Math.sign(item.delta) * cap };
    }
  }
  if (tier === 'T3') {
    const cap = ENRICHMENT_SCORE_CAPS.maxSingleT3;
    if (Math.abs(item.delta) > cap) {
      return { ...item, delta: Math.sign(item.delta) * cap };
    }
  }
  return item;
}

function sumAbs(items: ScoreBreakdownItem[]): number {
  return items.reduce((s, i) => s + Math.abs(i.delta), 0);
}

function trimByAbsDelta(items: ScoreBreakdownItem[], excess: number): {
  kept: ScoreBreakdownItem[];
  removed: ScoreBreakdownItem[];
} {
  const sorted = [...items].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const kept: ScoreBreakdownItem[] = [];
  const removed: ScoreBreakdownItem[] = [];
  let remaining = excess;

  for (const item of sorted) {
    if (remaining <= 0) {
      kept.push(item);
      continue;
    }
    const abs = Math.abs(item.delta);
    if (abs <= remaining) {
      removed.push(item);
      remaining -= abs;
    } else {
      const trimmedDelta = Math.sign(item.delta) * (abs - remaining);
      kept.push({ ...item, delta: trimmedDelta });
      removed.push({ ...item, delta: Math.sign(item.delta) * remaining });
      remaining = 0;
    }
  }

  return { kept, removed };
}

/** §9.0 cap — enrichment channels only; CH_BASE (v1) never trimmed */
export function applyEnrichmentCaps(
  breakdown: ScoreBreakdownItem[],
  score: number,
): { breakdown: ScoreBreakdownItem[]; score: number } {
  const base = breakdown.filter((b) => !isEnrichmentChannel(classifyScoreChannel(b.factor)));
  let enrichment = breakdown
    .filter((b) => isEnrichmentChannel(classifyScoreChannel(b.factor)))
    .map(clampSingleFactor);

  const trimRecords: ScoreBreakdownItem[] = [];
  let removedScore = 0;

  const t3 = enrichment.filter((b) => tierOf(classifyScoreChannel(b.factor)) === 'T3');
  const t3Sum = sumAbs(t3);
  if (t3Sum > ENRICHMENT_SCORE_CAPS.maxAbsTier3Sum) {
    const { kept, removed } = trimByAbsDelta(t3, t3Sum - ENRICHMENT_SCORE_CAPS.maxAbsTier3Sum);
    removedScore += removed.reduce((s, r) => s + r.delta, 0);
    if (removed.length > 0) {
      trimRecords.push({
        factor: 'CAP_TRIM:CH_NEWS',
        delta: -removed.reduce((s, r) => s + r.delta, 0),
        evidenceKey: 'shared.market.recommendation.evidence.capTier3',
      });
    }
    const t2rest = enrichment.filter((b) => tierOf(classifyScoreChannel(b.factor)) === 'T2');
    enrichment = [...kept, ...t2rest];
  }

  const enrichSum = sumAbs(enrichment);
  if (enrichSum > ENRICHMENT_SCORE_CAPS.maxAbsEnrichmentSum) {
    const { kept, removed } = trimByAbsDelta(enrichment, enrichSum - ENRICHMENT_SCORE_CAPS.maxAbsEnrichmentSum);
    removedScore += removed.reduce((s, r) => s + r.delta, 0);
    if (removed.length > 0) {
      trimRecords.push({
        factor: 'CAP_TRIM:CH_ENRICH',
        delta: -removed.reduce((s, r) => s + r.delta, 0),
        evidenceKey: 'shared.market.recommendation.evidence.capEnrichment',
      });
    }
    enrichment = kept;
  }

  const nextScore = score - removedScore;
  return {
    breakdown: [...base, ...enrichment, ...trimRecords],
    score: nextScore,
  };
}

/** Test helper — build enrichment breakdown row */
export function enrichmentFactor(
  channel: Exclude<ScoreChannel, 'CH_BASE'>,
  name: string,
  delta: number,
  evidenceKey: string,
  options?: {
    dedupeKey?: string;
    evidenceParams?: Record<string, string | number>;
  },
): ScoreBreakdownItem {
  return {
    factor: `${channel}:${name}`,
    delta,
    evidenceKey,
    dedupeKey: options?.dedupeKey,
    evidenceParams: options?.evidenceParams,
  };
}
