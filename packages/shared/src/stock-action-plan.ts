import type { NarrativeDivergenceKind } from './market-recommendation/narrative-enrichment';
import type { StockEventSnapshot } from './market-recommendation/event-enrichment';
import type { StockTechnicalSnapshot } from './market-recommendation/technical-enrichment';
import type { EnrichedStockRecommendation } from './market-recommendation/types';

/**
 * 종목 참고 의견 — 일관·보수적 규칙表
 *
 * 원칙:
 * 1. 가격대는 **최근 42거래일(≈2개월)** 만 사용 (6개월·1년 고/저점 제외)
 * 2. 매수 참고 = 현재가 **2~7% 아래** 또는 20·50일선 중 더 가까운 지지
 * 3. 매도 참고 = 현재가 **4~10% 위** 또는 최근 고점·저항 중 더 가까운 수준
 * 4. 스탠스는 아래 우선순위 **첫 번째 충족 규칙** (같은 입력 → 같은 출력)
 * 5. 기본값 = **watch** (보수적)
 */
export const STOCK_ACTION_RULES = {
  recentBars: 42,
  buyDipMinPct: 0.02,
  buyDipMaxPct: 0.07,
  buyDipDefaultPct: 0.05,
  sellGainMinPct: 0.04,
  sellGainMaxPct: 0.1,
  rsiOverbought: 70,
  rsiVeryOverbought: 75,
  rsiOversold: 35,
  recentRangeExtended: 80,
  recentRangeTakeProfit: 70,
  rsiTakeProfit: 55,
} as const;

export type StockActionStance = 'avoid' | 'watch' | 'dip_buy' | 'take_profit';

export type StockActionRuleId =
  | 'earnings_watch'
  | 'narrative_avoid'
  | 'overextended_avoid'
  | 'weak_below_200_watch'
  | 'dip_zone'
  | 'extended_take_profit'
  | 'uptrend_dip_buy'
  | 'default_watch';

export interface StockActionChartInput {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  recentRangeLow: number | null;
  recentRangeHigh: number | null;
  recentRangePct: number | null;
}

export interface StockActionPlan {
  stance: StockActionStance;
  ruleId: StockActionRuleId;
  buyBelow: number;
  sellAbove: number;
  rationale: {
    rsi: number;
    recentRangePct: number;
    trend: string;
  };
}

function trendPlain(trendKey: string): string {
  if (trendKey.includes('shortTermUp') || trendKey.includes('midTermUp')) return 'up';
  if (trendKey.includes('Pullback')) return 'pullback';
  if (trendKey.includes('longTermDown') || trendKey.includes('Down')) return 'down';
  return 'mixed';
}

function priceStep(price: number, currency: string): number {
  if (currency === 'KRW') {
    if (price >= 500_000) return 5_000;
    if (price >= 100_000) return 1_000;
    if (price >= 10_000) return 100;
    if (price >= 1_000) return 10;
    return 1;
  }
  if (price >= 500) return 5;
  if (price >= 100) return 1;
  if (price >= 10) return 0.5;
  return 0.01;
}

export function roundActionPrice(
  price: number,
  currency: string,
  direction: 'down' | 'up',
): number {
  const step = priceStep(price, currency);
  return direction === 'down'
    ? Math.floor(price / step) * step
    : Math.ceil(price / step) * step;
}

/** 규칙 2: 보수적 매수 참고가 — 가장 가까운 지지(2~7% 이내) */
export function deriveConservativeBuyBelow(
  price: number,
  chart: StockActionChartInput,
  currency: string,
): number {
  const { buyDipMinPct, buyDipMaxPct, buyDipDefaultPct } = STOCK_ACTION_RULES;
  const floor = price * (1 - buyDipMaxPct);
  const ceiling = price * (1 - buyDipMinPct);
  const candidates: number[] = [];

  for (const level of [chart.sma20, chart.sma50, chart.recentRangeLow]) {
    if (level != null && level >= floor && level < ceiling) {
      candidates.push(level);
    }
  }

  const raw =
    candidates.length > 0 ? Math.max(...candidates) : price * (1 - buyDipDefaultPct);
  const clamped = Math.min(Math.max(raw, floor), ceiling);
  return roundActionPrice(clamped, currency, 'down');
}

