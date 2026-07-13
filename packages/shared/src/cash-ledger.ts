/** 현금 원장 유형 */
export enum CashLedgerType {
  INITIAL = 'INITIAL',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  BUY_SETTLE = 'BUY_SETTLE',
  SELL_SETTLE = 'SELL_SETTLE',
  DIVIDEND = 'DIVIDEND',
  ADJUST = 'ADJUST',
}

export type CashCurrency = 'KRW' | 'USD';

export interface CashLedgerEntryInput {
  currency: CashCurrency;
  type: CashLedgerType;
  /** 양수=유입, 음수=유출 */
  amount: number;
  occurredAt: string | Date;
  memo?: string | null;
  refId?: string | null;
}

export interface CashBalances {
  krw: number;
  usd: number;
}

export function computeCashBalances(entries: Pick<CashLedgerEntryInput, 'currency' | 'amount'>[]): CashBalances {
  let krw = 0;
  let usd = 0;
  for (const e of entries) {
    if (e.currency === 'KRW') krw += e.amount;
    else usd += e.amount;
  }
  return { krw, usd };
}

export function cashToKrw(balances: CashBalances, usdKrwRate: number | null): number {
  const usdPart = usdKrwRate && balances.usd > 0 ? balances.usd * usdKrwRate : 0;
  return balances.krw + usdPart;
}

export function formatCashAmount(amount: number, currency: CashCurrency): string {
  const formatted = Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: currency === 'KRW' ? 0 : 2 });
  if (currency === 'KRW') return `₩${formatted}`;
  return `$${formatted}`;
}
