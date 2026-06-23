import { QuoteChartRange } from '@sar/shared';

export interface StockPricePoint {
  timestamp: string;
  close: number;
}

export interface YahooChartQuote {
  currentPrice: number;
  changePercent: number | null;
  range: QuoteChartRange;
  points: StockPricePoint[];
}

interface YahooChartResult {
  meta?: {
    regularMarketPrice?: number;
    chartPreviousClose?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: (number | null)[];
    }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[];
  };
}

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

interface YahooFetchParams {
  yahooRange: string;
  interval: string;
  lookbackBars: number;
}

function getYahooFetchParams(range: QuoteChartRange): YahooFetchParams {
  switch (range) {
    case '1d':
      return { yahooRange: '1d', interval: '5m', lookbackBars: 0 };
    case '3d':
      return { yahooRange: '5d', interval: '1d', lookbackBars: 2 };
    case '1w':
      return { yahooRange: '5d', interval: '1d', lookbackBars: 4 };
    case '1mo':
      return { yahooRange: '1mo', interval: '1d', lookbackBars: -1 };
    case '3mo':
      return { yahooRange: '3mo', interval: '1d', lookbackBars: -1 };
    case '6mo':
      return { yahooRange: '6mo', interval: '1d', lookbackBars: -1 };
    case 'ytd':
      return { yahooRange: 'ytd', interval: '1d', lookbackBars: -1 };
    case '1y':
      return { yahooRange: '1y', interval: '1d', lookbackBars: -1 };
    case '5y':
      return { yahooRange: '5y', interval: '1wk', lookbackBars: -1 };
    case '10y':
      return { yahooRange: '10y', interval: '1mo', lookbackBars: -1 };
    case 'max':
      return { yahooRange: 'max', interval: '1mo', lookbackBars: -1 };
  }
}

function pickBasePrice(closes: number[], lookbackBars: number): number {
  if (lookbackBars === -1) {
    return closes[0];
  }
  const index = Math.max(0, closes.length - 1 - lookbackBars);
  return closes[index];
}

function extractPoints(result: YahooChartResult): StockPricePoint[] {
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const points: StockPricePoint[] = [];
  const len = Math.min(timestamps.length, closes.length);

  for (let i = 0; i < len; i++) {
    const close = closes[i];
    const ts = timestamps[i];
    if (close === null || close === undefined || close <= 0 || !ts) continue;
    points.push({
      timestamp: new Date(ts * 1000).toISOString(),
      close,
    });
  }

  return points;
}

export async function fetchYahooChartQuote(
  symbol: string,
  range: QuoteChartRange = '1d',
): Promise<YahooChartQuote> {
  const { yahooRange, interval, lookbackBars } = getYahooFetchParams(range);
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?interval=${interval}&range=${yahooRange}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance API error: ${res.status}`);
  }

  const data = (await res.json()) as YahooChartResponse;
  const result = data.chart?.result?.[0];
  const meta = result?.meta;
  const points = result ? extractPoints(result) : [];

  if (range === '1d') {
    const currentPrice = meta?.regularMarketPrice ?? points.at(-1)?.close;
    const previousClose = meta?.chartPreviousClose;

    if (!currentPrice || currentPrice <= 0) {
      throw new Error(`No quote data from Yahoo Finance for ${symbol}`);
    }

    const changePercent =
      previousClose && previousClose > 0
        ? ((currentPrice - previousClose) / previousClose) * 100
        : null;

    return { currentPrice, changePercent, range, points };
  }

  const closes =
    result?.indicators?.quote?.[0]?.close?.filter(
      (price): price is number => price !== null && price !== undefined && price > 0,
    ) ?? [];

  if (closes.length === 0) {
    throw new Error(`No chart data from Yahoo Finance for ${symbol}`);
  }

  const currentPrice = closes[closes.length - 1];
  const basePrice = pickBasePrice(closes, lookbackBars);
  const changePercent =
    basePrice > 0 ? ((currentPrice - basePrice) / basePrice) * 100 : null;

  return { currentPrice, changePercent, range, points };
}
