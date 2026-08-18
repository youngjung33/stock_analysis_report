import { MarketDataConfig } from './market-data.config';

const DART_BASE = 'https://opendart.fss.or.kr/api';

export interface DartDisclosureListItem {
  reportName: string;
  receiptDate: string;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** §11 — DART list.json recent disclosures (Phase L) */
export async function fetchDartDisclosureList(
  corpCode: string,
  lookbackDays = 14,
): Promise<DartDisclosureListItem[]> {
  const apiKey = new MarketDataConfig().dartApiKey;
  if (!apiKey) return [];

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - lookbackDays);

  const url = new URL(`${DART_BASE}/list.json`);
  url.searchParams.set('crtfc_key', apiKey);
  url.searchParams.set('corp_code', corpCode);
  url.searchParams.set('bgn_de', ymd(start));
  url.searchParams.set('end_de', ymd(end));
  url.searchParams.set('page_count', '30');

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    status?: string;
    message?: string;
    list?: Array<{ report_nm?: string; rcept_dt?: string }>;
  };

  if (data.status && data.status !== '000') return [];

  return (data.list ?? [])
    .filter((row) => row.report_nm && row.rcept_dt)
    .map((row) => ({
      reportName: String(row.report_nm),
      receiptDate: String(row.rcept_dt),
    }));
}

export { ymd as formatDartDate };
