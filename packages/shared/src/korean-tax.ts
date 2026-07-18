/**
 * 한국 거주자 주식 투자 세금 — 2026년 기준 참고 규칙·추정 계산.
 * 실제 신고·납부는 국세청·세무 전문가 확인이 필요합니다.
 */
import { Market } from './enums';
import { convertToKrw } from './portfolio-fx';
import { DividendEvent, SellEvent, extractRealizedEvents, filterEventsByYear } from './realized-events';
import type { CorporateActionInput } from './corporate-actions';
import type { PositionTransaction } from './position-calculator';

/** 금융소득종합과세 기준 (이자+배당 합산) */
export const FINANCIAL_INCOME_THRESHOLD_KRW = 20_000_000;

/** 양도소득 기본공제 (해외주식·국내 대주주) */
export const CAPITAL_GAINS_BASIC_DEDUCTION_KRW = 2_500_000;

/** 국내 배당 분리과세 원천징수율 (소득세 14% + 지방 1.4%) */
export const DOMESTIC_DIVIDEND_WITHHOLDING_RATE = 0.154;

/** 해외주식 양도소득세율 (소득세 20% + 지방 2%) */
export const FOREIGN_CAPITAL_GAINS_RATE = 0.22;

/** 대주주 양도소득 — 과세표준 3억 이하 */
export const MAJOR_SHAREHOLDER_GAINS_RATE_LOW = 0.22;

/** 대주주 양도소득 — 과세표준 3억 초과 */
export const MAJOR_SHAREHOLDER_GAINS_RATE_HIGH = 0.275;

/** 대주주 고액 구간 기준 */
export const MAJOR_SHAREHOLDER_HIGH_BRACKET_KRW = 300_000_000;

/** 증권거래세 (매도 대금 기준, KOSPI·KOSDAQ 평균 참고) */
export const SECURITIES_TRANSACTION_TAX_RATE = 0.002;

export type ForeignDividendSource = 'US' | 'JP' | 'CN' | 'HK' | 'UK' | 'OTHER';

export interface ForeignDividendWithholdingRule {
  label: string;
  abroadRate: number;
  additionalKrRate: number;
  note: string;
}

export const FOREIGN_DIVIDEND_WITHHOLDING: Record<ForeignDividendSource, ForeignDividendWithholdingRule> = {
  US: { label: '미국', abroadRate: 0.15, additionalKrRate: 0, note: '한·미 조세조약 — 국내 추가 과세 없음 (5월 신고·외국납부세액공제)' },
  JP: { label: '일본', abroadRate: 0.15315, additionalKrRate: 0, note: '조세조약 — 국내 추가 과세 없음' },
  CN: { label: '중국', abroadRate: 0.1, additionalKrRate: 0.044, note: '현지 10% + 국내 차액 약 4.4% (지방세 별도)' },
  HK: { label: '홍콩', abroadRate: 0, additionalKrRate: 0.154, note: '현지 원천징수 없음 — 국내 15.4% 신고' },
  UK: { label: '영국', abroadRate: 0, additionalKrRate: 0.154, note: '현지 원천징수 없음 — 국내 15.4% 신고' },
  OTHER: { label: '기타', abroadRate: 0.15, additionalKrRate: 0, note: '국가별 조세조약·현지 세율 확인 필요' },
};

export interface KoreanTaxRuleItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  rateLabel: string;
  thresholdLabel: string;
  filingLabel: string;
  notes: string[];
}

