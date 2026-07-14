export interface AmountFormatOptions {
  /** 소수 자릿수 (KRW=0, USD=2 등) */
  maxFractionDigits?: number;
  allowNegative?: boolean;
}

/** 숫자를 천 단위 쉼표로 표시 */
export function formatAmount(
  value: number,
  options: AmountFormatOptions = {},
): string {
  const { maxFractionDigits = 2 } = options;
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

/** 쉼표가 포함된 입력 문자열을 숫자로 변환 */
export function parseAmountInput(value: string): number {
  const normalized = value.replace(/,/g, '').trim();
  if (normalized === '' || normalized === '.' || normalized === '-') return NaN;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * 금액 입력 필드용 포맷 — 입력 중에도 천 단위 쉼표 적용.
 * 소수점 입력 중(예: "123.")은 유지.
 */
export function formatAmountInput(
  raw: string,
  options: AmountFormatOptions = {},
): string {
  const { maxFractionDigits = 0, allowNegative = false } = options;
  const trimmed = raw.trim();
  if (trimmed === '') return '';

  const negative = allowNegative && trimmed.startsWith('-');
  let body = trimmed.replace(/,/g, '');
  if (negative) body = body.slice(1);

  const dotIndex = body.indexOf('.');
  const hasDot = maxFractionDigits > 0 && dotIndex >= 0;

  const intRaw = hasDot ? body.slice(0, dotIndex) : body;
  const decRaw = hasDot ? body.slice(dotIndex + 1) : '';

  const intDigits = intRaw.replace(/\D/g, '');
  const decDigits = decRaw.replace(/\D/g, '').slice(0, maxFractionDigits);

  if (intDigits === '' && !hasDot) {
    return negative ? '-' : '';
  }

  const intNum = intDigits === '' ? 0 : Number(intDigits);
  const intFormatted = intNum.toLocaleString(undefined, { maximumFractionDigits: 0 });

  let result = intFormatted;
  if (hasDot) {
    result += `.${decDigits}`;
  }

  return negative ? `-${result}` : result;
}
