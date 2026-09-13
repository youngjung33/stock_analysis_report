import { AI_NEWS_TITLE_MAX } from './constants';

export type PriceTrendBand = 'strong_up' | 'up' | 'flat' | 'down' | 'strong_down';
export type RsiZone = 'oversold' | 'neutral' | 'overbought';
export type AllocationDrift = 'balanced' | 'kr_heavy' | 'us_heavy';
export type PnlBand = 'profit' | 'loss' | 'flat';

export interface StockDerivedFacts {
  priceTrendBand: PriceTrendBand;
  rsiZone: RsiZone | null;
  newsTone: 'bullish' | 'bearish' | 'neutral' | null;
  eventHint: string | null;
  ruleTag: string;
}

export interface PortfolioDerivedFacts {
  allocationDrift: AllocationDrift;
  topConcentrationPercent: number | null;
  cashRatioPercent: number;
  pnlBand: PnlBand;
  overweightKrPp: number;
  overweightUsPp: number;
}

export function priceTrendBandFromChange(change1d: number): PriceTrendBand {
  if (change1d >= 3) return 'strong_up';
  if (change1d >= 0.5) return 'up';
  if (change1d <= -3) return 'strong_down';
  if (change1d <= -0.5) return 'down';
  return 'flat';
}

export function rsiZoneFromValue(rsi14: number | null | undefined): RsiZone | null {
  if (rsi14 == null || !Number.isFinite(rsi14)) return null;
  if (rsi14 >= 70) return 'overbought';
  if (rsi14 <= 30) return 'oversold';
  return 'neutral';
}

export function buildStockDerivedFacts(input: {
  change1d: number;
  rsi14: number | null;
  newsTone?: 'bullish' | 'bearish' | 'neutral' | null;
  eventKind?: string | null;
  eventDay?: string | null;
  ruleTag: string;
}): StockDerivedFacts {
  const eventHint =
    input.eventKind && input.eventDay ? `${input.eventKind}@${input.eventDay}` : null;
  return {
    priceTrendBand: priceTrendBandFromChange(input.change1d),
    rsiZone: rsiZoneFromValue(input.rsi14),
    newsTone: input.newsTone ?? null,
    eventHint,
    ruleTag: input.ruleTag,
  };
}

export function buildPortfolioDerivedFacts(input: {
  totalValueKrw: number;
  cashKrw: number;
  cashUsd: number;
  totalPnlKrw: number;
  targetKrPercent: number;
  targetUsPercent: number;
  actualKrPercent: number;
  actualUsPercent: number;
  topHoldings: Array<{ weightPercent: number }>;
}): PortfolioDerivedFacts {
  const total = input.totalValueKrw > 0 ? input.totalValueKrw : 1;
  const cashRatioPercent = ((input.cashKrw + input.cashUsd) / total) * 100;
  const krDrift = input.actualKrPercent - input.targetKrPercent;
  const usDrift = input.actualUsPercent - input.targetUsPercent;
  let allocationDrift: AllocationDrift = 'balanced';
  if (krDrift > 5 && krDrift >= usDrift) allocationDrift = 'kr_heavy';
  else if (usDrift > 5 && usDrift > krDrift) allocationDrift = 'us_heavy';

  let pnlBand: PnlBand = 'flat';
  if (input.totalPnlKrw > total * 0.005) pnlBand = 'profit';
  else if (input.totalPnlKrw < -total * 0.005) pnlBand = 'loss';

  const topConcentrationPercent =
    input.topHoldings.length > 0 ? input.topHoldings[0].weightPercent : null;

  return {
    allocationDrift,
    topConcentrationPercent,
    cashRatioPercent: Math.round(cashRatioPercent * 10) / 10,
    pnlBand,
    overweightKrPp: Math.round(krDrift * 10) / 10,
    overweightUsPp: Math.round(usDrift * 10) / 10,
  };
}

/** Title-only news list for AI context (deduped, capped). */
export function pickNewsTitlesForAi(
  titles: string[] | undefined | null,
  fallbackSample?: string | null,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of titles ?? []) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= AI_NEWS_TITLE_MAX) break;
  }
  if (out.length === 0 && fallbackSample?.trim()) {
    out.push(fallbackSample.trim());
  }
  return out;
}