/** UI 표시용 세금 기준 전체 목록 */
export const KOREAN_TAX_RULES_REFERENCE: KoreanTaxRuleItem[] = [
  {
    id: 'kr-capital-general',
    category: '국내주식 · 양도',
    title: '일반 투자자 매매차익',
    summary: '코스피·코스닥 상장주식을 대주주가 아닌 경우 매매차익 비과세',
    rateLabel: '0% (비과세)',
    thresholdLabel: '해당 없음',
    filingLabel: '신고 불필요',
    notes: ['금융투자소득세(금투세)는 2026년 기준 미시행·폐지 논의', '대주주·비상장주식은 별도 과세'],
  },
  {
    id: 'kr-capital-major',
    category: '국내주식 · 양도',
    title: '대주주 매매차익',
    summary: '종목당 시가총액 50억 원 이상 또는 지분 1% 이상 보유 시 양도소득세',
    rateLabel: '22% (3억 이하) / 27.5% (3억 초과, 지방세 포함)',
    thresholdLabel: `기본공제 ${(CAPITAL_GAINS_BASIC_DEDUCTION_KRW / 10_000).toLocaleString('ko-KR')}만 원/년`,
    filingLabel: '다음 해 5월 확정신고',
    notes: ['국내·해외 주식 양도손익 통산 가능 (2020.1.1 이후)', '필요경비: 수수료 등 (증빙 필요)'],
  },
  {
    id: 'kr-dividend',
    category: '국내주식 · 배당',
    title: '배당소득 (분리과세)',
    summary: '국내 배당금 원천징수 후 입금',
    rateLabel: `${(DOMESTIC_DIVIDEND_WITHHOLDING_RATE * 100).toFixed(1)}% (14% + 지방 1.4%)`,
    thresholdLabel: `금융소득(이자+배당) ${(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원 이하 시 분리과세 종결`,
    filingLabel: '2,000만 원 초과 시 5월 종합소득세 신고',
    notes: ['예금 이자·채권 이자·국내외 배당 합산', '초과 시 전액 종합과세 (누진 6~45% + 지방세)'],
  },
  {
    id: 'kr-securities-tax',
    category: '국내주식 · 매도',
    title: '증권거래세',
    summary: '매도 시 매도 대금에 부과 (매수 시에도 소액 부과)',
    rateLabel: '약 0.18~0.23% (시장·종목별 상이)',
    thresholdLabel: '공제 없음',
    filingLabel: '원천징수 (별도 신고 없음)',
    notes: ['코스피 약 0.18%, 코스닥 약 0.20~0.23% (농어촌특별세 포함)', '본 추정치는 0.20% 적용'],
  },
  {
    id: 'us-capital',
    category: '해외주식 · 양도',
    title: '해외주식 매매차익',
    summary: '모든 거주자 — 연간 양도차익 과세',
    rateLabel: `${(FOREIGN_CAPITAL_GAINS_RATE * 100).toFixed(0)}% (지방세 포함)`,
    thresholdLabel: `기본공제 ${(CAPITAL_GAINS_BASIC_DEDUCTION_KRW / 10_000).toLocaleString('ko-KR')}만 원/년 (국내·해외 합산 1회)`,
    filingLabel: '다음 해 5월 1~31일 확정신고',
    notes: ['같은 해 해외주식 손익 통산', '환율: 매수·매도 각각 선입선출 또는 거래일 환율 (본 앱은 단일 환율 추정)'],
  },
  {
    id: 'us-dividend',
    category: '해외주식 · 배당',
    title: '해외 배당소득',
    summary: '현지 원천징수 + 국내 추가 과세 (조세조약)',
    rateLabel: '국가별 상이 (미국 15% 등)',
    thresholdLabel: `금융소득 ${(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원 이하라도 해외 배당은 5월 신고 권장`,
    filingLabel: '5월 확정신고 (외국납부세액공제)',
    notes: ['2,000만 원 이하·국내 원천징수만 해당 시 분리과세 종결', '해외 배당은 원천징수 여부와 관계없이 신고 의무 (공제 목적)'],
  },
  {
    id: 'financial-comprehensive',
    category: '공통',
    title: '금융소득종합과세',
    summary: '이자 + 배당 합산 초과 시 누진세',
    rateLabel: '6% ~ 45% (+ 지방세 10%)',
    thresholdLabel: `${(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원/년`,
    filingLabel: '5월 종합소득세',
    notes: ['초과 시 금융소득 전액이 종합과세 대상', '이미 원천징수한 세액은 공제'],
  },
];

export interface KoreanTaxProfile {
  taxYear: number;
  isMajorShareholder: boolean;
  foreignDividendSource: ForeignDividendSource;
  /** 예금 이자·채권 이자 등 (배당 외 금융소득) */
  otherFinancialIncomeKrw: number;
  /** 근로·사업 등 배당 외 종합소득 추정 (누진세 구간 산정용) */
  estimatedOtherIncomeKrw: number;
}

