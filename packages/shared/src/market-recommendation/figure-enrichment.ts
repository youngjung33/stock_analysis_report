import { Market } from '../enums';
import { newsToneFromTitle, type NewsTone } from '../news-tone';
import type { RecommendationTag } from '../market-sentiment';
import type { MarketContext, ScoreBreakdownItem, StockSectorTag } from './types';
import {
  findFigureInHeadline,
  headlineMatchesTopic,
  type FigureLinkScope,
  type FigureRegistryEntry,
} from './figure-registry';
import { figureLinkScopeAllowsSymbolDelta } from './score-dedupe';

export type FigureStatementSourceChannel = 'rss' | 'sns';

export interface FigureStatementArticleInput {
  title: string;
  publishedAt: string;
  source?: string;
  sourceChannel?: FigureStatementSourceChannel;
}

export interface FigureStatementSnapshot {
  figureId: string;
  figureName: string;
  impactTier: 1 | 2 | 3;
  linkScope: FigureLinkScope;
  tone: NewsTone;
  headline: string;
  publishedAt: string;
  dedupeKey: string;
  sourceChannel: FigureStatementSourceChannel;
  primarySymbols: string[];
  sectorTags: StockSectorTag[];
  topicTags: string[];
}

const STATEMENT_WINDOW_MS = 72 * 60 * 60 * 1000;

/** Matches FetchRecommendationFigureStatementsUseCase RSS(15) + SNS(10) merge cap */
export const FIGURE_RSS_FETCH_LIMIT = 15;
export const FIGURE_SNS_FETCH_LIMIT = 10;
export const FIGURE_STATEMENT_ARTICLE_SCAN_LIMIT =
  FIGURE_RSS_FETCH_LIMIT + FIGURE_SNS_FETCH_LIMIT;

function simpleHeadlineKey(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function figureHeadlineDedupeKey(title: string, figureId?: string): string {
  const key = simpleHeadlineKey(title);
  return figureId ? `figure:${figureId}:${key}` : key;
}

/** Merge RSS (primary) + SNS (secondary); RSS wins on duplicate headlines */
export function mergeFigureStatementArticles(
  primary: FigureStatementArticleInput[],
  secondary: FigureStatementArticleInput[],
): FigureStatementArticleInput[] {
  const seen = new Set<string>();
  const merged: FigureStatementArticleInput[] = [];

  for (const article of primary) {
    const key = figureHeadlineDedupeKey(article.title);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...article, sourceChannel: article.sourceChannel ?? 'rss' });
  }

  for (const article of secondary) {
    const key = figureHeadlineDedupeKey(article.title);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...article, sourceChannel: article.sourceChannel ?? 'sns' });
  }

  return merged;
}

function snapshotFromArticle(
  article: FigureStatementArticleInput,
  entry: FigureRegistryEntry,
): FigureStatementSnapshot | null {
  const ts = new Date(article.publishedAt).getTime();
  if (!Number.isFinite(ts) || Date.now() - ts > STATEMENT_WINDOW_MS) return null;

  if (entry.linkScope === 'topic_conditional' && entry.topicTags?.length) {
    if (!headlineMatchesTopic(article.title, entry.topicTags)) return null;
  }

  return {
    figureId: entry.id,
    figureName: entry.displayName,
    impactTier: entry.impactTier,
    linkScope: entry.linkScope,
    tone: newsToneFromTitle(article.title),
    headline: article.title,
    publishedAt: article.publishedAt,
    dedupeKey: figureHeadlineDedupeKey(article.title, entry.id),
    sourceChannel: article.sourceChannel ?? 'rss',
    primarySymbols: (entry.primarySymbols ?? []).map((s) => s.toUpperCase()),
    sectorTags: entry.sectorTags ?? [],
    topicTags: entry.topicTags ?? [],
  };
}

/** §8.5 — scan headlines for registry figure attribution */
export function buildFigureStatementSnapshots(
  articles: FigureStatementArticleInput[],
): FigureStatementSnapshot[] {
  const snapshots: FigureStatementSnapshot[] = [];
  const seen = new Set<string>();

  for (const article of articles.slice(0, FIGURE_STATEMENT_ARTICLE_SCAN_LIMIT)) {
    const entry = findFigureInHeadline(article.title);
    if (!entry) continue;

    const snap = snapshotFromArticle(article, entry);
    if (!snap || seen.has(snap.dedupeKey)) continue;
    seen.add(snap.dedupeKey);
    snapshots.push(snap);
  }

  return snapshots;
}

