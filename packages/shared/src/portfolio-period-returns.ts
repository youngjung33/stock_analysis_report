/**
 * 포트폴리오 기간 수익률 — 가중·종가·누적 수익 계산.
 */
export type PortfolioPeriod = '1mo' | '3mo' | 'ytd' | 'max';

export const PORTFOLIO_PERIODS: PortfolioPeriod[] = ['1mo', '3mo', 'ytd', 'max'];

export const PERIOD_LABELS: Record<PortfolioPeriod, string> = {
  '1mo': '1개월',
  '3mo': '3개월',
  ytd: '올해',
  max: '전체',
};

export interface PeriodReturnInput {
  weightPercent: number;
  returnPercent: number | null;
}

export interface PortfolioPeriodReturn {
  period: PortfolioPeriod;
  returnPercent: number | null;
  coveragePercent: number;
}

/** 종목별 가중 평균 기간 수익률 및 데이터 커버리지(%) 계산 */
export function computeWeightedPeriodReturn(inputs: PeriodReturnInput[]): {
  returnPercent: number | null;
  coveragePercent: number;
} {
  const eligible = inputs.filter((i) => i.returnPercent !== null && i.weightPercent > 0);
  if (eligible.length === 0) return { returnPercent: null, coveragePercent: 0 };

  const totalWeight = eligible.reduce((s, i) => s + i.weightPercent, 0);
  if (totalWeight <= 0) return { returnPercent: null, coveragePercent: 0 };

  const weighted = eligible.reduce(
    (s, i) => s + (i.weightPercent / totalWeight) * (i.returnPercent as number),
    0,
  );

  const fullWeight = inputs.reduce((s, i) => s + i.weightPercent, 0);
  const coveragePercent = fullWeight > 0 ? (totalWeight / fullWeight) * 100 : 0;

  return { returnPercent: weighted, coveragePercent };
}

/** 전체 보유(MAX) 누적 수익률 — (시가+실현손익-원가)/원가 */
export function computeMaxTotalReturn(
  totalMarketValueKrw: number | null,
  totalCostBasisKrw: number,
  totalRealizedPnlKrw: number,
): number | null {
  if (totalCostBasisKrw <= 0 || totalMarketValueKrw === null) return null;
  return ((totalMarketValueKrw + totalRealizedPnlKrw - totalCostBasisKrw) / totalCostBasisKrw) * 100;
}

/** 종가 시계열과 기간으로 수익률(%) 산출 */
export function periodReturnFromCloses(closes: number[], period: PortfolioPeriod): number | null {
  if (closes.length < 2) return null;
  const current = closes[closes.length - 1];
  if (current <= 0) return null;

  if (period === 'max') {
    const first = closes[0];
    if (first <= 0) return null;
    return ((current - first) / first) * 100;
  }

  if (period === 'ytd') {
    const yearStart = new Date().getFullYear();
    // closes don't have dates here — caller passes trimmed series
    const first = closes[0];
    if (first <= 0) return null;
    return ((current - first) / first) * 100;
  }

  const bars = period === '1mo' ? 21 : 63;
  const idx = Math.max(0, closes.length - 1 - bars);
  const base = closes[idx];
  if (base <= 0) return null;
  return ((current - base) / base) * 100;
}