export const DEFAULT_KOREAN_TAX_PROFILE: KoreanTaxProfile = {
  taxYear: new Date().getFullYear(),
  isMajorShareholder: false,
  foreignDividendSource: 'US',
  otherFinancialIncomeKrw: 0,
  estimatedOtherIncomeKrw: 50_000_000,
};

export interface TaxStockHistory {
  symbol: string;
  market: Market;
  currency: string;
  transactions: PositionTransaction[];
  corporateActions: CorporateActionInput[];
}

export interface TaxLineItem {
  id: string;
  category: string;
  label: string;
  baseKrw: number;
  rate: number;
  taxKrw: number;
  note?: string;
}

export interface KoreanTaxEstimate {
  year: number;
  profile: KoreanTaxProfile;
  domesticCapitalGainKrw: number;
  domesticCapitalGainTaxKrw: number;
  domesticDividendGrossKrw: number;
  domesticDividendWithheldKrw: number;
  domesticSecuritiesTaxKrw: number;
  foreignCapitalGainNetKrw: number;
  foreignCapitalGainTaxableKrw: number;
  foreignCapitalGainTaxKrw: number;
  foreignDividendGrossKrw: number;
  foreignDividendWithheldKrw: number;
  foreignDividendAdditionalTaxKrw: number;
  totalFinancialIncomeKrw: number;
  requiresComprehensiveTax: boolean;
  comprehensiveTaxKrw: number;
  separationDividendTaxKrw: number;
  totalEstimatedTaxKrw: number;
  lines: TaxLineItem[];
  disclaimers: string[];
}

const INCOME_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 14_000_000, rate: 0.06 },
  { upTo: 50_000_000, rate: 0.15 },
  { upTo: 88_000_000, rate: 0.24 },
  { upTo: 150_000_000, rate: 0.35 },
  { upTo: 300_000_000, rate: 0.38 },
  { upTo: 500_000_000, rate: 0.4 },
  { upTo: 1_000_000_000, rate: 0.42 },
  { upTo: Infinity, rate: 0.45 },
];

const LOCAL_TAX_MULTIPLIER = 1.1;

function computeProgressiveTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let remaining = taxableIncome;
  let prevLimit = 0;
  let tax = 0;
  for (const bracket of INCOME_BRACKETS) {
    const band = Math.min(remaining, bracket.upTo - prevLimit);
    if (band <= 0) break;
    tax += band * bracket.rate;
    remaining -= band;
    prevLimit = bracket.upTo;
  }
  return Math.round(tax * LOCAL_TAX_MULTIPLIER);
}

function marginalRate(taxableIncome: number): number {
  for (const bracket of INCOME_BRACKETS) {
    if (taxableIncome <= bracket.upTo) return bracket.rate * LOCAL_TAX_MULTIPLIER;
  }
  return 0.45 * LOCAL_TAX_MULTIPLIER;
}

function majorShareholderGainTax(taxableGain: number): number {
  if (taxableGain <= 0) return 0;
  if (taxableGain <= MAJOR_SHAREHOLDER_HIGH_BRACKET_KRW) {
    return Math.round(taxableGain * MAJOR_SHAREHOLDER_GAINS_RATE_LOW);
  }
  const lowPart = MAJOR_SHAREHOLDER_HIGH_BRACKET_KRW * MAJOR_SHAREHOLDER_GAINS_RATE_LOW;
  const highPart = (taxableGain - MAJOR_SHAREHOLDER_HIGH_BRACKET_KRW) * MAJOR_SHAREHOLDER_GAINS_RATE_HIGH;
  return Math.round(lowPart + highPart);
}

function toKrw(amount: number, currency: string, usdKrwRate: number | null): number {
  if (currency === 'KRW') return amount;
  return convertToKrw(amount, 'USD', usdKrwRate ?? 0) ?? 0;
}

