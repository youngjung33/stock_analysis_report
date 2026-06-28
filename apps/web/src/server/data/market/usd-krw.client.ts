import { fetchYahooChartQuote } from './yahoo-chart.client';

export async function fetchUsdKrwRate(): Promise<number | null> {
  try {
    const quote = await fetchYahooChartQuote('KRW=X', '1d');
    return quote.currentPrice > 0 ? quote.currentPrice : null;
  } catch {
    return null;
  }
}
