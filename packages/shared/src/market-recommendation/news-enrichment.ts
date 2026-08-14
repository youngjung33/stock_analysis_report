import { Market } from '../enums';
import { newsToneFromTitle, type NewsTone } from '../news-tone';
import type { RecommendationTag } from '../market-sentiment';
import type { ScoreBreakdownItem } from './types';
import { technicalSymbolKey } from './technical-enrichment';
import type { StockNarrativeSnapshot } from './narrative-enrichment';

export interface StockNewsArticleInput {
  title: string;
  publishedAt: string;
  source?: string;
}

export interface StockNewsSnapshot {
  symbol: string;
  market: Market;
  tone: NewsTone;
  relevanceScore: number;
  articleCount: number;
  headlineSample: string;
  primarySourceCount: number;
  secondarySourceCount: number;
  dedupeKey: string;
}

const PRIMARY_HEADLINE = /earnings|eps|실적|분기|배당|dividend|buyback|자사주|주주환원/i;
const NEWS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ARTICLES = 5;

function titleMatchesSymbol(title: string, symbol: string, name: string): boolean {
  const lower = title.toLowerCase();
  if (lower.includes(symbol.toLowerCase())) return true;
  if (name.trim().length >= 2 && title.includes(name)) return true;
  return false;
}

function isPrimaryHeadline(title: string): boolean {
  return PRIMARY_HEADLINE.test(title);
}

function aggregateTone(tones: NewsTone[]): NewsTone {
  let bull = 0;
  let bear = 0;
  for (const t of tones) {
    if (t === 'bullish') bull += 1;
    if (t === 'bearish') bear += 1;
  }
  if (bull > bear) return 'bullish';
  if (bear > bull) return 'bearish';
  return 'neutral';
}

function simpleHeadlineKey(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** §8.2 — aggregate per-symbol news snapshot */
export function buildStockNewsSnapshot(input: {
  symbol: string;
  market: Market;
  name: string;
  articles: StockNewsArticleInput[];
}): StockNewsSnapshot | null {
  const cutoff = Date.now() - NEWS_WINDOW_MS;
  const recent = input.articles
    .filter((a) => {
      const ts = new Date(a.publishedAt).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    })
    .slice(0, MAX_ARTICLES);

  if (recent.length === 0) return null;

  let relevanceScore = 0;
  let primarySourceCount = 0;
  let secondarySourceCount = 0;
  const tones: NewsTone[] = [];

  for (const article of recent) {
    if (titleMatchesSymbol(article.title, input.symbol, input.name)) {
      relevanceScore = Math.max(relevanceScore, 0.5);
    }
    tones.push(newsToneFromTitle(article.title));
    if (isPrimaryHeadline(article.title)) {
      primarySourceCount += 1;
    } else {
      secondarySourceCount += 1;
    }
  }

  const tone = aggregateTone(tones);
  const headlineSample = recent[0]?.title ?? '';

  return {
    symbol: input.symbol,
    market: input.market,
    tone,
    relevanceScore,
    articleCount: recent.length,
    headlineSample,
    primarySourceCount,
    secondarySourceCount,
    dedupeKey: `news:${input.symbol}:${simpleHeadlineKey(headlineSample)}`,
  };
}

function newsFactor(
  name: string,
  delta: number,
  evidenceKey: string,
  dedupeKey: string,
  params?: Record<string, string | number>,
): ScoreBreakdownItem {
  return {
    factor: `CH_NEWS:${name}`,
    delta,
    evidenceKey,
    dedupeKey,
    evidenceParams: params,
  };
}

/** §9.2 CH_NEWS — relevance ≥ 0.5, T3 caps apply via pipeline */
export function applyNewsEnrichment(
  tagScores: Record<RecommendationTag, number>,
  snapshot: StockNewsSnapshot,
  changePercent1d: number,
  narrative?: StockNarrativeSnapshot | null,
): ScoreBreakdownItem[] {
  if (snapshot.relevanceScore < 0.5) return [];
  if (snapshot.tone === 'neutral') return [];

  // 1차 공시성 헤드라인 우세 → event 모듈(I) 위임 (Phase H: news skip)
  if (snapshot.primarySourceCount > 0 && snapshot.secondarySourceCount <= snapshot.primarySourceCount) {
    return [];
  }

  let multiplier = narrative?.newsWeightMultiplier ?? 1;
  if (snapshot.secondarySourceCount > snapshot.primarySourceCount) {
    multiplier *= 0.7;
  }
  if (snapshot.articleCount >= 3 && (narrative?.divergence !== 'crowded_bullish' && narrative?.divergence !== 'crowded_bearish')) {
    multiplier *= 0.5;
  }

  const breakdown: ScoreBreakdownItem[] = [];
  const headlineParam = { headline: snapshot.headlineSample.slice(0, 120) };
  const div = narrative?.divergence;

  if (snapshot.tone === 'bullish') {
    if (div === 'bullish_news_price_down' || (changePercent1d < -0.3 && !narrative)) {
      return [
        newsFactor(
          'bullishHeadlines',
          0,
          'shared.market.recommendation.evidence.newsBullish',
          snapshot.dedupeKey,
          { ...headlineParam, divergence: 'bullish_news_price_down' },
        ),
      ];
    }
    if (multiplier === 0) return [];
    const mom = 0.1 * multiplier;
    const watch = 0.05 * multiplier;
    tagScores.momentum += mom;
    tagScores.watchlist += watch;
    breakdown.push(
      newsFactor('bullishMomentum', mom, 'shared.market.recommendation.evidence.newsBullish', snapshot.dedupeKey, headlineParam),
      newsFactor('bullishWatch', watch, 'shared.market.recommendation.evidence.newsBullishWatch', snapshot.dedupeKey, headlineParam),
    );
  } else if (snapshot.tone === 'bearish') {
    if (multiplier === 0) return [];
    const pull = 0.1 * multiplier;
    const mom = -0.1 * multiplier;
    tagScores.pullback += pull;
    tagScores.momentum += mom;
    breakdown.push(
      newsFactor('bearishPullback', pull, 'shared.market.recommendation.evidence.newsBearish', snapshot.dedupeKey, headlineParam),
      newsFactor('bearishMomentum', mom, 'shared.market.recommendation.evidence.newsBearish', snapshot.dedupeKey, headlineParam),
    );
  }

  return breakdown;
}

export function indexNewsSnapshots(snapshots: StockNewsSnapshot[]): Record<string, StockNewsSnapshot> {
  const map: Record<string, StockNewsSnapshot> = {};
  for (const snap of snapshots) {
    map[technicalSymbolKey(snap.symbol, snap.market)] = snap;
  }
  return map;
}

export { technicalSymbolKey as newsSymbolKey };
