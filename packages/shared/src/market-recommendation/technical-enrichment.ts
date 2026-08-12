import { Market } from '../enums';
import { changePercentOverBars, rsi, sma } from '../technical-analysis';
import type { RecommendationTag } from '../market-sentiment';
import { hasRegime } from './regime';
import type { MarketContext, ScoreBreakdownItem } from './types';

export interface StockTechnicalChartInput {
  symbol: string;
  market: Market;
  closes: number[];
  highs: number[];
  lows: number[];
}

export interface StockTechnicalSnapshot {
  symbol: string;
  market: Market;
  trendKey: string;
  rsi14: number | null;
  rsVsBenchmark1w: number | null;
  aboveSma20: boolean;
  aboveSma200: boolean;
}

const TREND_SHORT_UP = 'shared.market.trends.shortTermUp';
const TREND_MID_UP = 'shared.market.trends.midTermUp';
const TREND_PULLBACK = 'shared.market.trends.shortTermPullback';
const TREND_LONG_DOWN = 'shared.market.trends.longTermDown';

export function technicalSymbolKey(symbol: string, market: Market): string {
  return `${market}:${symbol.toUpperCase()}`;
}

function deriveTrendKey(closes: number[], currentPrice: number): string {
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);

  if (sma20 !== null && sma50 !== null && currentPrice > sma20 && sma20 > sma50) {
    return TREND_SHORT_UP;
  }
  if (sma50 !== null && sma200 !== null && currentPrice > sma50 && sma50 > sma200) {
    return TREND_MID_UP;
  }
  if (sma20 !== null && currentPrice < sma20) {
    return TREND_PULLBACK;
  }
  if (sma200 !== null && currentPrice < sma200) {
    return TREND_LONG_DOWN;
  }
  return 'shared.market.trends.mixed';
}

/** §8.1 — build per-symbol technical snapshot from chart series */
export function buildStockTechnicalSnapshot(
  input: StockTechnicalChartInput,
  benchmark1wChange: number | null,
): StockTechnicalSnapshot | null {
  const { closes } = input;
  if (closes.length < 2) return null;

  const currentPrice = closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma200 = sma(closes, 200);
  const rsi14 = rsi(closes);
  const stock1w = changePercentOverBars(closes, 5);
  const rsVsBenchmark1w =
    stock1w != null && benchmark1wChange != null ? stock1w - benchmark1wChange : null;

  return {
    symbol: input.symbol,
    market: input.market,
    trendKey: deriveTrendKey(closes, currentPrice),
    rsi14,
    rsVsBenchmark1w,
    aboveSma20: sma20 != null && currentPrice > sma20,
    aboveSma200: sma200 != null && currentPrice > sma200,
  };
}

function techFactor(name: string, delta: number, evidenceKey: string, params?: Record<string, string | number>): ScoreBreakdownItem {
  return {
    factor: `CH_TECH:${name}`,
    delta,
    evidenceKey,
    evidenceParams: params,
  };
}

/** §9.1 CH_TECH deltas — mutates tagScores, returns breakdown rows */
export function applyTechnicalEnrichment(
  tagScores: Record<RecommendationTag, number>,
  snapshot: StockTechnicalSnapshot,
  ctx: MarketContext,
  market: Market,
): ScoreBreakdownItem[] {
  const breakdown: ScoreBreakdownItem[] = [];
  const sentiment = market === Market.KR ? ctx.krSentiment : ctx.usSentiment;
  const isBull = sentiment.label === 'strong_bull' || sentiment.label === 'bull';
  const isBear = sentiment.label === 'bear' || sentiment.label === 'strong_bear';

  if (snapshot.trendKey === TREND_SHORT_UP || snapshot.trendKey === TREND_MID_UP) {
    const delta = snapshot.trendKey === TREND_MID_UP ? 0.35 : 0.28;
    tagScores.momentum += delta;
    breakdown.push(
      techFactor('trendUp', delta, 'shared.market.recommendation.evidence.trendUp', {
        trend: snapshot.trendKey,
      }),
    );
  } else if (snapshot.trendKey === TREND_PULLBACK) {
    tagScores.pullback += 0.2;
    tagScores.momentum -= 0.15;
    breakdown.push(
      techFactor('trendPullback', 0.2, 'shared.market.recommendation.evidence.trendPullback'),
      techFactor('trendPullbackMom', -0.15, 'shared.market.recommendation.evidence.trendPullback'),
    );
  } else if (snapshot.trendKey === TREND_LONG_DOWN) {
    tagScores.defensive += 0.25;
    breakdown.push(
      techFactor('trendDown', 0.25, 'shared.market.recommendation.evidence.trendDown'),
    );
  }

  if (snapshot.rsi14 != null && snapshot.rsi14 < 30) {
    tagScores.pullback += 0.15;
    breakdown.push(
      techFactor('rsiOversold', 0.15, 'shared.market.recommendation.evidence.rsiOversold', {
        rsi: snapshot.rsi14.toFixed(1),
      }),
    );
  }

  if (snapshot.rsi14 != null && snapshot.rsi14 > 70) {
    if (isBear) {
      tagScores.momentum -= 0.15;
      breakdown.push(
        techFactor('rsiOverbought', -0.15, 'shared.market.recommendation.evidence.rsiOverbought', {
          rsi: snapshot.rsi14.toFixed(1),
        }),
      );
    } else if (isBull) {
      tagScores.watchlist += 0.15;
      breakdown.push(
        techFactor('rsiOverbought', 0.15, 'shared.market.recommendation.evidence.rsiOverbought', {
          rsi: snapshot.rsi14.toFixed(1),
        }),
      );
    }
    if (hasRegime(ctx, 'globalRiskOff')) {
      tagScores.momentum -= 0.1;
      breakdown.push(
        techFactor('riskOffOverbought', -0.1, 'shared.market.recommendation.evidence.riskOffOverbought', {
          rsi: snapshot.rsi14.toFixed(1),
        }),
      );
    }
  }

  if (snapshot.rsVsBenchmark1w != null && snapshot.rsVsBenchmark1w > 2) {
    tagScores.momentum += 0.2;
    breakdown.push(
      techFactor('rsOutperform', 0.2, 'shared.market.recommendation.evidence.rsOutperform', {
        rs: snapshot.rsVsBenchmark1w.toFixed(2),
      }),
    );
    if (market === Market.KR && hasRegime(ctx, 'usLeadingKr') && snapshot.rsVsBenchmark1w > 0) {
      tagScores.watchlist += 0.1;
      breakdown.push(
        techFactor('usLeadingCatchUp', 0.1, 'shared.market.recommendation.evidence.usLeadingCatchUp'),
      );
    }
  } else if (snapshot.rsVsBenchmark1w != null && snapshot.rsVsBenchmark1w < -2) {
    const delta = 0.15;
    if (isBull) {
      tagScores.pullback += delta;
    } else {
      tagScores.defensive += delta;
    }
    breakdown.push(
      techFactor('rsUnderperform', delta, 'shared.market.recommendation.evidence.rsUnderperform', {
        rs: snapshot.rsVsBenchmark1w.toFixed(2),
      }),
    );
  }

  return breakdown;
}

export function indexTechnicalSnapshots(
  snapshots: StockTechnicalSnapshot[],
): Record<string, StockTechnicalSnapshot> {
  const map: Record<string, StockTechnicalSnapshot> = {};
  for (const snap of snapshots) {
    map[technicalSymbolKey(snap.symbol, snap.market)] = snap;
  }
  return map;
}
