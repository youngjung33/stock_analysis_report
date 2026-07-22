import { Market } from './enums';
import { CashBalances, cashToKrw, formatCashAmount } from './cash-ledger';
import { AllocationByMarket } from './portfolio-allocation';
import { StockRecommendation } from './market-insights';

export interface PortfolioPreferences {
  targetKrPercent: number;
  targetUsPercent: number;
  maxSingleWeightPercent: number;
}

export const DEFAULT_PORTFOLIO_PREFERENCES: PortfolioPreferences = {
  targetKrPercent: 70,
  targetUsPercent: 30,
  maxSingleWeightPercent: 40,
};

export interface SimulationHoldingInput {
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  quantity: number;
  currentPrice: number | null;
  marketValueKrw: number | null;
  weightPercent: number | null;
}

export type SimulationActionType = 'keep' | 'trim' | 'add' | 'reserve_cash';

export interface SimulationAction {
  type: SimulationActionType;
  symbol: string;
  name: string;
  market: Market;
  currency: string;
  /** @deprecated use reasonKey — kept for tests / fallback */
  reason: string;
  reasonKey: string;
  reasonParams?: Record<string, string | number>;
  currentWeightPercent: number | null;
  targetWeightPercent: number | null;
  suggestedAmountKrw: number | null;
  suggestedAmountNative: number | null;
  suggestedQuantity: number | null;
  tagLabel?: string;
  tag?: import('./market-insights').RecommendationTag;
}

export interface PortfolioSimulationResult {
  cash: CashBalances;
  cashTotalKrw: number;
  investedKrw: number;
  totalAssetsKrw: number;
  cashPercent: number;
  investedPercent: number;
  stockAllocationByMarket: AllocationByMarket;
  targetAllocationByMarket: AllocationByMarket;
  allocationGapPercent: { kr: number; us: number };
  actions: SimulationAction[];
  projectedCash: CashBalances;
  projectedCashTotalKrw: number;
  projectedInvestedKrw: number;
  projectedTotalAssetsKrw: number;
  projectedStockAllocation: AllocationByMarket;
  /** @deprecated use headlineKey — kept for tests / fallback */
  headline: string;
  /** @deprecated use descriptionKey */
  description: string;
  headlineKey: string;
  headlineParams?: Record<string, string | number>;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
}

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function marketStockValue(holdings: SimulationHoldingInput[], market: Market): number {
  return holdings.reduce((sum, h) => {
    if (h.market !== market || h.marketValueKrw === null) return sum;
    return sum + h.marketValueKrw;
  }, 0);
}

function stockAllocation(holdings: SimulationHoldingInput[]): AllocationByMarket {
  const kr = marketStockValue(holdings, Market.KR);
  const us = marketStockValue(holdings, Market.US);
  const total = kr + us;
  if (total <= 0) return { krPercent: 0, usPercent: 0 };
  return {
    krPercent: (kr / total) * 100,
    usPercent: (us / total) * 100,
  };
}

function affordableQuantity(cashNative: number, price: number): number {
  if (price <= 0 || cashNative <= 0) return 0;
  return Math.floor(cashNative / price);
}

/**
 * 자본금·보유·목표비중·시장추천을 바탕으로 유지/매도·매수 시뮬레이션
 */
