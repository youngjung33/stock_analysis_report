import { Market } from '../enums';
import { TAG_LABEL_KO, type QuoteInsightInput, type RecommendationTag } from '../market-sentiment';
import { getStockSectorTags } from './sector-tags';
import { hasRegime } from './regime';
import type {
  EnrichedStockRecommendation,
  MarketContext,
  RecommendationEvidenceItem,
  ScoreBreakdownItem,
} from './types';

type ValidQuote = QuoteInsightInput & { changePercent: number; currentPrice: number };

function isValidQuote(q: QuoteInsightInput): q is ValidQuote {
  return q.changePercent !== null && q.currentPrice !== null;
}

function symbolKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

function pickTagFromScore(scoreByTag: Record<RecommendationTag, number>): RecommendationTag {
  const entries = Object.entries(scoreByTag) as [RecommendationTag, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? 'watchlist';
}

function sectorAlignmentBonus(
  ctx: MarketContext,
  market: Market,
  sectorTags: string[],
): { delta: number; sector?: string } {
  const leading = market === Market.KR ? ctx.leadingKrSectors : ctx.leadingUsSectors;
  if (leading.length === 0 || sectorTags.length === 0) return { delta: 0 };

  for (const label of leading) {
    if (sectorTags.some((t) => label.includes(t) || t.includes(label))) {
      return { delta: 0.25, sector: label };
    }
  }
  return { delta: 0 };
}

function baseTagScores(change: number, ctx: MarketContext, market: Market): Record<RecommendationTag, number> {
  const sentiment = market === Market.KR ? ctx.krSentiment : ctx.usSentiment;
  const isBull = sentiment.label === 'strong_bull' || sentiment.label === 'bull';
  const isBear = sentiment.label === 'bear' || sentiment.label === 'strong_bear';

  const scores: Record<RecommendationTag, number> = {
    momentum: 0,
    watchlist: 0,
    pullback: 0,
    defensive: 0,
  };

  if (isBull) {
    scores.momentum += change > 0 ? change * 0.15 : 0;
    scores.watchlist += change > 0 && change < 1.5 ? 0.3 : 0;
  } else if (isBear) {
    scores.pullback += change < 0 ? Math.abs(change) * 0.12 : 0;
    scores.defensive += change >= -0.3 ? 0.4 : 0;
  } else {
    scores.momentum += change > 0.5 ? change * 0.1 : 0;
    scores.watchlist += Math.abs(change) < 1 ? 0.25 : 0;
  }

  return scores;
}

function applyRegimeAdjustments(
  scores: Record<RecommendationTag, number>,
  ctx: MarketContext,
  market: Market,
  sectorTags: ReturnType<typeof getStockSectorTags>,
): ScoreBreakdownItem[] {
  const breakdown: ScoreBreakdownItem[] = [];

  if (hasRegime(ctx, 'globalRiskOff')) {
    scores.momentum -= 0.4;
    scores.defensive += 0.4;
    breakdown.push({
      factor: 'globalRiskOff',
      delta: -0.4,
      evidenceKey: 'shared.market.recommendation.evidence.globalRiskOff',
    });
  }
  if (hasRegime(ctx, 'globalRiskOn') && market === Market.US) {
    scores.momentum += 0.3;
    breakdown.push({
      factor: 'globalRiskOn',
      delta: 0.3,
      evidenceKey: 'shared.market.recommendation.evidence.globalRiskOn',
    });
  }

  if (market === Market.KR) {
    if (hasRegime(ctx, 'fxKrwWeak') && sectorTags.some((t) => t === 'export' || t === 'semiconductor')) {
      scores.momentum += 0.3;
      breakdown.push({
        factor: 'fxKrwWeak',
        delta: 0.3,
        evidenceKey: 'shared.market.recommendation.evidence.fxKrwWeakExport',
      });
    }
    if (hasRegime(ctx, 'fxKrwStrong') && sectorTags.some((t) => t === 'domestic' || t === 'finance')) {
      scores.defensive += 0.3;
      breakdown.push({
        factor: 'fxKrwStrong',
        delta: 0.3,
        evidenceKey: 'shared.market.recommendation.evidence.fxKrwStrongDomestic',
      });
    }
    if (hasRegime(ctx, 'usLeadingKr')) {
      scores.momentum -= 0.2;
      scores.watchlist += 0.35;
      breakdown.push({
        factor: 'usLeadingKr',
        delta: 0.35,
        evidenceKey: 'shared.market.recommendation.evidence.usLeadingKr',
        evidenceParams: { usAvg: (ctx.usSentiment.avgChangePercent ?? 0).toFixed(2) },
      });
    }
  }

  if (market === Market.US) {
    const vix = ctx.macro.find((m) => m.kind === 'vix');
    if (vix && vix.value >= 20) {
      scores.momentum -= 0.35;
      scores.defensive += 0.35;
      breakdown.push({
        factor: 'vixElevated',
        delta: -0.35,
        evidenceKey: 'shared.market.recommendation.evidence.vixElevated',
        evidenceParams: { vix: vix.value.toFixed(1) },
      });
    }
    const yield10 = ctx.macro.find((m) => m.yahooSymbol === '^TNX');
    if (yield10 && (yield10.changePercent1d ?? 0) > 0.5) {
      scores.momentum -= 0.15;
      scores.defensive += 0.15;
      breakdown.push({
        factor: 'yieldRising',
        delta: -0.15,
        evidenceKey: 'shared.market.recommendation.evidence.yieldRising',
      });
    }
  }

  return breakdown;
}

export function scoreKrCandidate(quote: ValidQuote, ctx: MarketContext): EnrichedStockRecommendation | null {
  if (quote.market !== Market.KR) return null;
  if (ctx.heldSymbols.has(symbolKey(quote.symbol, quote.market))) return null;

  const sectorTags = getStockSectorTags(quote.symbol, quote.market);
  const tagScores = baseTagScores(quote.changePercent, ctx, Market.KR);
  const breakdown: ScoreBreakdownItem[] = [
    {
      factor: 'change1d',
      delta: quote.changePercent * 0.1,
      evidenceKey: 'shared.market.recommendation.evidence.change1d',
      evidenceParams: { change: quote.changePercent.toFixed(2) },
    },
  ];

  breakdown.push(...applyRegimeAdjustments(tagScores, ctx, Market.KR, sectorTags));

  const sectorBonus = sectorAlignmentBonus(ctx, Market.KR, ctx.leadingKrSectors);
  if (sectorBonus.delta > 0) {
    tagScores.momentum += sectorBonus.delta;
    breakdown.push({
      factor: 'sectorAlignment',
      delta: sectorBonus.delta,
      evidenceKey: 'shared.market.recommendation.evidence.sectorAlignment',
      evidenceParams: { sector: sectorBonus.sector ?? '' },
    });
  }

  for (const tag of ctx.preferredTags) {
    tagScores[tag] += 0.2;
    breakdown.push({
      factor: 'investorProfile',
      delta: 0.2,
      evidenceKey: 'shared.market.recommendation.evidence.investorTag',
      evidenceParams: { tag },
    });
  }

  if (ctx.watchlistSymbols.has(symbolKey(quote.symbol, quote.market))) {
    tagScores.watchlist += 0.15;
    breakdown.push({
      factor: 'watchlist',
      delta: 0.15,
      evidenceKey: 'shared.market.recommendation.evidence.userWatchlist',
    });
  }

  const tag = pickTagFromScore(tagScores);
  const score = Object.values(tagScores).reduce((s, v) => s + v, 0) + quote.changePercent * 0.05;
  const topFactors = [...breakdown].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const reasonKey = topFactors[0]?.evidenceKey ?? 'shared.market.recommendation.neutralMomentum';

  const evidenceItems: RecommendationEvidenceItem[] = topFactors.map((f) => ({
    key: f.evidenceKey,
    params: f.evidenceParams,
  }));

  return {
    symbol: quote.symbol,
    name: quote.name,
    market: quote.market,
    currency: quote.currency,
    currentPrice: quote.currentPrice,
    changePercent: quote.changePercent,
    tag,
    tagLabel: TAG_LABEL_KO[tag],
    reason: '',
    reasonKey,
    reasonParams: topFactors[0]?.evidenceParams,
    score,
    scoreBreakdown: breakdown,
    evidenceItems,
    regimeContext: ctx.regimes.map((r) => r.id),
    sectorAlignment: sectorBonus.sector,
  };
}

export function scoreUsCandidate(quote: ValidQuote, ctx: MarketContext): EnrichedStockRecommendation | null {
  if (quote.market !== Market.US) return null;
  if (ctx.heldSymbols.has(symbolKey(quote.symbol, quote.market))) return null;

  const sectorTags = getStockSectorTags(quote.symbol, quote.market);
  const tagScores = baseTagScores(quote.changePercent, ctx, Market.US);
  const breakdown: ScoreBreakdownItem[] = [
    {
      factor: 'change1d',
      delta: quote.changePercent * 0.12,
      evidenceKey: 'shared.market.recommendation.evidence.change1d',
      evidenceParams: { change: quote.changePercent.toFixed(2) },
    },
  ];

  breakdown.push(...applyRegimeAdjustments(tagScores, ctx, Market.US, sectorTags));

  const sectorBonus = sectorAlignmentBonus(ctx, Market.US, ctx.leadingUsSectors);
  if (sectorBonus.delta > 0) {
    tagScores.momentum += sectorBonus.delta;
    breakdown.push({
      factor: 'sectorAlignment',
      delta: sectorBonus.delta,
      evidenceKey: 'shared.market.recommendation.evidence.sectorAlignment',
      evidenceParams: { sector: sectorBonus.sector ?? '' },
    });
  }

  for (const tag of ctx.preferredTags) {
    tagScores[tag] += 0.2;
    breakdown.push({
      factor: 'investorProfile',
      delta: 0.2,
      evidenceKey: 'shared.market.recommendation.evidence.investorTag',
      evidenceParams: { tag },
    });
  }

  if (ctx.watchlistSymbols.has(symbolKey(quote.symbol, quote.market))) {
    tagScores.watchlist += 0.15;
    breakdown.push({
      factor: 'watchlist',
      delta: 0.15,
      evidenceKey: 'shared.market.recommendation.evidence.userWatchlist',
    });
  }

  const tag = pickTagFromScore(tagScores);
  const score = Object.values(tagScores).reduce((s, v) => s + v, 0) + quote.changePercent * 0.06;
  const topFactors = [...breakdown].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const reasonKey = topFactors[0]?.evidenceKey ?? 'shared.market.recommendation.momentumStrong';

  return {
    symbol: quote.symbol,
    name: quote.name,
    market: quote.market,
    currency: quote.currency,
    currentPrice: quote.currentPrice,
    changePercent: quote.changePercent,
    tag,
    tagLabel: TAG_LABEL_KO[tag],
    reason: '',
    reasonKey,
    reasonParams: topFactors[0]?.evidenceParams,
    score,
    scoreBreakdown: breakdown,
    evidenceItems: topFactors.map((f) => ({ key: f.evidenceKey, params: f.evidenceParams })),
    regimeContext: ctx.regimes.map((r) => r.id),
    sectorAlignment: sectorBonus.sector,
  };
}

export function scoreCandidates(
  quotes: QuoteInsightInput[],
  ctx: MarketContext,
): EnrichedStockRecommendation[] {
  const scored: EnrichedStockRecommendation[] = [];

  for (const q of quotes) {
    if (!isValidQuote(q)) continue;
    const fn = q.market === Market.KR ? scoreKrCandidate : scoreUsCandidate;
    const rec = fn(q, ctx);
    if (rec) scored.push(rec);
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export { isValidQuote };
