export interface YahooChartQuote {
  currentPrice: number;
  changePercent: number | null;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
      };
    }>;
  };
}

const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function fetchYahooChartQuote(symbol: string): Promise<YahooChartQuote> {
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockAnalysisReport/1.0)' },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance API error: ${res.status}`);
  }

  const data = (await res.json()) as YahooChartResponse;
  const meta = data.chart?.result?.[0]?.meta;
  const currentPrice = meta?.regularMarketPrice;
  const previousClose = meta?.chartPreviousClose;

  if (!currentPrice || currentPrice <= 0) {
    throw new Error(`No quote data from Yahoo Finance for ${symbol}`);
  }

  const changePercent =
    previousClose && previousClose > 0
      ? ((currentPrice - previousClose) / previousClose) * 100
      : null;

  return { currentPrice, changePercent };
}
