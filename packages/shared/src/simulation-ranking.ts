import type { StockRecommendation } from './market-insights.types';
import type { MarketRegimeId } from './market-recommendation/types';

export type SimulationAddPriority = 'boosted' | 'normal' | 'deprioritized';

export interface SimulationAddPriorityResult {
  priority: SimulationAddPriority;
  reasonKey?: string;
  reasonParams?: Record<string, string | number>;
}

const PRIORITY_ORDER: Record<SimulationAddPriority, number> = {
  boosted: 0,
  normal: 1,
  deprioritized: 2,
};

/** §10 v2 — enrichment-aware add pick ordering */
export function resolveSimulationAddPriority(rec: StockRecommendation): SimulationAddPriorityResult {
  const breakdown = rec.scoreBreakdown ?? [];

  if (breakdown.some((b) => b.factor.includes('buyback') || b.factor.includes('dividend'))) {
    return { priority: 'boosted', reasonKey: 'shared.simulation.addPriority.buyback' };
  }

  for (const item of breakdown) {
    const divergence = item.evidenceParams?.divergence;
    if (divergence === 'bullish_news_price_down' || divergence === 'crowded_bullish_chase') {
      return {
        priority: 'deprioritized',
        reasonKey: 'shared.simulation.addPriority.narrativeDivergence',
        reasonParams: { divergence: String(divergence) },
      };
    }
  }

  for (const item of breakdown) {
    if (!item.factor.startsWith('CH_EVENT:')) continue;
    const eventDay = item.evidenceParams?.eventDay;
    const kind = String(item.evidenceParams?.kind ?? '');
    if ((eventDay === 'D0' || eventDay === 'D+1') && kind.startsWith('earnings')) {
      return {
        priority: 'deprioritized',
        reasonKey: 'shared.simulation.addPriority.earningsEvent',
        reasonParams: { eventDay: String(eventDay) },
      };
    }
  }

  if (breakdown.some((b) => b.factor.startsWith('CH_FIGURE_DIRECT:') && Math.abs(b.delta) >= 0.2)) {
    const hit = breakdown.find((b) => b.factor.startsWith('CH_FIGURE_DIRECT:'));
    return {
      priority: 'deprioritized',
      reasonKey: 'shared.simulation.addPriority.figureVolatile',
      reasonParams: { figure: String(hit?.evidenceParams?.figure ?? '') },
    };
  }

  return { priority: 'normal' };
}

export function sortRecommendationsForSimulationAdd(
  recommendations: StockRecommendation[],
): StockRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const pa = PRIORITY_ORDER[resolveSimulationAddPriority(a).priority];
    const pb = PRIORITY_ORDER[resolveSimulationAddPriority(b).priority];
    if (pa !== pb) return pa - pb;
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

/** §10 — deploy cap: risk-off 15%, policy uncertainty 10% */
export function resolveSimulationDeployCapRatio(input: {
  regimes?: MarketRegimeId[];
  policyUncertainty?: boolean;
  baseRatio: number;
}): number {
  let ratio = input.baseRatio;
  if (input.regimes?.includes('globalRiskOff')) {
    ratio = Math.min(ratio, 0.15);
  }
  if (input.policyUncertainty) {
    ratio = Math.min(ratio, 0.1);
  }
  return ratio;
}

export function extractNarrativeDivergence(rec: StockRecommendation): string | null {
  for (const item of rec.scoreBreakdown ?? []) {
    const divergence = item.evidenceParams?.divergence;
    if (typeof divergence === 'string' && divergence !== 'none' && divergence !== 'aligned') {
      return divergence;
    }
  }
  return null;
}
