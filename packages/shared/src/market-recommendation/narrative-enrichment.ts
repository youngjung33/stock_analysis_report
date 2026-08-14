import { Market } from '../enums';
import type { RecommendationTag } from '../market-sentiment';
import type { StockNewsSnapshot } from './news-enrichment';
import type { StockTechnicalSnapshot } from './technical-enrichment';
import type { ScoreBreakdownItem } from './types';
import { technicalSymbolKey } from './technical-enrichment';

export type NarrativeDivergenceKind =
  | 'bullish_news_price_down'
  | 'bearish_news_price_up'
  | 'crowded_bullish'
  | 'crowded_bearish'
  | 'crowded_bullish_chase'
  | 'aligned'
  | 'none';

export interface StockNarrativeSnapshot {
  symbol: string;
  market: Market;
  divergence: NarrativeDivergenceKind;
  /** §8.4 — scales §9.2 CH_NEWS base deltas */
  newsWeightMultiplier: number;
  dedupeKey: string;
}

const CONTRARIAN_CAP = 0.15;

/** §8.4 — news tone vs price·RSI·crowding */
export function computeNarrativeDivergence(input: {
  news: StockNewsSnapshot | null | undefined;
  technical: StockTechnicalSnapshot | null | undefined;
  changePercent1d: number;
}): StockNarrativeSnapshot | null {
  const { news, technical, changePercent1d: ch } = input;
  if (!news || news.relevanceScore < 0.5 || news.tone === 'neutral') return null;

  let divergence: NarrativeDivergenceKind = 'none';
  let newsWeightMultiplier = 1;
  const tone = news.tone;

  if (tone === 'bullish' && ch < -0.3) {
    divergence = 'bullish_news_price_down';
    newsWeightMultiplier = 0;
  } else if (tone === 'bearish' && ch > 0.3) {
    divergence = 'bearish_news_price_up';
    newsWeightMultiplier = 0.5;
  } else if (news.articleCount >= 3 && tone === 'bullish') {
    if (ch > 1.5 && (technical?.rsi14 ?? 0) > 65) {
      divergence = 'crowded_bullish_chase';
      newsWeightMultiplier = 0;
    } else {
      divergence = 'crowded_bullish';
      newsWeightMultiplier = 0.3;
    }
  } else if (news.articleCount >= 3 && tone === 'bearish') {
    divergence = 'crowded_bearish';
    newsWeightMultiplier = 0.3;
  } else if ((tone === 'bullish' && ch > 0.3) || (tone === 'bearish' && ch < -0.3)) {
    divergence = 'aligned';
    newsWeightMultiplier = 0.5;
  }

  return {
    symbol: news.symbol,
    market: news.market,
    divergence,
    newsWeightMultiplier,
    dedupeKey: news.dedupeKey,
  };
}

function narrativeFactor(
  name: string,
  delta: number,
  evidenceKey: string,
  dedupeKey: string,
  params?: Record<string, string | number>,
): ScoreBreakdownItem {
  return {
    factor: `CH_NARRATIVE:${name}`,
    delta,
    evidenceKey,
    dedupeKey,
    evidenceParams: params,
  };
}

function scaleContrarian(items: ScoreBreakdownItem[]): ScoreBreakdownItem[] {
  const totalAbs = items.reduce((s, b) => s + Math.abs(b.delta), 0);
  if (totalAbs <= CONTRARIAN_CAP || totalAbs === 0) return items;
  const scale = CONTRARIAN_CAP / totalAbs;
  return items.map((b) => ({ ...b, delta: b.delta * scale }));
}

/** §9.5 CH_NARRATIVE — contrarian hints when narrative diverges from price (cap ±0.15) */
export function applyNarrativeEnrichment(
  tagScores: Record<RecommendationTag, number>,
  narrative: StockNarrativeSnapshot,
  technical?: StockTechnicalSnapshot | null,
): ScoreBreakdownItem[] {
  const div = narrative.divergence;
  if (div === 'none' || div === 'aligned') return [];

  const params = { divergence: div };
  const key = narrative.dedupeKey;
  let items: ScoreBreakdownItem[] = [];

  if (div === 'bullish_news_price_down' || div === 'crowded_bullish_chase') {
    return [
      narrativeFactor(
        div === 'bullish_news_price_down' ? 'priceDownFlag' : 'crowdedChaseFlag',
        0,
        'shared.market.recommendation.evidence.narrativeDivergence',
        key,
        params,
      ),
    ];
  }

  if (div === 'bearish_news_price_up') {
    if (technical?.rsi14 != null && technical.rsi14 > 70) return [];
    items = [
      narrativeFactor('contrarianBull', 0.08, 'shared.market.recommendation.evidence.narrativeContrarianBull', key, params),
      narrativeFactor('contrarianWatch', 0.05, 'shared.market.recommendation.evidence.narrativeContrarianWatch', key, params),
    ];
  } else if (div === 'crowded_bullish') {
    items = [
      narrativeFactor('crowdedTrim', -0.08, 'shared.market.recommendation.evidence.narrativeCrowdedBull', key, params),
      narrativeFactor('crowdedPullback', 0.07, 'shared.market.recommendation.evidence.narrativeCrowdedBull', key, params),
    ];
  } else if (div === 'crowded_bearish') {
    items = [
      narrativeFactor('crowdedBounce', 0.08, 'shared.market.recommendation.evidence.narrativeCrowdedBear', key, params),
      narrativeFactor('crowdedWatch', 0.05, 'shared.market.recommendation.evidence.narrativeContrarianWatch', key, params),
    ];
  }

  items = scaleContrarian(items);
  for (const item of items) {
    if (item.factor.includes('contrarianBull') || item.factor.includes('crowdedBounce')) {
      tagScores.momentum += item.delta;
    } else if (item.factor.includes('contrarianWatch') || item.factor.includes('crowdedWatch')) {
      tagScores.watchlist += item.delta;
    } else if (item.factor.includes('crowdedTrim')) {
      tagScores.momentum += item.delta;
    } else if (item.factor.includes('crowdedPullback')) {
      tagScores.pullback += item.delta;
    }
  }

  return items;
}

export function indexNarrativeSnapshots(
  snapshots: StockNarrativeSnapshot[],
): Record<string, StockNarrativeSnapshot> {
  const map: Record<string, StockNarrativeSnapshot> = {};
  for (const snap of snapshots) {
    map[technicalSymbolKey(snap.symbol, snap.market)] = snap;
  }
  return map;
}
