/** 보유 종목·현금이 모두 없을 때 */
export function isPortfolioEmpty(summary: {
  holdingsCount: number;
  cashKrw: number;
  cashUsd: number;
}): boolean {
  return summary.holdingsCount === 0 && summary.cashKrw === 0 && summary.cashUsd === 0;
}