function figureFactor(
  channel: 'CH_FIGURE_DIRECT' | 'CH_FIGURE_SECTOR',
  name: string,
  delta: number,
  evidenceKey: string,
  dedupeKey: string,
  params?: Record<string, string | number>,
): ScoreBreakdownItem {
  return {
    factor: `${channel}:${name}`,
    delta,
    evidenceKey,
    dedupeKey,
    evidenceParams: params,
  };
}

function symbolMatches(snapshot: FigureStatementSnapshot, symbol: string, market: Market): boolean {
  const sym = symbol.toUpperCase();
  if (snapshot.linkScope === 'symbol_direct') {
    return snapshot.primarySymbols.includes(sym) && (market === Market.US || market === Market.KR);
  }
  return true;
}

function sectorMatches(snapshot: FigureStatementSnapshot, sectorTags: StockSectorTag[]): boolean {
  if (snapshot.linkScope !== 'topic_conditional') return true;
  if (snapshot.sectorTags.length === 0) return false;
  return snapshot.sectorTags.some((t) => sectorTags.includes(t));
}

/** §9.6 — per-candidate figure enrichment (macro_only skipped at symbol level) */
export function applyFigureEnrichment(
  tagScores: Record<RecommendationTag, number>,
  snapshot: FigureStatementSnapshot,
  symbol: string,
  market: Market,
  sectorTags: StockSectorTag[],
): ScoreBreakdownItem[] {
  if (!figureLinkScopeAllowsSymbolDelta(snapshot.linkScope)) return [];
  if (snapshot.tone === 'neutral') return [];
  if (!symbolMatches(snapshot, symbol, market)) return [];
  if (!sectorMatches(snapshot, sectorTags)) return [];

  const params = {
    figure: snapshot.figureName,
    headline: snapshot.headline.slice(0, 120),
  };
  const key = snapshot.dedupeKey;
  const breakdown: ScoreBreakdownItem[] = [];

  if (snapshot.linkScope === 'symbol_direct' && snapshot.impactTier === 3) {
    if (snapshot.tone === 'bullish') {
      const mom = 0.25;
      tagScores.momentum += mom;
      breakdown.push(
        figureFactor('CH_FIGURE_DIRECT', 'ceoBullish', mom, 'shared.market.recommendation.evidence.figureBullishDirect', key, params),
      );
    } else {
      const mom = -0.25;
      const pull = 0.15;
      tagScores.momentum += mom;
      tagScores.pullback += pull;
      breakdown.push(
        figureFactor('CH_FIGURE_DIRECT', 'ceoBearishMom', mom, 'shared.market.recommendation.evidence.figureBearishDirect', key, params),
        figureFactor('CH_FIGURE_DIRECT', 'ceoBearishPull', pull, 'shared.market.recommendation.evidence.figureBearishDirect', key, params),
      );
    }
    return breakdown;
  }

  if (snapshot.linkScope === 'topic_conditional' && snapshot.impactTier === 2) {
    const delta = snapshot.tone === 'bullish' ? 0.15 : -0.15;
    if (snapshot.tone === 'bullish') {
      tagScores.momentum += delta;
    } else {
      tagScores.momentum += delta;
      tagScores.defensive += 0.1;
    }
    breakdown.push(
      figureFactor(
        'CH_FIGURE_SECTOR',
        snapshot.tone === 'bullish' ? 'policySectorBull' : 'policySectorBear',
        delta,
        snapshot.tone === 'bullish'
          ? 'shared.market.recommendation.evidence.figureSectorBullish'
          : 'shared.market.recommendation.evidence.figureSectorBearish',
        key,
        params,
      ),
    );
  }

  return breakdown;
}

/** Apply all recent figure statements relevant to a candidate symbol */
export function applyFigureEnrichmentsForCandidate(
  tagScores: Record<RecommendationTag, number>,
  ctx: MarketContext,
  symbol: string,
  market: Market,
  sectorTags: StockSectorTag[],
): ScoreBreakdownItem[] {
  const breakdown: ScoreBreakdownItem[] = [];
  for (const snap of ctx.figureStatements ?? []) {
    breakdown.push(...applyFigureEnrichment(tagScores, snap, symbol, market, sectorTags));
  }
  return breakdown;
}

export function collectMacroFigureIds(statements: FigureStatementSnapshot[]): string[] {
  return [...new Set(statements.filter((s) => s.linkScope === 'macro_only').map((s) => s.figureId))];
}

/** Tier-1 macro figure activity in last 72h — deploy/regime hint (T4, no symbol delta) */
export function hasPolicyUncertaintyPulse(statements: FigureStatementSnapshot[]): boolean {
  return statements.some(
    (s) => s.linkScope === 'macro_only' && s.impactTier === 1 && s.tone === 'bearish',
  );
}
