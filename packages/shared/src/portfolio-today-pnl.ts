export interface TodayPnlHoldingInput {
  quantity: number;
  currentPrice: number | null;
  changePercent: number | null;
}

/** 전일 종가 대비 보유 수량 기준 당일 손익 */
export function computeHoldingTodayPnl(
  quantity: number,
  currentPrice: number,
  changePercent: number,
): number {
  const previousClose = currentPrice / (1 + changePercent / 100);
  return (currentPrice - previousClose) * quantity;
}

export function aggregatePortfolioTodayPnl(
  holdings: TodayPnlHoldingInput[],
): { todayPnl: number | null; todayPnlPercent: number | null } {
  let todayPnl = 0;
  let previousValue = 0;
  let counted = 0;

  for (const h of holdings) {
    if (h.currentPrice === null || h.changePercent === null) continue;
    todayPnl += computeHoldingTodayPnl(h.quantity, h.currentPrice, h.changePercent);
    previousValue += (h.currentPrice / (1 + h.changePercent / 100)) * h.quantity;
    counted += 1;
  }

  if (counted === 0) {
    return { todayPnl: null, todayPnlPercent: null };
  }

  const todayPnlPercent = previousValue > 0 ? (todayPnl / previousValue) * 100 : null;
  return { todayPnl, todayPnlPercent };
}
