import { MarketDataConfig } from './market-data.config';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export interface FinnhubEarningsRow {
  symbol: string;
  date: string;
  epsEstimate?: number | null;
  epsActual?: number | null;
  quarter?: number;
  year?: number;
  hour?: string;
}

export interface FinnhubHistoricalEarning {
  actual?: number | null;
  estimate?: number | null;
  period: string;
  quarter: number;
  surprise?: number | null;
  surprisePercent?: number | null;
  symbol: string;
  year: number;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Upcoming/recent earnings dates (±7d window) */
export async function fetchFinnhubEarningsCalendar(
  symbol: string,
  from: Date,
  to: Date,
): Promise<FinnhubEarningsRow[]> {
  const apiKey = new MarketDataConfig().finnhubApiKey;
  if (!apiKey) return [];

  const url = `${FINNHUB_BASE}/calendar/earnings?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = (await res.json()) as { earningsCalendar?: FinnhubEarningsRow[] };
  return data.earningsCalendar ?? [];
}

/** Historical surprise for latest reported quarter */
export async function fetchFinnhubStockEarnings(symbol: string): Promise<FinnhubHistoricalEarning[]> {
  const apiKey = new MarketDataConfig().finnhubApiKey;
  if (!apiKey) return [];

  const url = `${FINNHUB_BASE}/stock/earnings?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  return (await res.json()) as FinnhubHistoricalEarning[];
}