/** 포트폴리오 거래·기업행위 + 사용자 프로필로 세금 추정 */
export function estimateKoreanTax(
  histories: TaxStockHistory[],
  profile: KoreanTaxProfile,
  usdKrwRate: number | null,
): KoreanTaxEstimate {
  const year = profile.taxYear;
  const lines: TaxLineItem[] = [];
  const disclaimers = [
    '본 추정은 참고용이며, 실제 세액·신고 의무는 국세청·세무사 확인이 필요합니다.',
    '해외주식 환산은 단일 환율(현재 또는 입력값)로 단순 추정합니다. 실제는 거래일별 환율·선입선출 적용.',
    '증권거래세·대주주 요건·필요경비(수수료)는 반영하지 않았거나 단순화했습니다.',
    '금융투자소득세(금투세)는 미반영 (2026년 기준 미시행 가정).',
  ];

  let domesticGainKrw = 0;
  let domesticSellProceedsKrw = 0;
  let domesticDividendKrw = 0;
  let foreignGainKrw = 0;
  let foreignLossKrw = 0;
  let foreignSellProceedsKrw = 0;
  let foreignDividendKrw = 0;

  for (const history of histories) {
    const { sells, dividends } = extractRealizedEvents(history.transactions, history.corporateActions);
    const yearSells = filterEventsByYear(sells, year, 'tradedAt');
    const yearDividends = filterEventsByYear(dividends, year, 'effectiveAt');

    for (const sell of yearSells) {
      const gainKrw = toKrw(sell.gain, history.currency, usdKrwRate);
      const proceedsKrw = toKrw(sell.proceeds, history.currency, usdKrwRate);
      if (history.market === Market.KR) {
        domesticGainKrw += gainKrw;
        domesticSellProceedsKrw += proceedsKrw;
      } else {
        if (gainKrw >= 0) foreignGainKrw += gainKrw;
        else foreignLossKrw += Math.abs(gainKrw);
        foreignSellProceedsKrw += proceedsKrw;
      }
    }

    for (const div of yearDividends) {
      const amountKrw = toKrw(div.amount, history.currency, usdKrwRate);
      if (history.market === Market.KR) domesticDividendKrw += amountKrw;
      else foreignDividendKrw += amountKrw;
    }
  }

  // 국내·해외 양도손익 (대주주는 통산)
  const rawForeignNetKrw = foreignGainKrw - foreignLossKrw;
  let domesticCapitalGainTaxKrw = 0;
  let foreignTaxable = 0;
  let foreignCapitalGainTaxKrw = 0;

  if (profile.isMajorShareholder) {
    const combinedNetGain = Math.max(0, domesticGainKrw + rawForeignNetKrw);
    const taxable = Math.max(0, combinedNetGain - CAPITAL_GAINS_BASIC_DEDUCTION_KRW);
    domesticCapitalGainTaxKrw = majorShareholderGainTax(taxable);
    if (taxable > 0 || combinedNetGain > 0) {
      lines.push({
        id: 'kr-gain-major',
        category: '국내·해외',
        label: '대주주 양도소득세 (국·해외 통산)',
        baseKrw: taxable,
        rate: FOREIGN_CAPITAL_GAINS_RATE,
        taxKrw: domesticCapitalGainTaxKrw,
        note: `순손익 ${Math.round(combinedNetGain).toLocaleString('ko-KR')}원`,
      });
    }
  } else {
    if (domesticGainKrw > 0) {
      lines.push({
        id: 'kr-gain-exempt',
        category: '국내주식',
        label: '매매차익 (비과세)',
        baseKrw: domesticGainKrw,
        rate: 0,
        taxKrw: 0,
        note: '일반 투자자 코스피·코스닥',
      });
    }
    foreignTaxable = Math.max(0, rawForeignNetKrw - CAPITAL_GAINS_BASIC_DEDUCTION_KRW);
    foreignCapitalGainTaxKrw = Math.round(foreignTaxable * FOREIGN_CAPITAL_GAINS_RATE);
    if (rawForeignNetKrw !== 0 || foreignTaxable > 0) {
      lines.push({
        id: 'us-gain',
        category: '해외주식',
        label: '양도소득세 (250만 원 공제 후)',
        baseKrw: foreignTaxable,
        rate: FOREIGN_CAPITAL_GAINS_RATE,
        taxKrw: foreignCapitalGainTaxKrw,
        note: `순손익 ${Math.round(rawForeignNetKrw).toLocaleString('ko-KR')}원`,
      });
    }
  }

  const foreignNetKrw = rawForeignNetKrw;

  // 증권거래세
  const domesticSecuritiesTaxKrw = Math.round(domesticSellProceedsKrw * SECURITIES_TRANSACTION_TAX_RATE);
  if (domesticSecuritiesTaxKrw > 0) {
    lines.push({
      id: 'kr-stt',
      category: '국내주식',
      label: '증권거래세 (매도)',
      baseKrw: domesticSellProceedsKrw,
      rate: SECURITIES_TRANSACTION_TAX_RATE,
      taxKrw: domesticSecuritiesTaxKrw,
    });
  }

  // 배당 분리과세
  const domesticDividendWithheldKrw = Math.round(domesticDividendKrw * DOMESTIC_DIVIDEND_WITHHOLDING_RATE);
  const foreignRule = FOREIGN_DIVIDEND_WITHHOLDING[profile.foreignDividendSource];
  const foreignDividendWithheldKrw = Math.round(foreignDividendKrw * foreignRule.abroadRate);
  const foreignDividendAdditionalTaxKrw = Math.round(foreignDividendKrw * foreignRule.additionalKrRate);

  const totalFinancialIncomeKrw =
    domesticDividendKrw + foreignDividendKrw + profile.otherFinancialIncomeKrw;
  const requiresComprehensiveTax = totalFinancialIncomeKrw > FINANCIAL_INCOME_THRESHOLD_KRW;

  let separationDividendTaxKrw = domesticDividendWithheldKrw + foreignDividendWithheldKrw + foreignDividendAdditionalTaxKrw;
  let comprehensiveTaxKrw = 0;

  if (requiresComprehensiveTax) {
    const totalIncome = profile.estimatedOtherIncomeKrw + totalFinancialIncomeKrw;
    const taxWithFinancial = computeProgressiveTax(totalIncome);
    const taxWithoutFinancial = computeProgressiveTax(profile.estimatedOtherIncomeKrw);
    comprehensiveTaxKrw = Math.max(0, taxWithFinancial - taxWithoutFinancial);
    separationDividendTaxKrw = 0;
    lines.push({
      id: 'fin-comprehensive',
      category: '배당·금융',
      label: '금융소득종합과세 (추정)',
      baseKrw: totalFinancialIncomeKrw,
      rate: marginalRate(totalIncome),
      taxKrw: comprehensiveTaxKrw,
      note: `금융소득 ${(FINANCIAL_INCOME_THRESHOLD_KRW / 10_000).toLocaleString('ko-KR')}만 원 초과`,
    });
  } else {
    if (domesticDividendKrw > 0) {
      lines.push({
        id: 'kr-div',
        category: '국내주식',
        label: '배당소득 원천징수',
        baseKrw: domesticDividendKrw,
        rate: DOMESTIC_DIVIDEND_WITHHOLDING_RATE,
        taxKrw: domesticDividendWithheldKrw,
      });
    }
    if (foreignDividendKrw > 0) {
      lines.push({
        id: 'us-div',
        category: '해외주식',
        label: `배당 (${foreignRule.label})`,
        baseKrw: foreignDividendKrw,
        rate: foreignRule.abroadRate + foreignRule.additionalKrRate,
        taxKrw: foreignDividendWithheldKrw + foreignDividendAdditionalTaxKrw,
        note: foreignRule.note,
      });
    }
  }

  const totalEstimatedTaxKrw =
    domesticCapitalGainTaxKrw +
    foreignCapitalGainTaxKrw +
    domesticSecuritiesTaxKrw +
    (requiresComprehensiveTax ? comprehensiveTaxKrw : separationDividendTaxKrw);

  return {
    year,
    profile,
    domesticCapitalGainKrw: Math.round(domesticGainKrw),
    domesticCapitalGainTaxKrw,
    domesticDividendGrossKrw: Math.round(domesticDividendKrw),
    domesticDividendWithheldKrw,
    domesticSecuritiesTaxKrw,
    foreignCapitalGainNetKrw: Math.round(foreignNetKrw),
    foreignCapitalGainTaxableKrw: Math.round(foreignTaxable),
    foreignCapitalGainTaxKrw,
    foreignDividendGrossKrw: Math.round(foreignDividendKrw),
    foreignDividendWithheldKrw,
    foreignDividendAdditionalTaxKrw,
    totalFinancialIncomeKrw: Math.round(totalFinancialIncomeKrw),
    requiresComprehensiveTax,
    comprehensiveTaxKrw,
    separationDividendTaxKrw,
    totalEstimatedTaxKrw,
    lines,
    disclaimers,
  };
}
