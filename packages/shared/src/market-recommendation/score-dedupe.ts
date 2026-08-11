import type { ScoreBreakdownItem } from './types';
import { classifyScoreChannel, type ScoreChannel } from './score-caps';

/** §9.0.2 — lower index = higher dedupe priority */
const DEDUPE_CHANNEL_PRIORITY: ScoreChannel[] = [
  'CH_EVENT',
  'CH_FIGURE_DIRECT',
  'CH_FIGURE_SECTOR',
  'CH_TECH',
  'CH_NEWS',
  'CH_NARRATIVE',
];

function channelPriority(channel: ScoreChannel): number {
  const idx = DEDUPE_CHANNEL_PRIORITY.indexOf(channel);
  return idx === -1 ? 99 : idx;
}

function isEnrichment(channel: ScoreChannel): boolean {
  return channel !== 'CH_BASE';
}

function itemKey(item: ScoreBreakdownItem): string {
  return `${item.factor}|${item.dedupeKey ?? ''}`;
}

function divergenceZeroesNews(item: ScoreBreakdownItem): boolean {
  const channel = classifyScoreChannel(item.factor);
  if (channel !== 'CH_NEWS' && channel !== 'CH_NARRATIVE') return false;
  const divergence = item.evidenceParams?.divergence;
  return divergence === 'bullish_news_price_down' || divergence === 'crowded_bullish_chase';
}

/** §9.0.2 dedupe gate — same dedupeKey → winner keeps delta; losers delta→0, evidence kept */
export function applyEnrichmentDedupe(
  breakdown: ScoreBreakdownItem[],
  score: number,
): { breakdown: ScoreBreakdownItem[]; score: number } {
  const adjusted = breakdown.map((item) => ({ ...item }));
  let removedScore = 0;

  for (let i = 0; i < adjusted.length; i += 1) {
    const item = adjusted[i];
    if (divergenceZeroesNews(item) && item.delta !== 0) {
      removedScore += item.delta;
      adjusted[i] = { ...item, delta: 0 };
    }
  }

  const byKey = new Map<string, number[]>();
  adjusted.forEach((item, index) => {
    if (!item.dedupeKey) return;
    const channel = classifyScoreChannel(item.factor);
    if (!isEnrichment(channel)) return;
    const indices = byKey.get(item.dedupeKey) ?? [];
    indices.push(index);
    byKey.set(item.dedupeKey, indices);
  });

  for (const indices of byKey.values()) {
    if (indices.length < 2) continue;

    const competitors = indices.filter((idx) => {
      const ch = classifyScoreChannel(adjusted[idx].factor);
      return ch !== 'CH_TECH';
    });
    if (competitors.length < 2) continue;

    let winnerIdx = competitors[0];
    for (const idx of competitors.slice(1)) {
      if (
        channelPriority(classifyScoreChannel(adjusted[idx].factor)) <
        channelPriority(classifyScoreChannel(adjusted[winnerIdx].factor))
      ) {
        winnerIdx = idx;
      }
    }

    for (const idx of competitors) {
      if (idx === winnerIdx) continue;
      const item = adjusted[idx];
      if (item.delta === 0) continue;
      removedScore += item.delta;
      adjusted[idx] = { ...item, delta: 0 };
    }
  }

  return {
    breakdown: adjusted,
    score: score - removedScore,
  };
}

export type FigureLinkScope = 'macro_only' | 'symbol_direct' | 'topic_conditional';

/** §8.5 / INV-6 — macro_only figures never produce per-symbol score deltas */
export function figureLinkScopeAllowsSymbolDelta(linkScope: FigureLinkScope): boolean {
  return linkScope !== 'macro_only';
}

export { itemKey as scoreBreakdownItemKey };