export function buildPortfolioSimulation(input: {
  cash: CashBalances;
  holdings: SimulationHoldingInput[];
  preferences: PortfolioPreferences;
  recommendations: StockRecommendation[];
  usdKrwRate: number | null;
}): PortfolioSimulationResult {
  const { cash, holdings, preferences, recommendations, usdKrwRate } = input;
  const prefs = {
    targetKrPercent: clampPercent(preferences.targetKrPercent),
    targetUsPercent: clampPercent(preferences.targetUsPercent),
    maxSingleWeightPercent: clampPercent(preferences.maxSingleWeightPercent),
  };

  const investedKrw = holdings.reduce((sum, h) => sum + (h.marketValueKrw ?? 0), 0);
  const cashTotalKrw = cashToKrw(cash, usdKrwRate);
  const totalAssetsKrw = investedKrw + cashTotalKrw;
  const cashPercent = totalAssetsKrw > 0 ? (cashTotalKrw / totalAssetsKrw) * 100 : 100;
  const investedPercent = totalAssetsKrw > 0 ? (investedKrw / totalAssetsKrw) * 100 : 0;

  const stockAlloc = stockAllocation(holdings);
  const targetAlloc: AllocationByMarket = {
    krPercent: prefs.targetKrPercent,
    usPercent: prefs.targetUsPercent,
  };
  const allocationGapPercent = {
    kr: targetAlloc.krPercent - stockAlloc.krPercent,
    us: targetAlloc.usPercent - stockAlloc.usPercent,
  };

  const actions: SimulationAction[] = [];
  let projectedCash = { ...cash };
  let projectedInvestedKrw = investedKrw;

  // 1) 과집중 종목 → trim
  for (const h of holdings) {
    const weight = h.weightPercent ?? 0;
    if (weight <= prefs.maxSingleWeightPercent || !h.currentPrice || h.marketValueKrw === null) {
      actions.push({
        type: 'keep',
        symbol: h.symbol,
        name: h.name,
        market: h.market,
        currency: h.currency,
        reason: weight > 0 ? '목표 비중 내 — 유지' : '소량 보유 — 유지',
        reasonKey: weight > 0 ? 'shared.simulation.reason.withinTarget' : 'shared.simulation.reason.smallHolding',
        currentWeightPercent: h.weightPercent,
        targetWeightPercent: h.weightPercent,
        suggestedAmountKrw: null,
        suggestedAmountNative: null,
        suggestedQuantity: null,
      });
      continue;
    }

    const targetWeight = prefs.maxSingleWeightPercent * 0.9;
    const excessWeight = weight - targetWeight;
    const trimKrw = totalAssetsKrw > 0 ? (excessWeight / 100) * totalAssetsKrw : 0;
    const trimNative =
      h.currency === 'USD' && usdKrwRate
        ? trimKrw / usdKrwRate
        : trimKrw;
    const trimQty = affordableQuantity(trimNative, h.currentPrice);
    const actualTrimNative = trimQty * h.currentPrice;
    const actualTrimKrw =
      h.currency === 'USD' && usdKrwRate ? actualTrimNative * usdKrwRate : actualTrimNative;

    if (trimQty > 0) {
      if (h.currency === 'KRW') projectedCash.krw += actualTrimNative;
      else projectedCash.usd += actualTrimNative;
      projectedInvestedKrw -= actualTrimKrw;

      actions.push({
        type: 'trim',
        symbol: h.symbol,
        name: h.name,
        market: h.market,
        currency: h.currency,
        reason: `비중 ${weight.toFixed(1)}% → 목표 ${targetWeight.toFixed(0)}% 이하로 조정 검토`,
        reasonKey: 'shared.simulation.reason.trimWeight',
        reasonParams: {
          weight: weight.toFixed(1),
          target: targetWeight.toFixed(0),
        },
        currentWeightPercent: h.weightPercent,
        targetWeightPercent: targetWeight,
        suggestedAmountKrw: actualTrimKrw,
        suggestedAmountNative: actualTrimNative,
        suggestedQuantity: trimQty,
      });
    } else {
      actions.push({
        type: 'keep',
        symbol: h.symbol,
        name: h.name,
        market: h.market,
        currency: h.currency,
        reason: '과집중이나 매도 단위 미달 — 관찰',
        reasonKey: 'shared.simulation.reason.trimUnitTooSmall',
        currentWeightPercent: h.weightPercent,
        targetWeightPercent: h.weightPercent,
        suggestedAmountKrw: null,
        suggestedAmountNative: null,
        suggestedQuantity: null,
      });
    }
  }

  // 2) 시장별 부족분 → add (추천 종목)
  const underweightMarket =
    allocationGapPercent.kr >= allocationGapPercent.us ? Market.KR : Market.US;
  const gapPercent = Math.max(allocationGapPercent.kr, allocationGapPercent.us);
  const deployKrw =
    totalAssetsKrw > 0 && gapPercent > 2
      ? Math.min(cashTotalKrw * 0.6, (gapPercent / 100) * totalAssetsKrw)
      : Math.min(cashTotalKrw * 0.3, cashTotalKrw);

  const marketRecs = recommendations.filter((r) => r.market === underweightMarket);
  const picks = marketRecs.length > 0 ? marketRecs : recommendations;
  const perPickKrw = picks.length > 0 ? deployKrw / Math.min(picks.length, 2) : 0;

  for (const rec of picks.slice(0, 2)) {
    const nativeBudget =
      rec.currency === 'USD' && usdKrwRate ? perPickKrw / usdKrwRate : perPickKrw;
    const availableNative = rec.currency === 'KRW' ? projectedCash.krw : projectedCash.usd;
    const budget = Math.min(nativeBudget, availableNative);
    const qty = affordableQuantity(budget, rec.currentPrice);
    if (qty <= 0) continue;

    const spendNative = qty * rec.currentPrice;
    const spendKrw =
      rec.currency === 'USD' && usdKrwRate ? spendNative * usdKrwRate : spendNative;

    if (rec.currency === 'KRW') projectedCash.krw -= spendNative;
    else projectedCash.usd -= spendNative;
    projectedInvestedKrw += spendKrw;

    actions.push({
      type: 'add',
      symbol: rec.symbol,
      name: rec.name,
      market: rec.market,
      currency: rec.currency,
      reason: `${rec.tagLabel} — ${rec.reason}`,
      reasonKey: rec.reasonKey ?? 'shared.simulation.reason.addRecommendation',
      reasonParams: rec.reasonParams,
      tag: rec.tag,
      currentWeightPercent: null,
      targetWeightPercent: null,
      suggestedAmountKrw: spendKrw,
      suggestedAmountNative: spendNative,
      suggestedQuantity: qty,
      tagLabel: rec.tagLabel,
    });
  }

  // 3) 남는 현금
  const projectedCashTotalKrw = cashToKrw(projectedCash, usdKrwRate);
  if (projectedCash.krw > 0 || projectedCash.usd > 0) {
    actions.push({
      type: 'reserve_cash',
      symbol: 'CASH',
      name: '가용 현금',
      market: Market.KR,
      currency: 'KRW',
      reason: '조정 후 남는 예수금 — 추가 매수·비상금으로 활용',
      reasonKey: 'shared.simulation.reason.reserveCash',
      currentWeightPercent: null,
      targetWeightPercent: null,
      suggestedAmountKrw: projectedCashTotalKrw,
      suggestedAmountNative: null,
      suggestedQuantity: null,
    });
  }

  const projectedTotalAssetsKrw = projectedInvestedKrw + projectedCashTotalKrw;
  const krAfter = marketStockValue(
    holdings.map((h) => {
      const trim = actions.find((a) => a.type === 'trim' && a.symbol === h.symbol);
      const addKrw = actions
        .filter((a) => a.type === 'add' && a.market === h.market)
        .reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);
      let mv = h.marketValueKrw ?? 0;
      if (trim) mv -= trim.suggestedAmountKrw ?? 0;
      return { ...h, marketValueKrw: Math.max(0, mv) };
    }),
    Market.KR,
  );
  const addKr = actions
    .filter((a) => a.type === 'add' && a.market === Market.KR)
    .reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);
  const addUs = actions
    .filter((a) => a.type === 'add' && a.market === Market.US)
    .reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);
  const trimKr = actions
    .filter((a) => a.type === 'trim' && a.market === Market.KR)
    .reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);
  const trimUs = actions
    .filter((a) => a.type === 'trim' && a.market === Market.US)
    .reduce((s, a) => s + (a.suggestedAmountKrw ?? 0), 0);

  const projectedKr = krAfter + addKr - trimKr;
  const projectedUs =
    marketStockValue(holdings, Market.US) - trimUs + addUs;
  const projStockTotal = projectedKr + projectedUs;
  const projectedStockAllocation: AllocationByMarket =
    projStockTotal > 0
      ? { krPercent: (projectedKr / projStockTotal) * 100, usPercent: (projectedUs / projStockTotal) * 100 }
      : { krPercent: 0, usPercent: 0 };

  const regionLabel = underweightMarket === Market.KR ? '국내' : '미국';
  const regionKey = underweightMarket === Market.KR ? 'domestic' : 'us';
  const headlineKey =
    cashTotalKrw <= 0 && investedKrw <= 0
      ? 'shared.simulation.headline.noCapital'
      : 'shared.simulation.headline.withAssets';
  const headlineParams =
    cashTotalKrw <= 0 && investedKrw <= 0
      ? undefined
      : {
          totalAssets: formatCashAmount(totalAssetsKrw, 'KRW'),
          cashPercent: cashPercent.toFixed(0),
        };

  const isUnderweightKr = allocationGapPercent.kr >= allocationGapPercent.us;
  const descriptionKey =
    gapPercent > 2
      ? isUnderweightKr
        ? 'shared.simulation.description.underweight'
        : 'shared.simulation.description.overweight'
      : 'shared.simulation.description.balanced';
  const descriptionParams =
    gapPercent > 2
      ? {
          region: regionKey,
          gap: Math.abs(gapPercent).toFixed(1),
        }
      : undefined;

  const headline =
    cashTotalKrw <= 0 && investedKrw <= 0
      ? '투자 원금을 설정하면 맞춤 비중 제안이 시작됩니다'
      : `총 자산 ${formatCashAmount(totalAssetsKrw, 'KRW')} · 예수금 ${cashPercent.toFixed(0)}%`;

  const description =
    gapPercent > 2
      ? `${regionLabel} 비중이 목표 대비 ${Math.abs(gapPercent).toFixed(1)}%p ${isUnderweightKr ? '부족' : '과다'}합니다. 아래 매수 제안을 참고하세요.`
      : '시장·종목 비중이 목표에 근접합니다. 과집중 종목 조정과 현금 배분을 확인하세요.';

  return {
    cash,
    cashTotalKrw,
    investedKrw,
    totalAssetsKrw,
    cashPercent,
    investedPercent,
    stockAllocationByMarket: stockAlloc,
    targetAllocationByMarket: targetAlloc,
    allocationGapPercent,
    actions,
    projectedCash,
    projectedCashTotalKrw,
    projectedInvestedKrw,
    projectedTotalAssetsKrw,
    projectedStockAllocation,
    headline,
    description,
    headlineKey,
    headlineParams,
    descriptionKey,
    descriptionParams,
  };
}
