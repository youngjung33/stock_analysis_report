export type QuoteChartRange =
  | '1d'
  | '3d'
  | '1w'
  | '1mo'
  | '3mo'
  | '6mo'
  | 'ytd'
  | '1y'
  | '5y'
  | '10y'
  | 'max';

/** UI 표시 순서 (단기 → 장기) */
export const QUOTE_CHART_RANGES: QuoteChartRange[] = [
  '1d',
  '3d',
  '1w',
  '1mo',
  '3mo',
  '6mo',
  'ytd',
  '1y',
  '5y',
  '10y',
  'max',
];

export const QUOTE_RANGE_LABELS: Record<QuoteChartRange, string> = {
  '1d': '오늘',
  '3d': '3일',
  '1w': '1주',
  '1mo': '1달',
  '3mo': '3달',
  '6mo': '6달',
  ytd: '올해',
  '1y': '1년',
  '5y': '5년',
  '10y': '10년',
  max: '최대',
};

const RANGE_SET = new Set<string>(QUOTE_CHART_RANGES);

export function isQuoteChartRange(value: string | null): value is QuoteChartRange {
  return value !== null && RANGE_SET.has(value);
}

export const QUOTE_CHART_RANGE_HINT =
  '1d, 3d, 1w, 1mo, 3mo, 6mo, ytd, 1y, 5y, 10y, max';