/** 규칙 3: 보수적 매도 참고가 — 가장 가까운 저항(4~10% 이내) */
export function deriveConservativeSellAbove(
  price: number,
  chart: StockActionChartInput,
  currency: string,
): number {
  const { sellGainMinPct, sellGainMaxPct } = STOCK_ACTION_RULES;
  const floor = price * (1 + sellGainMinPct);
  const ceiling = price * (1 + sellGainMaxPct);
  const candidates: number[] = [];

  for (const level of [chart.recentRangeHigh, chart.sma20, chart.sma50]) {
    if (level != null && level > price && level <= ceiling) {
      candidates.push(level);
    }
  }

  const raw = candidates.length > 0 ? Math.min(...candidates) : price * (1 + sellGainMinPct);
  const clamped = Math.min(Math.max(raw, floor), ceiling);
  return roundActionPrice(clamped, currency, 'up');
}

export function computeStockActionPlan(input: {
  price: number;
  currency: string;
  chart: StockActionChartInput;
  technical: StockTechnicalSnapshot | null;
  event: StockEventSnapshot | null;
  tag: EnrichedStockRecommendation['tag'];
  divergence: NarrativeDivergenceKind | null;
}): StockActionPlan {
  const { price, currency, chart, technical, event, tag, divergence } = input;
  const R = STOCK_ACTION_RULES;
  const rsi = technical?.rsi14 ?? chart.rsi14 ?? 50;
  const recentRangePct = chart.recentRangePct ?? 50;
  const trend = trendPlain(technical?.trendKey ?? 'mixed');

  const buyBelow = deriveConservativeBuyBelow(price, chart, currency);
  const sellAbove = deriveConservativeSellAbove(price, chart, currency);

  let stance: StockActionStance = 'watch';
  let ruleId: StockActionRuleId = 'default_watch';

  if (event?.kind === 'earnings_upcoming') {
    stance = 'watch';
    ruleId = 'earnings_watch';
  } else if (divergence === 'bullish_news_price_down' || divergence === 'crowded_bullish_chase') {
    stance = 'avoid';
    ruleId = 'narrative_avoid';
  } else if (
    rsi >= R.rsiVeryOverbought ||
    (rsi >= R.rsiOverbought && recentRangePct >= R.recentRangeExtended)
  ) {
    stance = 'avoid';
    ruleId = 'overextended_avoid';
  } else if (
    chart.sma200 != null &&
    price < chart.sma200 &&
    trend === 'down' &&
    rsi < 45
  ) {
    stance = 'watch';
    ruleId = 'weak_below_200_watch';
  } else if (
    rsi <= R.rsiOversold ||
    trend === 'pullback' ||
    tag === 'pullback' ||
    (chart.sma200 != null &&
      price >= chart.sma200 &&
      chart.sma20 != null &&
      price < chart.sma20)
  ) {
    stance = 'dip_buy';
    ruleId = 'dip_zone';
  } else if (
    trend === 'up' &&
    recentRangePct >= R.recentRangeTakeProfit &&
    rsi >= R.rsiTakeProfit
  ) {
    stance = 'take_profit';
    ruleId = 'extended_take_profit';
  } else if (trend === 'up' && chart.sma20 != null && price >= chart.sma20) {
    stance = 'dip_buy';
    ruleId = 'uptrend_dip_buy';
  }

  return {
    stance,
    ruleId,
    buyBelow,
    sellAbove,
    rationale: { rsi, recentRangePct, trend },
  };
}

export function recentRangeBounds(
  closes: number[],
  bars = STOCK_ACTION_RULES.recentBars,
): { low: number; high: number } | null {
  const slice = closes.slice(-Math.min(bars, closes.length));
  if (slice.length < 2) return null;
  return { low: Math.min(...slice), high: Math.max(...slice) };
}

export function recentRangePosition(
  current: number,
  closes: number[],
  bars = STOCK_ACTION_RULES.recentBars,
): number | null {
  const recent = recentRangeBounds(closes, bars);
  if (!recent || recent.high <= recent.low) return null;
  return ((current - recent.low) / (recent.high - recent.low)) * 100;
}
