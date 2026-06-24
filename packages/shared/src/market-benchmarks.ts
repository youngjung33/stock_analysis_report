import { Market } from './enums';

export interface BenchmarkDefinition {
  yahooSymbol: string;
  name: string;
  chartUrl: string;
  tradingViewUrl?: string;
}

export const INDEX_BENCHMARKS: Array<BenchmarkDefinition & { market: Market }> = [
  {
    yahooSymbol: '^KS11',
    name: 'KOSPI',
    market: Market.KR,
    chartUrl: 'https://finance.yahoo.com/quote/%5EKS11/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/KRX-KOSPI/',
  },
  {
    yahooSymbol: '^GSPC',
    name: 'S&P 500',
    market: Market.US,
    chartUrl: 'https://finance.yahoo.com/quote/%5EGSPC/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/SP-SPX/',
  },
  {
    yahooSymbol: '^IXIC',
    name: 'NASDAQ',
    market: Market.US,
    chartUrl: 'https://finance.yahoo.com/quote/%5EIXIC/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/NASDAQ-NDX/',
  },
];

export type MacroKind = 'vix' | 'fx' | 'yield';

export const MACRO_INDICATORS: Array<
  BenchmarkDefinition & { kind: MacroKind; unit: 'index' | 'krw' | 'pct' }
> = [
  {
    yahooSymbol: '^VIX',
    name: 'VIX 공포지수',
    kind: 'vix',
    unit: 'index',
    chartUrl: 'https://finance.yahoo.com/quote/%5EVIX/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/CBOE-VIX/',
  },
  {
    yahooSymbol: 'KRW=X',
    name: 'USD/KRW',
    kind: 'fx',
    unit: 'krw',
    chartUrl: 'https://finance.yahoo.com/quote/KRW%3DX/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/USDKRW/',
  },
  {
    yahooSymbol: '^TNX',
    name: '미국 10년 국채',
    kind: 'yield',
    unit: 'pct',
    chartUrl: 'https://finance.yahoo.com/quote/%5ETNX/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/TVC-US10Y/',
  },
  {
    yahooSymbol: '^FVX',
    name: '미국 5년 국채',
    kind: 'yield',
    unit: 'pct',
    chartUrl: 'https://finance.yahoo.com/quote/%5EFVX/',
    tradingViewUrl: 'https://www.tradingview.com/symbols/TVC-US05Y/',
  },
  {
    yahooSymbol: '^IRX',
    name: '미국 3개월 국채',
    kind: 'yield',
    unit: 'pct',
    chartUrl: 'https://finance.yahoo.com/quote/%5EIRX/',
  },
];

export const US_SECTOR_BENCHMARK = {
  yahooSymbol: 'SPY',
  name: 'S&P 500 ETF',
  chartUrl: 'https://finance.yahoo.com/quote/SPY/',
};

export const KR_SECTOR_BENCHMARK = {
  yahooSymbol: '069500.KS',
  name: 'KODEX 200',
  chartUrl: 'https://finance.yahoo.com/quote/069500.KS/',
};

export const SECTOR_ETFS: Array<
  BenchmarkDefinition & { sectorLabel: string; market: Market; benchmarkSymbol: string }
> = [
  { yahooSymbol: 'XLK', name: 'Technology (XLK)', sectorLabel: '기술', market: Market.US, benchmarkSymbol: 'SPY', chartUrl: 'https://finance.yahoo.com/quote/XLK/' },
  { yahooSymbol: 'SMH', name: 'Semiconductor (SMH)', sectorLabel: '반도체', market: Market.US, benchmarkSymbol: 'SPY', chartUrl: 'https://finance.yahoo.com/quote/SMH/' },
  { yahooSymbol: 'XLF', name: 'Financials (XLF)', sectorLabel: '금융', market: Market.US, benchmarkSymbol: 'SPY', chartUrl: 'https://finance.yahoo.com/quote/XLF/' },
  { yahooSymbol: 'XLE', name: 'Energy (XLE)', sectorLabel: '에너지', market: Market.US, benchmarkSymbol: 'SPY', chartUrl: 'https://finance.yahoo.com/quote/XLE/' },
  { yahooSymbol: 'XLV', name: 'Healthcare (XLV)', sectorLabel: '헬스케어', market: Market.US, benchmarkSymbol: 'SPY', chartUrl: 'https://finance.yahoo.com/quote/XLV/' },
  { yahooSymbol: '091160.KS', name: 'KODEX 반도체', sectorLabel: '반도체', market: Market.KR, benchmarkSymbol: '069500.KS', chartUrl: 'https://finance.yahoo.com/quote/091160.KS/' },
  { yahooSymbol: '091170.KS', name: 'KODEX 은행', sectorLabel: '금융', market: Market.KR, benchmarkSymbol: '069500.KS', chartUrl: 'https://finance.yahoo.com/quote/091170.KS/' },
  { yahooSymbol: '091180.KS', name: 'KODEX 자동차', sectorLabel: '자동차', market: Market.KR, benchmarkSymbol: '069500.KS', chartUrl: 'https://finance.yahoo.com/quote/091180.KS/' },
];

export function yahooChartUrl(symbol: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
}
