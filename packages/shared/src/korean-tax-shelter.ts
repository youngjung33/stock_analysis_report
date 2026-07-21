/**
 * ISA·연금저축 등 세제혜택 계좌 — 2026년 기준 참고.
 * ISA는 계좌 단위 손익통산·비과세 한도·9.9% 분리과세를 단순 모델로 추정합니다.
 */

/** 개인종합자산관리계좌(ISA) 유형 */
export type IsaAccountType = 'none' | 'general' | 'worker' | 'senior';

/** ISA 초과분 분리과세율 (소득세 9% + 지방 0.9%) */
export const ISA_OVERFLOW_TAX_RATE = 0.099;

export interface IsaAccountOption {
  id: IsaAccountType;
  label: string;
  taxFreeLimitKrw: number;
  description: string;
}

export const ISA_ACCOUNT_OPTIONS: IsaAccountOption[] = [
  {
    id: 'none',
    label: '해당 없음',
    taxFreeLimitKrw: 0,
    description: '일반 위탁·종합 계좌만 사용',
  },
  {
    id: 'general',
    label: 'ISA 일반형',
    taxFreeLimitKrw: 2_000_000,
    description: '순소득 200만 원까지 비과세, 초과분 9.9% 분리과세',
  },
  {
    id: 'worker',
    label: 'ISA 서민형·농어민형',
    taxFreeLimitKrw: 4_000_000,
    description: '순소득 400만 원까지 비과세 (소득 요건 충족 시)',
  },
  {
    id: 'senior',
    label: 'ISA 노후형',
    taxFreeLimitKrw: 4_000_000,
    description: '만 65세 이상, 순소득 400만 원까지 비과세',
  },
];

/** 연금저축 세액공제 (근로소득자, 2026년 참고) */
export const PENSION_SAVINGS_CREDIT_RATE = 0.132;
export const PENSION_SAVINGS_ANNUAL_LIMIT_KRW = 6_000_000;
export const PENSION_SAVINGS_CREDIT_MAX_KRW = 792_000;

export function resolveIsaTaxFreeLimit(isaType: IsaAccountType): number {
  return ISA_ACCOUNT_OPTIONS.find((o) => o.id === isaType)?.taxFreeLimitKrw ?? 0;
}

/** ISA 계좌 순소득에 대한 분리과세 추정 (비과세 한도 + 9.9%) */
export function computeIsaAccountTax(isaNetIncomeKrw: number, isaType: IsaAccountType): number {
  if (isaType === 'none' || isaNetIncomeKrw <= 0) return 0;
  const limit = resolveIsaTaxFreeLimit(isaType);
  const taxable = Math.max(0, isaNetIncomeKrw - limit);
  return Math.round(taxable * ISA_OVERFLOW_TAX_RATE);
}

/** 연금저축 납입액 → 세액공제 추정 (IRP 합산 등은 미반영) */
export function computePensionSavingsCredit(contributionKrw: number): number {
  if (contributionKrw <= 0) return 0;
  const base = Math.min(contributionKrw, PENSION_SAVINGS_ANNUAL_LIMIT_KRW);
  return Math.min(Math.round(base * PENSION_SAVINGS_CREDIT_RATE), PENSION_SAVINGS_CREDIT_MAX_KRW);
}

export interface IsaIncomeSplitInput {
  domesticDividendKrw: number;
  foreignDividendKrw: number;
  foreignCapitalGainNetKrw: number;
  otherFinancialIncomeKrw: number;
  isaType: IsaAccountType;
  /** 등록 소득 중 ISA 계좌 비율 (0~100). 거래별 구분 없을 때 사용 */
  isaIncomeSharePercent: number;
  /** ISA 순소득 직접 입력 (0이면 비율로 추정) */
  isaNetIncomeOverrideKrw: number;
}

export interface IsaIncomeSplitResult {
  isaNetIncomeKrw: number;
  regularDomesticDividendKrw: number;
  regularForeignDividendKrw: number;
  regularForeignGainNetKrw: number;
  regularOtherFinancialKrw: number;
}

/** 포트폴리오 소득을 ISA / 일반 계좌로 나눔 (단순 비율 또는 직접 입력) */
export function splitIncomeByIsaAccount(input: IsaIncomeSplitInput): IsaIncomeSplitResult {
  const share = Math.min(100, Math.max(0, input.isaIncomeSharePercent)) / 100;

  if (input.isaType === 'none') {
    return {
      isaNetIncomeKrw: 0,
      regularDomesticDividendKrw: input.domesticDividendKrw,
      regularForeignDividendKrw: input.foreignDividendKrw,
      regularForeignGainNetKrw: input.foreignCapitalGainNetKrw,
      regularOtherFinancialKrw: input.otherFinancialIncomeKrw,
    };
  }

  const isaDomDiv = Math.round(input.domesticDividendKrw * share);
  const isaForeignDiv = Math.round(input.foreignDividendKrw * share);
  const isaForeignGain = Math.round(Math.max(0, input.foreignCapitalGainNetKrw) * share);
  const isaOther = Math.round(input.otherFinancialIncomeKrw * share);

  const estimatedIsaNet = isaDomDiv + isaForeignDiv + isaForeignGain + isaOther;
  const isaNetIncomeKrw =
    input.isaNetIncomeOverrideKrw > 0 ? input.isaNetIncomeOverrideKrw : estimatedIsaNet;

  return {
    isaNetIncomeKrw,
    regularDomesticDividendKrw: input.domesticDividendKrw - isaDomDiv,
    regularForeignDividendKrw: input.foreignDividendKrw - isaForeignDiv,
    regularForeignGainNetKrw: input.foreignCapitalGainNetKrw - isaForeignGain,
    regularOtherFinancialKrw: input.otherFinancialIncomeKrw - isaOther,
  };
}
