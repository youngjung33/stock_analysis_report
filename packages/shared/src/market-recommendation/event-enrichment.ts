import { Market } from '../enums';
import type { RecommendationTag } from '../market-sentiment';
import type { ScoreBreakdownItem } from './types';
import { technicalSymbolKey } from './technical-enrichment';

export type StockEventKind =
  | 'earnings_beat'
  | 'earnings_miss'
  | 'earnings_neutral'
  | 'earnings_upcoming'
  | 'dividend'
  | 'buyback';

export type StockEventDay = 'D-1' | 'D0' | 'D+1';

export interface StockEventEarningsInput {
  period: string;
  reportDate: string;
  actual?: number | null;
  estimate?: number | null;
  surprisePercent?: number | null;
}

export interface StockEventSnapshot {
  symbol: string;
  market: Market;
  kind: StockEventKind;
  eventDay: StockEventDay;
  dedupeKey: string;
  surprisePercent?: number | null;
  headlineSample?: string;
}

const MS_DAY = 24 * 60 * 60 * 1000;

function eventDayOffset(reportDate: string, now = Date.now()): StockEventDay | null {
  const target = new Date(reportDate).setHours(0, 0, 0, 0);
  if (!Number.isFinite(target)) return null;
  const today = new Date(now).setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / MS_DAY);
  if (diffDays === -1) return 'D-1';
  if (diffDays === 0) return 'D0';
  if (diffDays === 1) return 'D+1';
  return null;
}

function classifyEarnings(input: StockEventEarningsInput): StockEventKind {
  if (input.actual == null || input.estimate == null) return 'earnings_upcoming';
  const surprise = input.surprisePercent ?? ((input.actual - input.estimate) / Math.abs(input.estimate || 1)) * 100;
  if (surprise > 2) return 'earnings_beat';
  if (surprise < -2) return 'earnings_miss';
  return 'earnings_neutral';
}

/** §8.3 — US Finnhub earnings row → event snapshot (D-1~D+1 window) */
export function buildStockEventSnapshot(input: {
  symbol: string;
  market: Market;
  earnings: StockEventEarningsInput[];
  now?: number;
}): StockEventSnapshot | null {
  if (input.market !== Market.US || input.earnings.length === 0) return null;

  for (const row of input.earnings) {
    const day = eventDayOffset(row.reportDate, input.now);
    if (!day) continue;

    const kind = classifyEarnings(row);
    const dedupeKey = `earnings:${input.symbol.toUpperCase()}:${row.period}`;

    return {
      symbol: input.symbol,
      market: input.market,
      kind,
      eventDay: day,
      dedupeKey,
      surprisePercent: row.surprisePercent ?? null,
    };
  }

  return null;
}

/** Build event from primary headline keywords when earnings API unavailable (KR fallback) */
export function buildStockEventFromHeadline(input: {
  symbol: string;
  market: Market;
  headline: string;
}): StockEventSnapshot | null {
  const h = input.headline;
  let kind: StockEventKind | null = null;
  if (/dividend|배당/i.test(h)) kind = 'dividend';
  else if (/buyback|자사주|주주환원/i.test(h)) kind = 'buyback';
  else if (/beats|surprise|실적.*상회|어닝.*서프/i.test(h)) kind = 'earnings_beat';
  else if (/miss|실적.*부진|어닝.*쇼크/i.test(h)) kind = 'earnings_miss';
  else if (/earnings|실적|분기/i.test(h)) kind = 'earnings_neutral';
  if (!kind) return null;

  return {
    symbol: input.symbol,
    market: input.market,
    kind,
    eventDay: 'D0',
    dedupeKey: `headline:${input.symbol.toUpperCase()}:${kind}`,
    headlineSample: h.slice(0, 120),
  };
}

function eventFactor(
  name: string,
  delta: number,
  evidenceKey: string,
  dedupeKey: string,
  params?: Record<string, string | number>,
): ScoreBreakdownItem {
  return {
    factor: `CH_EVENT:${name}`,
    delta,
    evidenceKey,
    dedupeKey,
    evidenceParams: params,
  };
}

/** §9.3 CH_EVENT — earnings / capital return (T2) */
export function applyEventEnrichment(
  tagScores: Record<RecommendationTag, number>,
  snapshot: StockEventSnapshot,
): ScoreBreakdownItem[] {
  const breakdown: ScoreBreakdownItem[] = [];
  const params: Record<string, string | number> = {
    eventDay: snapshot.eventDay,
    kind: snapshot.kind,
  };
  if (snapshot.surprisePercent != null) {
    params.surprise = snapshot.surprisePercent.toFixed(1);
  }

  const key = snapshot.dedupeKey;

  switch (snapshot.kind) {
    case 'earnings_beat':
      if (snapshot.eventDay === 'D0' || snapshot.eventDay === 'D+1') {
        const mom = 0.15;
        tagScores.momentum += mom;
        breakdown.push(
          eventFactor('earningsBeat', mom, 'shared.market.recommendation.evidence.eventEarningsBeat', key, params),
        );
      }
      break;
    case 'earnings_miss':
      if (snapshot.eventDay === 'D0' || snapshot.eventDay === 'D+1') {
        const mom = -0.15;
        const pull = 0.15;
        tagScores.momentum += mom;
        tagScores.pullback += pull;
        breakdown.push(
          eventFactor('earningsMissMom', mom, 'shared.market.recommendation.evidence.eventEarningsMiss', key, params),
          eventFactor('earningsMissPull', pull, 'shared.market.recommendation.evidence.eventEarningsMiss', key, params),
        );
      }
      break;
    case 'earnings_upcoming':
      if (snapshot.eventDay === 'D-1') {
        const watch = 0.1;
        tagScores.watchlist += watch;
        breakdown.push(
          eventFactor('earningsUpcoming', watch, 'shared.market.recommendation.evidence.eventEarningsUpcoming', key, params),
        );
      }
      break;
    case 'earnings_neutral':
      if (snapshot.eventDay === 'D0') {
        const watch = 0.05;
        tagScores.watchlist += watch;
        breakdown.push(
          eventFactor('earningsNeutral', watch, 'shared.market.recommendation.evidence.eventEarningsNeutral', key, params),
        );
      }
      break;
    case 'dividend':
    case 'buyback': {
      const def = 0.1;
      tagScores.defensive += def;
      breakdown.push(
        eventFactor(
          snapshot.kind,
          def,
          snapshot.kind === 'dividend'
            ? 'shared.market.recommendation.evidence.eventDividend'
            : 'shared.market.recommendation.evidence.eventBuyback',
          key,
          params,
        ),
      );
      break;
    }
    default:
      break;
  }

  return breakdown;
}

export function indexEventSnapshots(snapshots: StockEventSnapshot[]): Record<string, StockEventSnapshot> {
  const map: Record<string, StockEventSnapshot> = {};
  for (const snap of snapshots) {
    map[technicalSymbolKey(snap.symbol, snap.market)] = snap;
  }
  return map;
}
